const { DfuseClient } = require('../service')

const listQuery = `query ($query: String!, $cursor: String, $limit: Int64, $irreversibleOnly: Boolean) {
  searchTransactionsForward(query: $query, limit: $limit, cursor: $cursor, irreversibleOnly:$irreversibleOnly) {
    cursor
    results {
      trace {
        block {
          num
          id
          timestamp
        }
        id
        matchingActions {
          account
          name
          json
          seq
        }
      }
    }
  }
}`

class EOS {
  constructor ({
    dfuseApiKey,
    dfuseNetwork
  }) {
    this.dfuseClient = new DfuseClient({ apiKey: dfuseApiKey, network: dfuseNetwork })
  }

  async listTrxs ({
    account,
    cursor,
    limit
  }) {
    let trxs = []
    limit = limit || 100
    let pageLimit = limit
    const variables = {
      query: `account:eosio.token receiver:eosio.token action:transfer (data.from:${account} OR data.to:${account})`,
      cursor,
      limit: pageLimit,
      irreversibleOnly: true
    }
    while (true) {
      const response = await this.dfuseClient.query(listQuery, { variables })
      const {
        searchTransactionsForward: {
          cursor: endCursor,
          results
        }
      } = response
      if (!results.length) {
        return {
          trxs,
          cursor,
          hasMore: false
        }
      }
      cursor = endCursor
      trxs = trxs.concat(results)
      const leftToFetch = limit - trxs.length
      console.log(`trxs.length: ${trxs.length} leftToFetch: ${leftToFetch}`)
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
}

module.exports = EOS
