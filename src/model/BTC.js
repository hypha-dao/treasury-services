const { BTCTrxOp } = require('../const')
const { BTCClient } = require('../service')
const TrxProvider = require('./TrxProvider')

class BTC extends TrxProvider {
  constructor ({
    baseUrl,
    logLevel,
    timeout,
    credentialsDir,
    minConfirmations
  }) {
    super()
    this.minConfirmations = minConfirmations || 5
    this.btcClient = new BTCClient({
      credentialsDir,
      baseUrl,
      logLevel,
      timeout
    })
  }

  getSources () {
    return [
      'btc-treasury-1',
      'btc-treasury-2',
      'btc-treasury-3',
      'btc-treasury-5'
    ]
  }

  async getHomoTransferTrxs ({
    source,
    cursor,
    limit
  }) {
    const trxs = await this.btcClient.listTrxsAsc({
      wallet: source,
      cursor,
      limit,
      minConfirmations: this.minConfirmations,
      ops: [
        BTCTrxOp.SENT,
        BTCTrxOp.RECEIVED
      ]
    })
    const homoTrxs = []
    for (const trx of trxs) {
      const {
        cursor,
        txid: trxId,
        time,
        amount: quantity,
        fees,
        walletId,
        addressTo,
        message: memo,
        action
      } = trx
      let to; let from = null

      if (action === BTCTrxOp.SENT) {
        to = addressTo
        from = walletId
      } else if (action === BTCTrxOp.RECEIVED) {
        to = walletId
      }
      homoTrxs.push({
        cursor,
        treasuryId: source,
        trxId,
        from,
        to,
        quantity,
        memo,
        fees,
        currency: 'BTC',
        timestamp: new Date(time * 1000),
        chainId: 'bip122:000000000019d6689c085ae165831e93'
      })
    }
    return homoTrxs
  }

  async release () {
    await this.btcClient.release()
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
}

module.exports = BTC
