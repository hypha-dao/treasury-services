const DfuseClient = require('./DfuseClient')
const cursorRegex = /(.*)__([0-9]+)$/
const listQuery = `query ($query: String!, $cursor: String, $limit: Int64, $irreversibleOnly: Boolean) {
  searchTransactionsForward(query: $query, limit: $limit, cursor: $cursor, irreversibleOnly:$irreversibleOnly) {
    results {
      cursor
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

class EOSIODfuseClient extends DfuseClient {
  async listTrxs ({
    query,
    cursor,
    limit
  }) {
    const trxs = []
    limit = limit || 100
    let pageLimit = limit
    let { cursor: dcursor, actionIndex } = this._parseCursor(cursor)
    const variables = {
      query,
      cursor: dcursor,
      limit: pageLimit,
      irreversibleOnly: true
    }
    while (true) {
      const response = await this.query(listQuery, { variables })
      const {
        searchTransactionsForward: {
          results
        }
      } = response
      if (!results.length) {
        return {
          trxs,
          hasMore: false
        }
      }
      let leftToFetch
      for (const result of results) {
        const {
          block,
          id: trxId,
          matchingActions
        } = result.trace
        const stop = Math.min(matchingActions.length, limit - trxs.length)
        for (let i = actionIndex; i < stop; i++) {
          trxs.push({
            cursor: `${dcursor}__${i + 1}`,
            block,
            trxId,
            action: matchingActions[i]
          })
        }
        dcursor = result.cursor
        actionIndex = 0
        // console.log(`trxs.length: ${trxs.length} limit: ${limit}`)
        leftToFetch = limit - trxs.length
        if (leftToFetch <= 0) {
          return {
            trxs,
            hasMore: true
          }
        }
      }
      pageLimit = Math.min(pageLimit, leftToFetch)
      variables.cursor = dcursor
    }
  }

  _parseCursor (cursor) {
    if (cursor) {
      const results = cursor.match(cursorRegex)
      if (results) {
        return {
          cursor: results[1],
          actionIndex: Number(results[2])
        }
      }
    }
    return {
      cursor: '',
      actionIndex: 0
    }
  }
}

module.exports = EOSIODfuseClient
