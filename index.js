// Using express.js
const compression = require('compression')
const express = require('express')
const index = express()

// Using a parser to handle the body from POST method
const bodyParser = require('body-parser')
const Block = require('./block')
const Blockchain = require('./blockchain')
const chain = new Blockchain()
const StarValidation = require('./star-validation')

// index.js is configured with web service running on the localhost with port 8000
index.use(compression())
index.listen(8000, () => console.log('listening port: 8000'))
index.use(bodyParser.json())
index.get('/', (req, res) => res.status(404).json({ 
  "status": 404,
  "message": "Please check endpoints" 
}))


// Web API post endpoint validates request with JSON response.
index.post('/requestValidation', async (req, res) => {
  const starValidation = new StarValidation(req)

  try {
    starValidation.validateAddressParameter()
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error
    })
    return
  }

  const address = req.body.address
  const timestamp = Date.now()
  const message = `${address}:${timestamp}:starRegistry`
  const validationWindow = 300

  const data = {
    address: address,
    message: message,
    requestTimeStamp: timestamp,
    validationWindow: validationWindow
  }

  //starValidation.addAddress(data)
  starValidation.save(data)
  
  res.json(data)
})

// Web API post endpoint validates message signature with JSON response
index.post('/message-signature/validate', async (req, res) => {
  const starValidation = new StarValidation(req)

  try {
    starValidation.validateAddressAndSignatureParameters()
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error
    })
    return
  }

  try {
    const { address, signature } = req.body
    const response = await starValidation.validateMessageSignature(address, signature)

    if (response.registerStar) {
      res.json(response)
    } else {
      res.status(401).json(response)
    }
  } catch (error) {
    res.status(404).json({
      status: 404,
      message: error
    })
  }
})

// GET Block endpoint using URL path with block height parameter. Preferred URL path http://localhost:8000/block/{BLOCK_HEIGHT}
index.get('/block/:height', async (req, res) => {
  try {
    const response = await chain.getBlock(req.params.height)
    res.send(response)
  } catch (error) {
    res.status(404).json({ //could not be show in terminal
      "status": 404,
      "message": "This block is not found." 
    })
  }
})

// Get star block by wallet address (blockchain identity) with JSON response.
index.get('/stars/address:address', async (req, res) => {
  try {
    const address = req.params.address.slice(1)
    const response = await chain.getBlocksByAddress(address)

    res.send(response)
  } catch (error) {
    res.status(404).json({
      status: 404,
      message: 'Block not found'
    })
  }
})

// Get star block by hash with JSON response.
index.get('/stars/hash:hash', async (req, res) => {
  try {
    const hash = req.params.hash.slice(1)
    const response = await chain.getBlockByHash(hash)

    res.send(response)
  } catch (error) {
    res.status(404).json({
      status: 404,
      message: 'Block not found'
    })
  }
})

// POST Block endpoint using key/value pair within request body.
//   POST URL path: http://localhost:8000/block
//   Content-Type: indexlication/json
//   Request body: {"body":"block body contents"}
index.post('/block', async (req, res) => {
    const starValidation = new StarValidation(req)
    try {
      starValidation.validateNewStarRequest()
      const isValid = await starValidation.isValid()
      if (!isValid) {
        throw 'Signature is not valid or timestamp expired'
      }
    } catch (error) {
      res.status(401).json({
        status: 401,
        message: error
      })
      return
    }
  
  const body = { address, star } = req.body
  const story = star.story
  body.star.story = new Buffer(story).toString('hex')
  
  await chain.addBlock(new Block(req.body.body))
  const height = await chain.getBlockHeight()
  const response = await chain.getBlock(height)
  
  starValidation.invalidate(address)
  res.status(201).send(response)
})