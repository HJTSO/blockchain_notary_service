const SHA256 = require('crypto-js/sha256')
const db = require('level')('./data/chain')
const Block = require('./block')

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
    constructor(){
        this.getBlockHeight().then((height) => {
	        if (height < 0) {
			  // Genesis block persist as the first block in the blockchain
			  this.addBlock(new Block("First block in the chain - Genesis block"));
			  console.log('Genesis block');
	        }
        })
    }
	
	// Add new block to leveDB
    async addBlockToDB (key, value) {
      return new Promise((resolve, reject) => {
        db.put(key, value, (error) => {
          if (error) {
            return reject(error)
          }
          return resolve(`Block was added #${key}`)
        })
      })
    }

    // Add new block
    async addBlock(newBlock) {
      	const height = parseInt(await this.getBlockHeight())
        // Block height
        newBlock.height = (height + 1);
        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        // previous block hash
        if(newBlock.height>0){
      	  const prevBlock = await this.getBlock(height)
      	  newBlock.previousBlockHash = prevBlock.hash
		}
		
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
		
        // Store newBlock in LevelDB
        await this.addBlockToDB(newBlock.height, JSON.stringify(newBlock))
    }
	
	
	// Get block height from leveDB
    async getBlockHeightFromDB() {
      return new Promise((resolve, reject) => {
        let height = -1

        db.createReadStream().on('data', (data) => {
          height++
        }).on('error', (error) => {
          return reject(error)
        }).on('close', () => {
          return resolve(height)
        })
      })
    }

    // Retrieve current block height within the LevelDB chain
    async getBlockHeight() {
      return await this.getBlockHeightFromDB()
    }
	
    async getBlockByHeight(key) {
      return new Promise((resolve, reject) => {
        db.get(key, (error, value) => {
          if (value === undefined) {
            return reject('Not found')
          } else if (error) {
            return reject(error)
          }
          value = JSON.parse(value)

          if (parseInt(key) > 0) {
            value.body.star.storyDecoded = new Buffer(value.body.star.story, 'hex').toString()
          }
          return resolve(value)
        })
      })
    }
	
    // Gretrieve a block by it's block heigh within the LevelDB chain
    async getBlock(blockHeight){
      // return object as a single string
      return await this.getBlockByHeight(blockHeight)
    }

    async getBlockByHash(hash) {
      let block
      return new Promise((resolve, reject) => {
        db.createReadStream().on('data', (data) => {    
          block = JSON.parse(data.value)
          if (block.hash === hash) {
            if (parseInt(data.key) > 0) {
              block.body.star.storyDecoded = new Buffer(block.body.star.story, 'hex').toString()
              return resolve(block)
            } else {
              return resolve(block)
            }
          }
        }).on('error', (error) => {
          return reject(error)
        }).on('close', () => {
          return reject('Not found')
        })
      })
    }
  
    async getBlocksByAddress(address) {
      const blocks = []
      let block

      return new Promise((resolve, reject) => {
        db.createReadStream().on('data', (data) => {
          if (parseInt(data.key) > 0) {
            block = JSON.parse(data.value)

            if (block.body.address === address) {
              block.body.star.storyDecoded = new Buffer(block.body.star.story, 'hex').toString()
              blocks.push(block)
            }
          }
        }).on('error', (error) => {
          return reject(error)
        }).on('close', () => {
          return resolve(blocks)
        })
      })
    }

    // Validate a block stored within levelDB
    async validateBlock(blockHeight){
      // Get block object
      let block = await this.getBlock(blockHeight)
      // Get block hash
      let blockHash = block.hash
      // Remove block hash to test block integrity
      block.hash = ''
		
      // Generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();

      if (blockHash === validBlockHash) {
	    return true
      } else {
	    console.log(`Block #${blockHeight} invalid hash: ${blockHash} <> ${validBlockHash}`)
		return false
      }
    }

    // Validate blockchain stored within levelDB
    async validateChain() {
      let errorLog = []
      let previousHash = ''
      let isValidBlock = false
      const heigh = await this.getBlockHeightFromDB()

      for (let i = 0; i < heigh; i++) {
        this.getBlock(i).then((block) => {
          isValidBlock = this.validateBlock(block.height)

          if (!isValidBlock) {
            errorLog.push(i)
          } 
          if (block.previousBlockHash !== previousHash) {
            errorLog.push(i)
          }
          previousHash = block.hash

          if (i === (heigh -1)) {
            if (errorLog.length > 0) {
              console.log(`Block errors = ${errorLog.length}`)
              console.log(`Blocks: ${errorLog}`)
            } else {
              console.log('No errors detected')
            }
          }
        })
      }
    }
	
}

module.exports = Blockchain