const { TransferDirection } = require('../const')
const { HyperionClient } = require('../service')

class Telos {
  constructor (baseURL) {
    this.client = new HyperionClient(baseURL)
  }

  async listTrxs ({
    tokenContract,
    account,
    transferDirection,
    skip,
    limit
  }) {
    skip = skip || 0
    limit = limit || 100
    const params = {
      'act.name': 'transfer',
      skip,
      limit,
      sort: 'asc',
      simple: true,
      noBinary: true,
      checkLib: true
    }
    if (account) {
      params[transferDirection === TransferDirection.IN ? 'transfer.to' : 'transfer.from'] = account
    }
    if (tokenContract) {
      params['act.account'] = tokenContract
    }
    const { simple_actions: trxs } = await this.client.getActions(params)
    return { trxs }
  }
}

module.exports = Telos
