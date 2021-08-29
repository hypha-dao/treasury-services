const { EOSIODfuseClient } = require('../service')
const EOSIODfuseTrxProvider = require('./EOSIODfuseTrxProvider')

class EOS extends EOSIODfuseTrxProvider {
  constructor ({
    dfuseApiKey,
    dfuseNetwork
  }) {
    super({
      dfuseApiKey,
      dfuseNetwork,
      chainId: 'eosio:aca376f206b8fc25a6ed44dbdc66547c'
    })
    this.dfuseClient = new EOSIODfuseClient({ apiKey: dfuseApiKey, network: dfuseNetwork })
  }

  getSources () {
    return ['eos-thehyphabank-eosio.token']
  }
}

module.exports = EOS
