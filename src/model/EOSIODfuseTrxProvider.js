const { EOSIODfuseClient } = require('../service')
const TrxProvider = require('./TrxProvider')

class EOSIODfuseTrxProvider extends TrxProvider {
  constructor ({
    dfuseApiKey,
    dfuseNetwork,
    chainId
  }) {
    super()
    this.dfuseClient = new EOSIODfuseClient({ apiKey: dfuseApiKey, network: dfuseNetwork })
    this.chainId = chainId
  }

  async listTransferTrxs ({
    tokenContract,
    account,
    cursor,
    limit
  }) {
    return this.dfuseClient.listTrxs({
      query: `account:${tokenContract} receiver:${tokenContract} action:transfer (data.from:${account} OR data.to:${account})`,
      cursor,
      limit
    })
  }

  async getHomoTransferTrxs ({
    source,
    cursor,
    limit
  }) {
    const parsed = source.split('-')
    const account = parsed[1]
    const tokenContract = parsed[2]
    const { trxs } = await this.listTransferTrxs({
      tokenContract,
      account,
      cursor,
      limit
    })
    return trxs.map((trx) => {
      const {
        cursor,
        trxId,
        block: {
          timestamp
        },
        action: {
          json: {
            from,
            to,
            memo,
            quantity: amount
          }
        }
      } = trx
      const [quantity, currency] = amount.split(' ')
      return {
        cursor,
        treasuryId: source,
        trxId,
        from,
        to,
        quantity,
        memo,
        currency,
        timestamp: new Date(timestamp),
        chainId: this.chainId
      }
    })
  }

  async release () {
    this.dfuseClient.release()
  }
}

module.exports = EOSIODfuseTrxProvider
