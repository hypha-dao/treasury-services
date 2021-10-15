// {"id":"bitcoin","symbol":"btc","name":"Bitcoin"}
// eos
// ethereum
// tether

class TrxOracle {
  constructor ({
    trxProviders,
    accountingAPI,
    limit
  }) {
    this.trxProviders = trxProviders
    this.limit = limit || 50
    this.accountingAPI = accountingAPI
    this.cursorMap = null
  }

  async run () {
    const promises = []
    await this._loadCursors()
    for (const trxProvider of this.trxProviders) {
      const sources = trxProvider.getSources()
      for (const source of sources) {
        promises.push(this._processSource(source, trxProvider))
      }
    }
    await Promise.all(promises)
      .catch(function (err) {
        console.log('Error processing source: ', err)
      })
    for (const trxProvider of this.trxProviders) {
      try {
        await trxProvider.release()
      } catch (error) {
        console.log('Error releasing providers: ', error)
      }
    }
  }

  async _processSource (source, trxProvider) {
    try {
      let cursor = await this._getCursor(source)
      while (true) {
        const trxs = await trxProvider.getHomoTransferTrxs({
          source,
          cursor,
          limit: this.limit
        })
        console.log(`trx length: ${trxs.length}`)
        if (!trxs.length) {
          console.log(`Finished processing: ${source}`)
          return
        }
        for (const trx of trxs) {
          // const {
          //   quantity,
          //   currency,
          //   timestamp
          // } = trx
          // trx.usdValue = await this._getUsdValue({
          //   quantity,
          //   currency,
          //   timestamp
          // })
          cursor = trx.cursor
          const docTrx = this._toDocFormat(trx, source, cursor)
          await this._pushTrx(docTrx)
        }
      }
    } catch (err) {
      console.log(`Error processing source: ${source}, error: `, err)
      throw err
    }
  }

  async _pushTrx (trx) {
    console.log(JSON.stringify(trx, null, 4))
    // return null
    return this.accountingAPI.trx(trx)
  }

  async _getCursor (source) {
    // return null
    return this.cursorMap[source]
  }

  async _loadCursors () {
    // return null
    this.cursorMap = await this.accountingAPI.getCursorMap()
    console.log('Cursor Map: ', this.cursorMap)
  }
  //  Not way to get exchange rate
  // async _getUsdValue (quantity, currency, timestamp) {
  //   return 100
  // }

  _toDocFormat ({
    treasuryId,
    trxId,
    from,
    to,
    quantity,
    currency,
    timestamp,
    memo,
    chainId,
    usdValue
  }, source, cursor) {
    const contents = []
    this._addContent(contents, 'source', source)
    this._addContent(contents, 'cursor', cursor)
    this._addContent(contents, 'content_group_label', 'details')
    this._addContent(contents, 'treasury_id', treasuryId)
    this._addContent(contents, 'transaction_id', trxId)
    this._addContent(contents, 'from', from)
    this._addContent(contents, 'to', to)
    this._addContent(contents, 'quantity', quantity)
    this._addContent(contents, 'currency', currency)
    this._addContent(contents, 'timestamp', timestamp.toISOString())
    // this._addContent(contents, 'usd_value', usdValue)
    this._addContent(contents, 'memo', memo)
    this._addContent(contents, 'chainId', chainId)
    return [
      contents
    ]
  }

  _addContent (contents, label, value, type = 'string') {
    if (value != null) {
      contents.push(this._toContent(label, value, type))
    }
  }

  _toContent (label, value, type = 'string') {
    return {
      label,
      value: [
        type,
        value
      ]
    }
  }
}

module.exports = TrxOracle
