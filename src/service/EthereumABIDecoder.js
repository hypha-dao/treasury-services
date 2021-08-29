const abiDecoder = require('abi-decoder')

class EthereumABIDecoder {
  addABI (abi) {
    abiDecoder.addABI(abi)
  }

  decodeMethod (inputData) {
    return abiDecoder.decodeMethod(inputData)
  }

  decodeLogs (logs) {
    let decoded = []
    for (const log of logs) {
      try {
        // console.log('--------------------------------------------------')
        // console.log('Log: ', JSON.stringify(log, null, 4))
        decoded = decoded.concat(abiDecoder.decodeLogs([log]))
      } catch (e) {
        // console.log('--------------------------------------------------')
        console.log('Warning failed to decode log: ', JSON.stringify(log, null, 4))
        decoded.push(null)
        // throw e
      }
    }
    return decoded
  }

  getMethodIds () {
    return abiDecoder.getMethodIDs()
  }
}

module.exports = new EthereumABIDecoder()
