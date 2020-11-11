module.exports = {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'Hypha BTC Treasury API',
      description: 'Hypha BTC Treasury API',
      version: '0.0.1'
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Find more info here'
    },
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: []
  },
  exposeRoute: true
}
