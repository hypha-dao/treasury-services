'use strict'

const {
  listTrxsSchema,
  listTokenOpSchema
} = require('./schemas')

module.exports = async function (fastify, opts) {
  // Route registration
  // fastify.<method>(<path>, <schema>, <handler>)
  // schema is used to validate the input and serialize the output

  // Logged APIs
  fastify.register(async function (fastify) {
    fastify.get('/list-trx', { schema: listTrxsSchema }, listTrxsHandler)
    fastify.get('/list-token-ops', { schema: listTokenOpSchema }, listTokenOpsHandler)
  })
}

// Fastify checks the existance of those decorations before registring `user.js`
module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'telos'
    ]
  }
}

// In all handlers `this` is the fastify instance
// The fastify instance used for the handler registration

async function listTrxsHandler (req, reply) {
  return this.telos.listTransferTrxs(req.query)
}

async function listTokenOpsHandler (req, reply) {
  return this.telos.listTokenOpTrxs(req.query)
}
