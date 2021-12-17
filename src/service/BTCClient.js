const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const Client = require('bitcore-wallet-client').default
const sjcl = require('sjcl')

class BTCClient {
  constructor ({
    baseUrl,
    logLevel,
    timeout,
    credentialsDir
  }) {
    this.clients = {}
    this.wallets = {}
    this.baseUrl = baseUrl
    this.logLevel = logLevel
    this.timeout = timeout
    this.credentialsDir = credentialsDir
  }

  async listTrxs ({
    wallet,
    cursor,
    limit,
    untilTrxId,
    minConfirmations,
    ops
  }) {
    limit = limit || 100
    minConfirmations = minConfirmations || 0
    let pageLimit = limit
    let {
      nextTrxId,
      skip
    } = this._parseCursor(cursor)
    skip = skip || 0
    const client = await this._getWallet(wallet)
    let trxs = []
    while (true) {
      console.log(`skip: ${skip}, pageLimit:${pageLimit}`)
      let txPage = await client.getTxHistoryAsync({
        skip,
        limit: pageLimit + (nextTrxId ? 1 : 0),
        includeExtendedInfo: false
      })
      // console.log(JSON.stringify(txPage, null, 4))
      txPage = txPage.map((tx, i) => {
        tx.cursor = this._getCursor(skip + i, tx.txid)
        return tx
      })
      console.log(`txPage length: ${txPage.length} nextTrxId: ${nextTrxId}`)
      if (!txPage.length || (txPage.length === 1 && nextTrxId === txPage[0].txid)) {
        return {
          trxs,
          cursor: this._getCursor(skip, nextTrxId)
        }
      }
      skip += txPage.length - 1
      if (nextTrxId) {
        const trxPos = this._findTrx(txPage, nextTrxId)
        if (trxPos > -1) {
          txPage = txPage.slice(trxPos + 1)
          // if (txPage.length) { nextTrxId = null }
        } else {
          txPage = []
        }
      }
      if (untilTrxId) {
        const trxPos = this._findTrx(txPage, untilTrxId)
        if (trxPos > -1) {
          const excess = txPage.length - trxPos
          txPage = txPage.slice(0, trxPos)
          if (trxPos > 0) {
            nextTrxId = txPage[txPage.length - 1].txid
          }
          trxs = trxs.concat(this._filterTrxs(txPage, minConfirmations, ops))
          cursor = this._getCursor(skip - excess, nextTrxId)
          return {
            trxs,
            untilTrxFound: true,
            cursor
          }
        }
      }
      if (txPage.length) {
        nextTrxId = txPage[txPage.length - 1].txid
      }
      txPage = this._filterTrxs(txPage, minConfirmations, ops)
      console.log(`After filtering txPage length: ${txPage.length}`)
      trxs = trxs.concat(txPage)
      const leftToFetch = limit - trxs.length

      if (leftToFetch <= 0) {
        return {
          cursor: this._getCursor(skip, nextTrxId),
          trxs
        }
      }
      pageLimit = Math.min(pageLimit, leftToFetch)
    }
  }

  async listTrxsAsc ({
    wallet,
    cursor,
    limit,
    minConfirmations,
    ops
  }) {
    const prepareResults = (results, skip) => {
      const excess = results.length - limit
      if (excess > 0) {
        results = results.slice(excess)
        skip += excess
      }
      return results.map((result) => ({
        ...result,
        walletId: this.wallets[wallet].wallet.id
      })).reverse()
    }

    limit = limit || 100
    let results = []
    if (!cursor) {
      const { trxs, skip } = await this.fetchOldestTrxs({
        wallet,
        minConfirmations,
        ops
      })
      if (!trxs.length) {
        return trxs
      } else if (trxs.length >= limit) {
        return prepareResults(trxs, skip)
      }
      cursor = this._getCursor(skip, trxs[0].txid)
      results = trxs
    }
    let { nextTrxId, skip } = this._parseCursor(cursor)
    const leftToFetch = limit - results.length
    skip -= leftToFetch
    skip = skip < 0 ? 0 : skip
    let fCursor = this._getCursor(skip)
    let partialResults = []
    while (true) {
      const response = await this.listTrxs({
        wallet,
        cursor: fCursor,
        limit: leftToFetch + 20,
        untilTrxId: nextTrxId,
        minConfirmations,
        ops
      })
      const { trxs, untilTrxFound } = response
      partialResults = partialResults.concat(trxs).slice(-1 * leftToFetch)
      if (untilTrxFound) {
        results = partialResults.concat(results)
        return prepareResults(results, skip)
      } else if (!trxs.length) {
        throw new Error(`UntilTrxId not found: ${nextTrxId}`)
      }
      fCursor = response.cursor
    }
  }

