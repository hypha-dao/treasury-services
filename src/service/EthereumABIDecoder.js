const abiDecoder = require('abi-decoder')

class EthereumABIDecoder {
  addABI (abi) {
    abiDecoder.addABI(abi)
  }

  decodeMethod (inputData) {
    return abiDecoder.decodeMethod(inputData)
  }

  decodeLogs (logs) {
    return abiDecoder.decodeLogs(logs)
  }

  getMethodIds () {
    return abiDecoder.getMethodIDs()
  }
}

module.exports = new EthereumABIDecoder()
