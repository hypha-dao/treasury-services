const { TransferDirection, TokenOp } = require('../const')
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
    console.log('Number of trxs: ', trxs.length)
    return { trxs }
  }

  async listTokenOps ({
    tokenContract,
    tokenOp,
    skip,
    limit
  }) {
    skip = skip || 0
    limit = limit || 100
    tokenOp = tokenOp || TokenOp.ISSUE
    const params = {
      'act.name': tokenOp,
      skip,
      limit,
      sort: 'asc',
      simple: true,
      noBinary: true,
      checkLib: true
    }
    if (tokenContract) {
      params['act.account'] = tokenContract
    }
    const { simple_actions: tokenOps } = await this.client.getActions(params)
    console.log('Number of trxs: ', tokenOps.length)
    return { tokenOps }
  }
}

module.exports = Telos
