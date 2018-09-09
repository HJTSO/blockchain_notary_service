/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/
// ● Configure simpleChain.js with levelDB to persist blockchain dataset using the level Node.js library.
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);
const Block = require('./block')

// Add data to levelDB with key/value pair
function addDataToLevelDB(key, value) {
  db.put(key, value, function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  });
}

// Validate block in levelDB with key
function validateLevelDBBlock(key, callback) {
  getLevelDBData(key, function(value) {
    // Get block object
    let block = JSON.parse(value);
    // Get block hash
    let blockHash = block.hash;
    // Remove block hash to test block integrity
    block.hash = '';
    // Generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash===validBlockHash) {
      callback(true);
    } else {
      callback(false);
      console.log('Block #'+key+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
    }
  });
} 

// Get data from levelDB with key
function getLevelDBData(key, callback) {
  db.get(key, function(err, value) {
    if (err){ 
      return console.log('Not found!', err);
    }
    callback(value);
  });
}

// Get block height from leveDB
function getHeightFromLevelDB(callback) {
  let i = 0;
  db.createReadStream().on('data', function (data) {
      i++;
    })
    .on('error', function (err) {
      console.log('Error found: ', err);
    })
    .on('close', function () {
      callback(i-1);
    });
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
    constructor(){
        const height = this.getBlockHeight().then(height => {
	        console.log('Height: ' + height);
	        if (height < 0) {
			  // Genesis block persist as the first block in the blockchain
			  this.addBlock(new Block("First block in the chain - Genesis block"));
			  console.log('Genesis block');
	        }
        })
			  //         this.getBlockHeight(height => {
			  //         	//console.log('Height: ',height);
			  // 	        if (height < 0) {
			  // // ● Genesis block persist as the first block in the blockchain
			  // this.addBlock(new Block("First block in the chain - Genesis block"));
			  // 	        }
			  //         })
    }

    // Add new block
    addBlock(newBlock){
      getHeightFromLevelDB(function(height) {
        // Block height
        newBlock.height = (height + 1);
        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        // previous block hash
        if(height>=0){
          getLevelDBData(height, function(data) {
            newBlock.previousBlockHash = JSON.parse(data).hash;
            // Block hash with SHA256 using newBlock and converting to a string
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            // ● Store newBlock with LevelDB
            addDataToLevelDB(newBlock.height, JSON.stringify(newBlock).toString());
          });
        } else {
          // Block hash with SHA256 using newBlock and converting to a string
          newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
          // Store newBlock in LevelDB
          addDataToLevelDB(newBlock.height, JSON.stringify(newBlock).toString());
        }
      });
    }

      // ● Retrieve current block height within the LevelDB chain
    getBlockHeight(callback){
	  return new Promise((resolve, reject) => {
		  getHeightFromLevelDB(function(height) {
		          console.log('Height: ' + (height).toString());
				  resolve(height)
		        });
	  })
	  // getHeightFromLevelDB(callback);
    }

    // ● Gretrieve a block by it's block heigh within the LevelDB chain
    getBlock(blockHeight){
      // return object as a single string
      getLevelDBData(blockHeight, function(block) {
        console.log(JSON.parse(block));
      });
    }

      // ● Validate a block stored within levelDB
    validateBlock(blockHeight){
      validateLevelDBBlock(blockHeight, function(isValid) {
        if(isValid) {
          console.log('Block validated');
        }
      });
    }

    // ● Validate blockchain stored within levelDB
    validateChain(){
      let errorLog = [];
      let chain = [];
      let i = 0;
      db.createReadStream().on('data', function (data) {
        // validate block
        validateLevelDBBlock(i, function(value) {
          //if (blockHash!==previousHash)
          if(!value) errorLog.push(i);
        });
        chain.push(data.value);
        i++;
      })
      .on('error', function (err) {
        console.log('Error: ', err);
      })
      .on('close', function () {
        for (var i = 0; i < chain.length-1; i++) {
          // compare blocks hash link
          let blockHash = JSON.parse(chain[i]).hash;
          let previousHash = JSON.parse(chain[i+1]).previousBlockHash;
          if (blockHash!==previousHash) {
            errorLog.push(i);
          }
        }
        if (errorLog.length>0) {
          console.log('Block errors = ' + errorLog.length);
          console.log('Blocks: '+ errorLog);
        } else {
          console.log('No errors detected');
        }
      });
    }
}


module.exports = Blockchain