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
    const MAX_STORY_BYTES = 500
    const { star } = this.req.body
    const { dec, ra, story} = star
	  
    if (!this.validateAddressParameter() || !this.req.body.star) {
      throw 'Fill the address and star'
    }

    // Validate ra, dec, story
    if (typeof dec !== 'string' || typeof ra !== 'string' || typeof story !== 'string' || !dec.length || !ra.length || !story.length) {
      throw new Error("This should include non-empty string properties 'dec', 'ra' and 'story'")
    }
	
	// Story is limited to 250 words (500 bytes) ASCII text
    if (new Buffer(story).length > MAX_STORY_BYTES) {
      throw new Error('The story too is long. Size is up to 500 bytes')
    }

    const isASCII = ((str) => /^[\x00-\x7F]*$/.test(str))

    if (!isASCII(story)) {
      throw new Error('The story contains non-ASCII symbols')
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

  async validateMessageSignature(address, signature) {
    return new Promise((resolve, reject) => {
      db.get(address, (error, value) => {
        if (value === undefined) {
          return reject(new Error('Not found'))
        } else if (error) {
          return reject(error)
        }

        value = JSON.parse(value)

        if (value.messageSignature === 'valid') {
          return resolve({
            registerStar: true,
            status: value
        }) 
        } else {
          const nowSubFiveMinutes = Math.floor(Date.now()/1000) - (5 * 60)
          const isExpired = value.requestTimeStamp < nowSubFiveMinutes
          let isValid = false
  
          if (isExpired) {
              value.validationWindow = 0
              value.messageSignature = 'Validation window was expired'
          } else {
              value.validationWindow = value.requestTimeStamp - nowSubFiveMinutes
  
              try {
                isValid = bitcoinMessage.verify(value.message, address, signature)
              } catch (error) {
                isValid = false
              }
            
              value.messageSignature = isValid ? 'valid' : 'invalid'
          }
  
          db.put(address, JSON.stringify(value))
  
          return resolve({
              registerStar: !isExpired && isValid,
              status: value
          }) 
        }
      })
    })
  }

  saveNewRequestValidation(address) {
    const timestamp = Math.floor(Date.now()/1000)
    const message = `${address}:${timestamp}:starRegistry`
    const validationWindow = 300
    const data = {
      address: address,
      message: message,
      requestTimeStamp: timestamp,
      validationWindow: validationWindow
    }
    db.put(data.address, JSON.stringify(data))
    return data
  }

  async getPendingAddressRequest(address) {
    return new Promise((resolve, reject) => {
      db.get(address, (error, value) => {
        if (value === undefined) {
          return reject(new Error('Not found'))
        } else if (error) {
          return reject(error)
        }

        value = JSON.parse(value)
        const nowSubFiveMinutes = Math.floor(Date.now()/1000) - (5 * 60)
        const isExpired = value.requestTimeStamp < nowSubFiveMinutes

        if (isExpired) {
            resolve(this.saveNewRequestValidation(address))
        } else {
          const data = {
            address: address,
            message: value.message,
            requestTimeStamp: value.requestTimeStamp,
            validationWindow: value.requestTimeStamp - nowSubFiveMinutes
          }
          resolve(data)
        }
      })
    })
  }
}
  
module.exports = StarValidation