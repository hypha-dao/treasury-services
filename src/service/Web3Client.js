const Web3 = require('web3')
const ERC20Contract = require('./ERC20Contract')
const { GenericTokenContract } = require('../abi/ethereum')

class Web3Client {
  constructor (web3Endpoint) {
    this.erc20Contracts = {}
    const options = {
      timeout: 30000, // ms
      clientConfig: {
        // Useful to keep a connection alive
        keepalive: true,
        keepaliveInterval: 60000 // ms
      },
      // Enable auto reconnection
      reconnect: {
        auto: true,
        delay: 3000, // ms
        maxAttempts: 5,
        onTimeout: false
      }
    }
    this.ws = new Web3.providers.WebsocketProvider(web3Endpoint, options)
    this.web3 = new Web3(this.ws)
  }

  getContract (contractABI, contractAddress) {
    return new this.web3.eth.Contract(contractABI, contractAddress)
  }

  async getERC20Contract (contractAddress) {
    if (!this.erc20Contracts[contractAddress]) {
      const contract = new this.web3.eth.Contract(GenericTokenContract, contractAddress)
      const erc20Contract = new ERC20Contract(contract)
      await erc20Contract.init()
      this.erc20Contracts[contractAddress] = erc20Contract
    }
    return this.erc20Contracts[contractAddress]
  }

  async getBalance (address, contractAddress = null) {
    return contractAddress ? this._getERC20Balance(address, contractAddress) : this._getEthBalance(address)
  }

  async _getERC20Balance (address, contractAddress) {
    const contract = await this.getERC20Contract(contractAddress)
    return contract.getBalance(address)
  }

  async _getEthBalance (address) {
    const weiBalance = await this.web3.eth.getBalance(address)
    return {
      weiBalance,
      balance: this.web3.utils.fromWei(weiBalance),
      symbol: 'ETH'
    }
  }

  async release () {
    return this.ws.disconnect()
  }
}

module.exports = Web3Client
