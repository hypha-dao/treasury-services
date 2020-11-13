const { TransferDirection } = require('../../const')
const tags = ['telos']

const trxSchema = {
  type: 'object',
  properties: {
    block: { type: 'integer' },
    timestamp: { type: 'string' },
    irreversible: { type: 'integer' },
    contract: { type: 'string' },
    action: { type: 'string' },
    transaction_id: { type: 'string' },
    data: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        amount: { type: 'number' },
        symbol: { type: 'string' },
        memo: { type: 'string' },
        quantity: { type: 'string' }
      }
    }
  },
  additionalProperties: false
}

const listTrxsSchema = {
  tags,
  query: {
    type: 'object',
    properties: {
      tokenContract: { type: 'string' },
      account: { type: 'string' },
      transferDirection: { type: 'string', enum: Object.values(TransferDirection) },
      skip: { type: 'integer' },
      limit: { type: 'integer' }

    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      required: ['trxs'],
      properties: {
        trxs: {
          type: 'array',
          items: trxSchema
        }
      }
    }
  }
}

module.exports = {
  listTrxsSchema
}
