
const tags = ['btc']

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
  body: {
    type: 'object',
    required: ['wallet'],
    properties: {
      wallet: { type: 'string' },
      limit: { type: 'integer' },
      cursor: { type: 'string' },
      untilTrxId: { type: 'string' },
      minConfirmations: { type: 'integer' },
      ops: { type: 'array', items: { type: 'string' } }
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
        },
        untilTrxFound: { type: 'boolean' }
      }
    }
  }
}

module.exports = {
  listTrxsSchema
}
