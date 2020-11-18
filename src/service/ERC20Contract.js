class ERC20Contract {
  constructor (web3Contract) {
    this.contract = web3Contract
    this.decimals = null
    this.symbol = null
  }

  async init () {
    this.decimals = await this.contract.methods.decimals().call()
    this.symbol = await this.contract.methods.symbol().call()
  }

  normalizeAmount (amount) {
    return (Number(amount) / (10 ** this.decimals)).toString()
  }

  async getBalance (address) {
    const balance = await this.contract.methods.balanceOf(address).call()
    return {
      balance: this.normalizeAmount(balance),
      symbol: this.symbol
    }
  }
}

module.exports = ERC20Contract
