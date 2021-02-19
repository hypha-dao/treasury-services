const { EOSIODfuseClient } = require('../service')
const TrxProvider = require('./TrxProvider')

class EOS extends TrxProvider {
  constructor ({
    dfuseApiKey,
    dfuseNetwork
  }) {
    super()
    this.dfuseClient = new EOSIODfuseClient({ apiKey: dfuseApiKey, network: dfuseNetwork })
  }

  async listTrxs ({
    account,
    cursor,
    limit
  }) {
    return this.dfuseClient.listTrxs({
      query: `account:eosio.token receiver:eosio.token action:transfer (data.from:${account} OR data.to:${account})`,
      cursor,
      limit
    })
  }

  getSources () {
    return ['eos-thehyphabank']
  }

  async getHomoTrxs ({
    source,
    cursor,
    limit
  }) {
    const account = source.split('-')[1]
    const { trxs } = await this.listTrxs({
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
        chainId: 'eosio:aca376f206b8fc25a6ed44dbdc66547c'
      }
    })
  }

  async release () {
    this.dfuseClient.release()
  }
}

module.exports = EOS
