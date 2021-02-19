const { DfuseClient, ethereumABIDecoder, Web3Client } = require('../service')
const { EtherTrxStatus } = require('../const')
const TrxProvider = require('./TrxProvider')

const { USDT } = require('../abi/ethereum')

const listQuery = `query ($query: String!, $sort: SORT, $cursor: String, $limit: Int64) {
  searchTransactions(indexName: CALLS, query: $query, sort: $sort, cursor: $cursor, limit: $limit) {
   edges{
    cursor
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
      value(encoding:ETHER)
      gasPrice(encoding:ETHER)
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

class Ether extends TrxProvider {
  constructor ({
    dfuseApiKey,
    dfuseNetwork,
    web3Endpoint
  }) {
    super()
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

  /**
   * TODO analyze the not decoded transactions, useful to compare to query in: https://mainnet.eth.dfuse.io/graphiql/?query=cXVlcnkgKCRxdWVyeTogU3RyaW5nISwgJHNvcnQ6IFNPUlQsICRsb3c6IEludDY0LCAkaGlnaDogSW50NjQsICRsaW1pdDogSW50NjQpIHsKICBzZWFyY2hUcmFuc2FjdGlvbnMoaW5kZXhOYW1lOiBDQUxMUywgcXVlcnk6ICRxdWVyeSwgc29ydDogJHNvcnQsIGxvd0Jsb2NrTnVtOiAkbG93LCBoaWdoQmxvY2tOdW06ICRoaWdoLCBsaW1pdDogJGxpbWl0KSB7CiAgICBwYWdlSW5mbyB7CiAgICAgIHN0YXJ0Q3Vyc29yCiAgICAgIGVuZEN1cnNvcgogICAgfQogICAgZWRnZXMgewogICAgICB1bmRvCiAgICAgIGN1cnNvcgogICAgICBibG9jayB7CiAgICAgICAgaGFzaAogICAgICAgIG51bWJlcgogICAgICB9CiAgICAgIG5vZGUgewogICAgICAgIGhhc2gKICAgICAgICBmcm9tCiAgICAgICAgdG8KICAgICAgICB2YWx1ZShlbmNvZGluZzogRVRIRVIpCiAgICAgICAgZ2FzTGltaXQKICAgICAgICBnYXNQcmljZShlbmNvZGluZzogRVRIRVIpCiAgICAgICAgbWV0aG9kIHsKICAgICAgICAgIHRleHRTaWduYXR1cmUKICAgICAgICAgIGhleFNpZ25hdHVyZQogICAgICAgIH0KICAgICAgICBpbnB1dERhdGEKICAgICAgICBhbGxMb2dzewogICAgICAgIGFkZHJlc3MKICAgICAgICB0b3BpY3MKICAgICAgICBkYXRhCiAgICAgICAgYmxvY2tJbmRleAogICAgICAgIHRyYW5zYWN0aW9uSW5kZXgKICAgICAgfQogICAgICAgIG1hdGNoaW5nQ2FsbHMgewogICAgICAgICAgY2FsbFR5cGUKICAgICAgICAgIGZyb20KICAgICAgICAgIHRvCiAgICAgICAgICB2YWx1ZQogICAgICAgICAgaW5wdXREYXRhCiAgICAgICAgICByZXR1cm5EYXRhCiAgICAgICAgICBtZXRob2QgewogICAgICAgICAgICBoZXhTaWduYXR1cmUKICAgICAgICAgICAgdGV4dFNpZ25hdHVyZQogICAgICAgICAgfQogICAgICAgICAgYmFsYW5jZUNoYW5nZXMgewogICAgICAgICAgICBhZGRyZXNzCiAgICAgICAgICAgIG5ld1ZhbHVlKGVuY29kaW5nOiBFVEhFUikKICAgICAgICAgICAgcmVhc29uCiAgICAgICAgICB9CiAgICAgICAgICBsb2dzIHsKICAgICAgICAgICAgYWRkcmVzcwogICAgICAgICAgICB0b3BpY3MKICAgICAgICAgICAgZGF0YQogICAgICAgICAgfQogICAgICAgICAgc3RvcmFnZUNoYW5nZXMgewogICAgICAgICAgICBrZXkKICAgICAgICAgICAgb2xkVmFsdWUKICAgICAgICAgICAgbmV3VmFsdWUKICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIH0KICAgIH0KICB9Cn0K&variables=ewogICJxdWVyeSI6ICIodG86MHhDMjBmNDUzYTRCNDk5NUNBMDMyNTcwZjIxMjk4OEY0OTc4QjM1ZERkIE9SIGZyb206MHhDMjBmNDUzYTRCNDk5NUNBMDMyNTcwZjIxMjk4OEY0OTc4QjM1ZERkKSIsCiAgInNvcnQiOiAiQVNDIiwKICAibG93IjogMSwKICAibGltaXQiOiAyNQp9
   *
   */
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

  getSources () {
    return ['ether-0xC20f453a4B4995CA032570f212988F4978B35dDd']
  }

  async getHomoTrxs ({
    source,
    cursor,
    limit
  }) {
    const address = source.split('-')[1]
    let { trxs } = await this.listTrxs({
      address,
      cursor,
      limit
    })
    trxs = trxs.filter((trx) => Number(trx.node.value) || trx.node.erc20Transfer)
    return trxs.map((trx) => {
      const {
        cursor,
        block: {
          header: { timestamp }
        },
        node,
        node: {
          hash: trxId,
          gasPrice,
          gasUsed,
          erc20Transfer
        }
      } = trx
      return {
        cursor,
        treasuryId: source,
        trxId,
        gasPrice,
        gasUsed,
        ...(erc20Transfer ? this._processERC20Trx(erc20Transfer) : this._processEtherTrx(node)),
        timestamp: new Date(Number(timestamp)),
        chainId: 'eip155:1'
      }
    })
  }

  async release () {
    this.dfuseClient.release()
    await this.web3.release()
  }

  _processEtherTrx (node) {
    const {
      from,
      to,
      value: quantity
    } = node
    return {
      from,
      to,
      quantity,
      currency: 'ETHER'
    }
  }

  _processERC20Trx (erc20Transfer) {
    const {
      from,
      to,
      value: quantity,
      symbol: currency
    } = erc20Transfer
    return {
      from,
      to,
      quantity,
      currency
    }
  }

  async _decodeERC20Transfer (edge) {
    const {
      cursor,
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
      // console.log(hash)
      const result = ethereumABIDecoder.decodeLogs(allLogs)
      // console.log(JSON.stringify(result, null, 4))
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
      cursor,
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
