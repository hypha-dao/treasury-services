const Web3 = require('web3')
const { DfuseClient } = require('../service')
const { EtherTrxStatus } = require('../const')

const tokenContractAbi = [
  // balanceOf
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  // decimals
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  }
]

const listQuery = `query ($query: String!, $sort: SORT, $cursor: String, $limit: Int64) {
  searchTransactions(indexName: CALLS, query: $query, sort: $sort, cursor: $cursor, limit: $limit) {
   edges{
    block{
      hash
      number
      header{
        timestamp
      }
    }
    node{
      hash
      from
      to
      value(encoding:WEI)
      gasPrice(encoding:WEI)
      gasLimit
      gasUsed
      status
    }
   }
   pageInfo{
    endCursor
   }
  }
}`

class Ether {
  constructor ({
    dfuseApiKey,
    dfuseNetwork,
    web3Endpoint
  }) {
    this.dfuseClient = new DfuseClient({ apiKey: dfuseApiKey, network: dfuseNetwork })
    this.web3 = this._createWeb3Client(web3Endpoint)
    this.tokenContracts = { }
  }

  async getBalance ({
    address,
    contractAddress = null
  }) {
    return contractAddress ? this._getTokenContractBalance(address, contractAddress) : this._getEthBalance(address)
  }

  async listTrxs ({
    address,
    cursor,
    limit
  }) {
    let trxs = []
    limit = limit || 100
    let pageLimit = limit
    const variables = {
      query: `-value:0 (to:${address} OR from:${address})`,
      cursor,
      limit: pageLimit,
      sort: 'ASC'
    }
    while (true) {
      const response = await this.dfuseClient.query(listQuery, { variables })
      let {
        searchTransactions: {
          edges,
          pageInfo: {
            endCursor
          }
        }
      } = response
      if (!edges.length) {
        return {
          trxs,
          cursor,
          hasMore: false
        }
      }
      cursor = endCursor
      edges = edges.filter(({ node: { status } }) => status === EtherTrxStatus.SUCCEEDED)
      trxs = trxs.concat(edges)
      const leftToFetch = limit - trxs.length
      if (leftToFetch <= 0) {
        return {
          trxs,
          cursor,
          hasMore: true
        }
      }
      pageLimit = Math.min(pageLimit, leftToFetch)
      variables.cursor = cursor
    }
  }

  _createWeb3Client (web3Endpoint) {
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
    const ws = new Web3.providers.WebsocketProvider(web3Endpoint, options)
    return new Web3(ws)
  }

  async _getTokenContractBalance (address, contractAddress) {
    const contractInfo = await this._getTokenContract(contractAddress)
    const { contract, decimals, symbol } = contractInfo
    let balance = await contract.methods.balanceOf(address).call()
    balance = (balance / (10 ** decimals)).toString()
    return {
      balance,
      symbol
    }
  }

  async _getTokenContract (contractAddress) {
    if (!this.tokenContracts[contractAddress]) {
      const contract = new this.web3.eth.Contract(tokenContractAbi, contractAddress)
      const decimals = await contract.methods.decimals().call()
      const symbol = await contract.methods.symbol().call()
      this.tokenContracts[contractAddress] = { contract, decimals, symbol }
    }
    return this.tokenContracts[contractAddress]
  }

  async _getEthBalance (address) {
    const weiBalance = await this.web3.eth.getBalance(address)
    return {
      weiBalance,
      balance: this.web3.utils.fromWei(weiBalance),
      symbol: 'ETH'
    }
  }
}

module.exports = Ether
