class Document {
  static toDocFormat ({
    treasuryId,
    trxId,
    from,
    to,
    quantity,
    currency,
    timestamp,
    memo,
    chainId
  }) {
    const contents = []
    this.addContent(contents, 'treasury_id', treasuryId)
    this.addContent(contents, 'transaction_id', trxId)
    this.addContent(contents, 'from', from)
    this.addContent(contents, 'to', to)
    this.addContent(contents, 'quantity', quantity)
    this.addContent(contents, 'currency', currency)
    this.addContent(contents, 'timestamp', timestamp)
    this.addContent(contents, 'usd_value', trxId)
    this.addContent(contents, 'memo', memo)
    this.addContent(contents, 'chainId', chainId)
  }

  static addContent (contents, label, value, type = 'string') {
    if (value != null) {
      contents.push(this.toContent(label, value, type))
    }
  }

  static toContent (label, value, type = 'string') {
    return {
      label,
      value: [
        type,
        value
      ]
    }
  }
}

module.exports = Document
