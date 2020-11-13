const axios = require('axios')

class HyperionClient {
  constructor (baseURL) {
    this.axios = axios.create({
      baseURL
    })
  }

  async getActions (params) {
    const { data } = await this.axios.get('/v2/history/get_actions', {
      params
    })
    return data
  }
}

module.exports = HyperionClient
