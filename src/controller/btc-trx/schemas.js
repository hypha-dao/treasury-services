
const tags = ['btc-trx']

const trxSchema = {
  type: 'object',
  required: ['id', 'txid', 'confirmations'],
  properties: {
    id: { type: 'string' },
    trxid: { type: 'string' },
    confirmations: { type: 'integer' }
  },
  additionalProperties: true
}

const listTrxsSchema = {
  tags,
  query: {
    type: 'object',
    required: ['wallet'],
    properties: {
      wallet: { type: 'string' },
      limit: { type: 'integer' },
      cursor: { type: 'string' },
      untilTrxId: { type: 'string' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      required: ['trxs'],
      properties: {
        cursor: { type: 'string' },
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
