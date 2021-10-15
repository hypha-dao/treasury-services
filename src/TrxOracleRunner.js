const { AccountingAPI, EOSAPI } = require('./service')
const { BTC, Ether, EOS, Telos } = require('./model')
const { TrxOracle } = require('./oracle')

const {
  BWS_CREDENTIALS_DIR,
  BWS_URL,
  BWS_LOG_LEVEL,
  BWS_TIMEOUT,
  DFUSE_EOS_API_KEY,
  DFUSE_EOS_NETWORK,
  DFUSE_ETH_API_KEY,
  DFUSE_ETH_NETWORK,
  DFUSE_TELOS_API_KEY,
  DFUSE_TELOS_NETWORK,
  WEB3_ENDPOINT,
  EOS_ENDPOINT,
  ACCOUNTING_CONTRACT,
  EOS_ACCOUNT,
  EOS_ACCOUNT_KEY,
  BTC_MIN_CONFIRMATIONS
} = process.env

class TrxOracleRunner {
  async run () {
    const trxProviders = [
      new BTC({
        credentialsDir: BWS_CREDENTIALS_DIR,
        baseUrl: BWS_URL,
        logLevel: BWS_LOG_LEVEL,
        timeout: BWS_TIMEOUT,
        minConfirmations: BTC_MIN_CONFIRMATIONS
      }),
      new EOS({
        dfuseApiKey: DFUSE_EOS_API_KEY,
        dfuseNetwork: DFUSE_EOS_NETWORK
      }),
      new Ether({
        dfuseApiKey: DFUSE_ETH_API_KEY,
        dfuseNetwork: DFUSE_ETH_NETWORK,
        web3Endpoint: WEB3_ENDPOINT
      }),
      new Telos({
        dfuseApiKey: DFUSE_TELOS_API_KEY,
        dfuseNetwork: DFUSE_TELOS_NETWORK
      })
    ]
    const eosAPI = new EOSAPI({
      endpoint: EOS_ENDPOINT,
      keys: EOS_ACCOUNT_KEY
    })

    const accountingAPI = new AccountingAPI({
      contract: ACCOUNTING_CONTRACT,
      eosAccount: EOS_ACCOUNT,
      eosAPI
    })
    const oracle = new TrxOracle({
      trxProviders,
      accountingAPI
    })
    await oracle.run()
    console.log('Oracle finished running')
  }
}

(async function () {
  await new TrxOracleRunner().run()
}())
