class AccountingAPI {
  constructor ({
    contract,
    eosAccount,
    eosAPI
  }) {
    this.contract = contract
    this.eosAccount = eosAccount
    this.eosAPI = eosAPI
  }

  async getCursorMap () {
    return this.eosAPI.getTableMap({
      code: this.contract,
      table: 'cursors',
      tableId: 'key',
      keyProp: 'source',
      valueProp: 'last_cursor'
    })
  }

  async trx (trx) {
    return this.eosAPI.transact([
      {
        account: this.contract,
        name: 'newevent',
        authorization: [{
          actor: this.eosAccount,
          permission: 'active'
        }],
        data: {
          issuer: this.eosAccount,
          trx_info: trx
        }
      }
    ])
  }
}

module.exports = AccountingAPI
