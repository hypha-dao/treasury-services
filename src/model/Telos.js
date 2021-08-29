const { EOSIODfuseClient } = require('../service')
const EOSIODfuseTrxProvider = require('./EOSIODfuseTrxProvider')

class TELOS extends EOSIODfuseTrxProvider {
  constructor ({
    dfuseApiKey,
    dfuseNetwork
  }) {
    super({
      dfuseApiKey,
      dfuseNetwork,
      chainId: 'eosio:4667b205c6838ef70ff7988f6e8257e8'
    })
    this.dfuseClient = new EOSIODfuseClient({ apiKey: dfuseApiKey, network: dfuseNetwork })
  }

  getSources () {
    return [
      'telos-dao.hypha-eosio.token',
      'telos-dao.hypha-husd.hypha',
      'telos-dao.hypha-token.hypha',
      'telos-dao.hypha-token.seeds',
      'telos-seeds.hypha-eosio.token',
      'telos-seeds.hypha-husd.hypha',
      'telos-seeds.hypha-token.hypha',
      'telos-seeds.hypha-token.seeds',
      'telos-bank.hypha-eosio.token',
      'telos-bank.hypha-husd.hypha',
      'telos-bank.hypha-token.hypha',
      'telos-bank.hypha-token.seeds'
    ]
  }
}

module.exports = TELOS
