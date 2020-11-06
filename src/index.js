const fastify = require('fastify')
const fp = require('fastify-plugin')
const swaggerConfig = require('./swagger/config')
const { BTCClient } = require('./service')

const {
  NODE_ENV,
  PORT, // has to come from env vars because its set by app services
  BWS_CREDENTIALS_DIR,
  BWS_URL,
  BWS_LOG_LEVEL,
  BWS_TIMEOUT
} = process.env

function unhandledRejectionHandler (error) {
  console.error(error)
  process.exit(1)
}

async function decorateFastifyInstance (fastify) {
  const btcClient = new BTCClient({
    credentialsDir: BWS_CREDENTIALS_DIR,
    baseUrl: BWS_URL,
    logLevel: BWS_LOG_LEVEL,
    timeout: BWS_TIMEOUT
  })
  fastify.decorate('btcClient', btcClient)
}

async function main () {
  // Create the instance
  const server = fastify({ logger: { prettyPrint: NODE_ENV !== 'production' }, pluginTimeout: 20000 })
  // Add application assets and manifest.json serving
  server.log.info(`cwd: ${process.cwd()}`)
  server.register(require('fastify-swagger'), swaggerConfig)
    .register(require('fastify-cors'), {
      origin: true,
      credentials: true,
      allowedHeaders: 'Authorization, Origin, X-Requested-With, Content-Type, Accept'
    })
    .register(fp(decorateFastifyInstance))
    // APIs modules
    .register(require('./controller/btc-trx'), { prefix: '/api/btc-trx' })

    // static resources
    .setErrorHandler(function (error, request, reply) {
      server.log.info(error)
      reply.send(error)
    })
  await server.ready()
  server.swagger()
  // Run the server!
  await server.listen(PORT || 3000, '0.0.0.0')
  return server
}

process.on('unhandledRejection', unhandledRejectionHandler)
main().catch(unhandledRejectionHandler)
