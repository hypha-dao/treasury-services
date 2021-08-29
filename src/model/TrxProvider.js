class TrxProvider {
  getSources () {
    throw new Error('Must be overriden by child class')
  }

  async getHomoTransferTrxs ({
    source,
    cursor,
    limit
  }) {
    throw new Error('Must be overriden by child class')
  }

  async release () {
    throw new Error('Must be overriden by child class')
  }
}

module.exports = TrxProvider
