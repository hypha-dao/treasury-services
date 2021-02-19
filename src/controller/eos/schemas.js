
const tags = ['eos']

const actionSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    name: { type: 'string' },
    seq: { type: 'string' },
    json: {
      type: 'object',
      additionalProperties: true
    }
  }
}

const trxSchema = {
  type: 'object',
  properties: {
    cursor: { type: 'string' },
    trxId: { type: 'string' },
    block: {
      type: 'object',
      properties: {
        num: { type: 'integer' },
        id: { type: 'string' },
        timestamp: { type: 'string' }
      }
    },
    action: actionSchema
  },
  additionalProperties: false
}

const listTrxsSchema = {
  tags,
  query: {
    type: 'object',
    required: ['account'],
    properties: {
      account: { type: 'string' },
      limit: { type: 'integer' },
      cursor: { type: 'string' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      required: ['trxs'],
      properties: {
        hasMore: { type: 'boolean' },
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