  async fetchOldestTrxs ({
    wallet,
    skip = 1000,
    limit = 50,
    minConfirmations,
    ops
  }) {
    let totalSkip = 0
    let binarySearch = false
    skip = skip || 1000
    limit = limit || 100
    while (true) {
      const cursor = `;${totalSkip}`
      const { trxs } = await this.listTrxs({
        wallet,
        cursor,
        limit,
        minConfirmations,
        ops
      })
      if (!trxs.length) {
        if (!totalSkip) {
          return {
            skip: 0,
            trxs
          }
        }
        binarySearch = true
      } else if (trxs.length < limit) {
        return {
          skip: totalSkip,
          trxs
        }
      }
      if (binarySearch) {
        skip = Math.max(Math.floor(skip / 2), limit)
      }
      totalSkip += (trxs.length ? 1 : -1) * skip
    }
  }

  async release () {
    for (const wallet in this.clients) {
      await this.clients[wallet].disposeAsync()
    }
  }

  _filterTrxs (txs, minConfirmations, ops) {
    const filtered = []
    for (let i = txs.length - 1; i >= 0; i--) {
      const tx = txs[i]
      const {
        action,
        confirmations
      } = tx
      if (confirmations < minConfirmations) {
        return filtered
      }
      if (!ops || ops.includes(action)) {
        filtered.unshift(tx)
      }
    }
    return filtered
  }

  /**
   *
   * @param {Array} txs
   * @param {string} txId
   */
  _findTrx (txs, txId) {
    return txs.findIndex(tx => tx.txid === txId)
  }

  _getCursor (skip, nextTrxId = '') {
    nextTrxId = nextTrxId || ''
    if (skip < 0) {
      skip = 0
    }
    return `${nextTrxId};${skip}`
  }

  /**
   *
   * @param {string} cursor
   */
  _parseCursor (cursor) {
    if (!cursor) {
      return {
        nextTrxId: null,
        skip: 0
      }
    }
    const [nextTrxId, skip] = cursor.split(';')
    return {
      nextTrxId,
      skip: parseInt(skip)
    }
  }

  async _getWallet (wallet) {
    try {
      if (!this.clients[wallet]) {
        const client = this._createClient()
        const basePath = path.join(this.credentialsDir, wallet)
        let walletInfo = this._readFile(`${basePath}.json`)
        const password = this._readFile(`${basePath}.key`)
        console.log('walletInfo: ', walletInfo)
        console.log('psd: ', password)
        walletInfo = sjcl.decrypt(password, walletInfo)
        walletInfo = JSON.parse(walletInfo)
        client.fromObj(walletInfo.credentials)
        this.clients[wallet] = client
        const walletStatus = await client.getStatusAsync({})
        this.wallets[wallet] = walletStatus
        console.log('Opening wallet: ', JSON.stringify(walletStatus, null, 4))
      }
      return this.clients[wallet]
    } catch (error) {
      console.error('Error getting wallet: ', error)
      delete this.clients[wallet]
      throw new Error('An error occurred while getting wallet, please make sure the wallet name is correct')
    }
  }

  _readFile (fileName) {
    return fs.readFileSync(fileName, {
      encoding: 'utf8'
    })
  }

  _createClient () {
    return Promise.promisifyAll(
      new Client({
        baseUrl: this.baseUrl,
        logLevel: this.logLevel,
        timeout: this.timeout
      }))
  }
}

module.exports = BTCClient
