const { Api, JsonRpc } = require('eosjs')
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig')
const fetch = require('node-fetch')
const { TextEncoder, TextDecoder } = require('util')

class EOSAPI {
  constructor ({
    endpoint,
    keys
  }) {
    console.log('endpoint: ', endpoint)
    keys = Array.isArray(keys) ? keys : [keys]
    this.rpc = new JsonRpc(endpoint, { fetch })
    this.api = new Api({
      rpc: this.rpc,
      signatureProvider: new JsSignatureProvider(keys),
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder()
    })
  }

  /**
   *
   * @param {Object} options
   * @param {String} options.code
   * @param {String} options.scope
   * @param {String} options.table
   * @param {int} options.limit
   */
  async getTableRows ({
    code,
    scope,
    table,
    limit
  }) {
    scope = scope || code
    return this.rpc.get_table_rows({
      json: true,
      code,
      scope,
      table,
      limit
    })
  }

  async getAllTableRows ({
    code,
    scope,
    table,
    tableId
  }) {
    let allRows = []
    let rows = null
    let more = null
    let lowerBound = null
    do {
      ({ rows, more } = await this.getTableRows(
        {
          code,
          scope,
          table,
          lowerBound
        }
      ))
      if (lowerBound) {
        rows.shift()
      }
      if (more) {
        lowerBound = rows[rows.length - 1][tableId]
      }
      allRows = allRows.concat(rows)
    } while (more)

    return allRows
  }

  async getTableMap ({
    code,
    scope,
    table,
    tableId,
    keyProp,
    valueProp
  }) {
    const map = {}
    console.log('Getting table rows: ', code, scope, table, tableId, keyProp, valueProp)
    const rows = await this.getAllTableRows({
      code,
      scope,
      table,
      tableId
    })
    console.log('Got table rows: ', rows)
    rows.forEach(row => {
      map[row[keyProp]] = row[valueProp]
    })
    return map
  }

  /**
   *  Ex. actions: [{
      account: 'eosio.token',
      name: 'transfer',
      authorization: [{
        actor: 'useraaaaaaaa',
        permission: 'active',
      }],
      data: {
        from: 'useraaaaaaaa',
        to: 'useraaaaaaab',
        quantity: '0.0001 SYS',
        memo: '',
      },
    }]
   * @param {*} actions
   */
  async transact (actions) {
    return this.api.transact({
      actions
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })
  }
}

module.exports = EOSAPI
