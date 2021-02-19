const { createDfuseClient } = require('@dfuse/client')
const nodeFetch = require('node-fetch')
const WebSocketClient = require('ws')

async function webSocketFactory (url, protocols = []) {
  const webSocket = new WebSocketClient(url, protocols, {
    handshakeTimeout: 30 * 1000, // 30s
    maxPayload: 200 * 1024 * 1000 * 1000 // 200Mb
  })

  const onUpgrade = (response) => {
    console.log('Socket upgrade response status code.', response.statusCode)

    // You need to remove the listener at some point since this factory
    // is called at each reconnection with the remote endpoint!
    webSocket.removeListener('upgrade', onUpgrade)
  }

  webSocket.on('upgrade', onUpgrade)

  return webSocket
}

class DfuseClient {
  constructor ({
    apiKey,
    network
  }) {
    this.client = createDfuseClient({
      apiKey,
      network,
      httpClientOptions: {
        fetch: nodeFetch
      },
      graphqlStreamClientOptions: {
        socketOptions: {
          // The WebSocket factory used for GraphQL stream must use this special protocols set
          // We intend on making the library handle this for you automatically in the future,
          // for now, it's required otherwise, the GraphQL will not connect correctly.
          webSocketFactory: (url) => webSocketFactory(url, ['graphql-ws'])
        }
      },
      streamClientOptions: {
        socketOptions: {
          webSocketFactory: (url) => webSocketFactory(url)
        }
      }
    })
  }

  async query (queryStr, opts) {
    const response = await this.client.graphql(queryStr, opts)
    if (response.errors) {
      throw response.errors
    }
    return response.data
  }

  release () {
    this.client.release()
  }
}

module.exports = DfuseClient
