const fastify = require('fastify')
const fp = require('fastify-plugin')
const swaggerConfig = require('./swagger/config')
const { Ether, EOS, Telos } = require('./model')
const { BTCClient } = require('./service')

const {
  NODE_ENV,
  PORT, // has to come from env vars because its set by app services
  BWS_CREDENTIALS_DIR,
  BWS_URL,
  BWS_LOG_LEVEL,
  BWS_TIMEOUT,
  DFUSE_EOS_API_KEY,
  DFUSE_EOS_NETWORK,
  DFUSE_ETH_API_KEY,
  DFUSE_ETH_NETWORK,
  DFUSE_TELOS_API_KEY,
  DFUSE_TELOS_NETWORK,
  WEB3_ENDPOINT
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
  const eos = new EOS({
    dfuseApiKey: DFUSE_EOS_API_KEY,
    dfuseNetwork: DFUSE_EOS_NETWORK
  })
  const ether = new Ether({
    dfuseApiKey: DFUSE_ETH_API_KEY,
    dfuseNetwork: DFUSE_ETH_NETWORK,
    web3Endpoint: WEB3_ENDPOINT
  })
  const telos = new Telos({
    dfuseApiKey: DFUSE_TELOS_API_KEY,
    dfuseNetwork: DFUSE_TELOS_NETWORK
  })
  fastify.decorate('btcClient', btcClient)
  fastify.decorate('eos', eos)
  fastify.decorate('ether', ether)
  fastify.decorate('telos', telos)
}

async function main () {
  console.log('ENV VARS:', process.env)
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
    .register(require('./controller/btc'), { prefix: '/api/btc' })
    .register(require('./controller/eos'), { prefix: '/api/eos' })
    .register(require('./controller/ether'), { prefix: '/api/ether' })
    .register(require('./controller/telos'), { prefix: '/api/telos' })

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
