// Using express.js
const express = require('express')
const index = express()

// Using a parser to handle the body from POST method
const bodyParser = require('body-parser')
const Block = require('./block')
const Blockchain = require('./blockchain')
const chain = new Blockchain()
const StarValidation = require('./star-validation')

// index.js is configured with web service running on the localhost with port 8000
index.listen(8000, () => console.log('listening port: 8000'))
index.use(bodyParser.json())
index.get('/', (req, res) => res.status(404).json({ //could not be show in terminal
  "status": 404,
  "message": "Accepted endpoints: POST /block or GET /block/{BLOCK_HEIGHT}" 
}))


//Criteria: Web API post endpoint validates request with JSON response.
app.post('/requestValidation', async (req, res) => {
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
    "address": address,
    "message": message,
    "timestamp": timestamp,
    "validationWindow": validationWindow
  }

  starValidation.addAddress(data)

  res.json(data)
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

// POST Block endpoint using key/value pair within request body. Preferred URL path http://localhost:8000/block
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
      res.status(400).json({
        status: 400,
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
  res.send(response)
})