
const tags = ['ether']

const trxSchema = {
  type: 'object',
  required: ['block', 'node'],
  properties: {
    block: {
      type: 'object',
      properties: {
        hash: { type: 'string' },
        number: { type: 'integer' }
      },
      additionalProperties: true

    },
    node: {
      type: 'object',
      properties: {
        hash: { type: 'string' },
        from: { type: 'string' },
        to: { type: 'string' }
      },
      additionalProperties: true

    }
  },
  additionalProperties: false
}

const listTrxsSchema = {
  tags,
  query: {
    type: 'object',
    required: ['address'],
    properties: {
      address: { type: 'string' },
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
        cursor: { type: 'string' },
        hasMore: { type: 'boolean' },
        trxs: {
          type: 'array',
          items: trxSchema
        }
      }
    }
  }
}

const getBalanceSchema = {
  tags,
  query: {
    type: 'object',
    required: ['address'],
    properties: {
      address: { type: 'string' },
      contractAddress: { type: 'string' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      required: ['balance', 'symbol'],
      properties: {
        weiBalance: { type: 'string' },
        balance: { type: 'string' },
        symbol: { type: 'string' }
      }
    }
  }
}

module.exports = {
  listTrxsSchema,
  getBalanceSchema
}
