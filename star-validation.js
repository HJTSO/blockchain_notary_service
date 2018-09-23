const db = require('level')('./data/star')
const bitcoinMessage = require('bitcoinjs-message')

class StarValidation {
  constructor (req) {
    this.req = req
  }

  validateAddressParameter() {
    if (!this.req.body.address) {
      throw 'Fill the address'
    }
    return true
  }

  validateAddressAndSignatureParameters() {
    if (!this.validateAddressParameter() || !this.req.body.signature) {
      throw 'Fill the address and signature'
    }
  }

  validateNewStarRequest() {
    if (!this.validateAddressParameter() || !this.req.body.star) {
      throw 'Fill the address and star'
    }

    // Validate ra, dec, story 
    if (typeof this.req.body.star.dec !== 'string' || typeof this.req.body.star.ra !== 'string' || typeof this.req.body.star.story !== 'string' || !this.req.body.star.dec.length || !this.req.body.star.ra.length || !this.req.body.star.story.length) {
      throw "This should include non-empty string properties 'dec', 'ra' and 'story'"
    }
  }

  isValid() {
    return db.get(this.req.body.address)
      .then((value) => {
        value = JSON.parse(value)
        return value.messageSignature === 'valid'
      })
      .catch(() => {throw 'Not authorized'})
  }

  invalidate(address) {
    db.del(address)
  }

  save(data) {
    db.put(data.address, JSON.stringify(data))
  }

  async validateMessageSignature(address, signature) {
    return new Promise((resolve, reject) => {
      db.get(address, (error, value) => {
        if (value === undefined) {
          return reject('Not found')
        } else if (error) {
          return reject(error)
        }

        value = JSON.parse(value)
        const nowSubFiveMinutes = Date.now() - (5 * 60 * 1000)
        const isExpired = value.requestTimeStamp < nowSubFiveMinutes
        let isValid = false

        if (isExpired) {
            value.validationWindow = 0
            value.messageSignature = 'Validation window was expired'
        } else {
            value.validationWindow = Math.floor((value.requestTimeStamp - nowSubFiveMinutes) / 1000) 
            isValid = bitcoinMessage.verify(value.message, address, signature)
            value.messageSignature = isValid ? 'valid' : 'invalid'
        }

        this.save(value)
        return resolve({
            registerStar: !isExpired && isValid,
            status: value
        })
      })
    })
  }
}
  
module.exports = StarValidation