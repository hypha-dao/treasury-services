const { DfuseClient, ethereumABIDecoder, Web3Client } = require('../service')
const { EtherTrxStatus } = require('../const')

const { USDT } = require('../abi/ethereum')

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
      method{
        hexSignature
        textSignature
      }
      inputData
      matchingCalls{
        from
        to
        callType
        value
      }
      allLogs{
        address
        topics
        data
        blockIndex
        transactionIndex
      }
    }
   }
   pageInfo{
    endCursor
   }
  }
}`

const methodsToDecode = {
  '0x6a761202': 'transfer'
}

class Ether {
  constructor ({
    dfuseApiKey,
    dfuseNetwork,
    web3Endpoint
  }) {
    this.dfuseClient = new DfuseClient({ apiKey: dfuseApiKey, network: dfuseNetwork })
    this.web3 = new Web3Client(web3Endpoint)
    this.tokenContracts = { }
    ethereumABIDecoder.addABI(USDT)
  }

  async getBalance ({
    address,
    contractAddress = null
  }) {
    return this.web3.getBalance(address, contractAddress)
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
      query: `(to:${address} OR from:${address})`,
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
      edges = edges.map(async edge => this._decodeERC20Transfer(edge))
      edges = await Promise.all(edges)
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

  async _decodeERC20Transfer (edge) {
    const {
      block,
      node: {
        hash,
        from,
        to,
        value,
        gasPrice,
        gasLimit,
        gasUsed,
        status,
        method: {
          hexSignature
        },
        allLogs
      }
    } = edge
    let erc20Transfer = null
    if (methodsToDecode[hexSignature]) {
      console.log(hash)
      const result = ethereumABIDecoder.decodeLogs(allLogs)
      console.log(JSON.stringify(result, null, 4))
      if (result && result[0]) {
        const transfer = result[0]
        if (transfer.name.toLowerCase() === 'transfer') {
          const {
            address,
            events: [from, to, value]
          } = transfer
          const contract = await this.web3.getERC20Contract(address)
          erc20Transfer = {
            from: from.value,
            to: to.value,
            value: contract.normalizeAmount(value.value),
            symbol: contract.symbol
          }
        }
      }
    }
    return {
      block,
      node: {
        hash,
        from,
        to,
        value,
        gasPrice,
        gasLimit,
        gasUsed,
        status,
        erc20Transfer
      }
    }
  }
}

module.exports = Ether
