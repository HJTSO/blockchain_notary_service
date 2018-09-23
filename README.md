# Blockchain Notary Services

To build a Star Registry service that allows users to claim ownership of their favorite star in the night sky.

More details: [Project rubrics](https://review.udacity.com/#!/rubrics/2098/view "Title")

## Prerequisites

###  1. Installing Node and NPM

[Node.js website](https://nodejs.org/en "Title")

```
npm install
```

###  2. Node.js framework

Installing Restful Framework(Express.js):

[Express.js](https://expressjs.com/en/starter/installing.html "Title")

```
npm install express --save 
```

###  3. Wallet address

We need a bitcoin wallet address. For a testing purpose here I use Electrum Bitcon Wallet.

```
My Wallet address: 12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X
```

## Run the Project

###  1. Install the dependencies

Using "npm install xxx" to install some module.

###  2. Run the project

```
node index.js
```

###  3. Service URL

Service will be available at the following URL:

http://localhost:8000/

## Endpoint Documentation

### Blockchain ID validation routine

#### 1. Blockchain ID Validation Request

**Method**

```
GET
```

**Endpoint**

```
http://localhost:8000/requestValidation
```

**Parameters**

```
height - The height of block
```

**Example**

```
curl -X "POST" "http://localhost:8000/requestValidation" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X"
}'
```

**Response Example**

```
{
    "address": "12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X",
    "message": "12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X:1537630417820:starRegistry",
	"timeStamp": 1537630417820,
    "validationWindow": 300
}
```

#### 2. Blockchain ID Message Signature Validation

To get the signature parameter using Electrum Bitcon Wallet: Tools → Sign/verify message. 
Use address and message parameters that we got from Blockchain ID Validation Request endpoint response.

**Method**

```
POST
```

**Endpoint**

```
http://localhost:8000/message-signature/validate
```

**Parameters**

```
height - The height of block
```

**Example**

```
curl -X "POST" "http://localhost:8000/message-signature/validate" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X",
  "signature": "IOd5QK4cDReUOv9NSSvehgG9u+W44+KawXgc4zxHp98XAgQ3+iYYgGrCWsmR5sbh+tmTWhm7Fm10pKHbBv1Ct3U="
}'
```

**Response Example**

```
{
    "registerStar": true,
    "status": {
        "address": "12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X",
        "message": "12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X:1537630417820:starRegistry",
		"timeStamp": 1537630417820,
        "validationWindow": 243,
        "messageSignature": "valid"
    }
}
```

### Star registration Endpoint

#### 3. Stars Registration

**Method**

```
POST
```

**Endpoint**

```
http://localhost:8000/block
```

**Parameters**

```
address - The addres that you used in last step
star - Containing dec, ra and story (max 500 bytes)
```

**Example**

```
curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}'
```

**Response Example**

```
{
    "hash": "2eb83385f12709dbfeb33c67eb25394868d64e3f3e8c05c886320cc21c764916",
    "height": 1,
    "body": {
        "address": "12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X",
        "star": {
            "dec": "-26° 29'\'' 24.9",
            "ra": "16h 29m 1.0s",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
			"storyDecoded": "Found star using https://www.google.com/sky/"
        }
    }
    "time": "1537668090",
    "previousBlockHash": "98db1e26c067711b1ea67606a35aafda8cc26f181d42a1f8586aadc38352977d",
}
```

### Star Lookup

#### 4. Stars Lookup by Wallet Address

**Method**

```
GET
```

**Endpoint**

```
http://localhost:8000/stars/address:address
```

**Parameters**

```
address - The address used
```

**Example**

```
curl "http://localhost:8000/stars/address:12Lo3xPNq7KL6sqLvQy6kxeuY5pzVsFg5X"
```

**Response Example**
```
{
    "hash": "2eb83385f12709dbfeb33c67eb25394868d64e3f3e8c05c886320cc21c764916",
    "height": 1,
    "body": {
        "address": "1JhzgwjPp8xGswhfNHvoPmiANTe21r6Wq3",
        "star": {
            "dec": "-26° 29' 24.9",
            "ra": "16h 29m 1.0s",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
        }
    }
	"time": "1537668090",
	"previousBlockHash": "98db1e26c067711b1ea67606a35aafda8cc26f181d42a1f8586aadc38352977d",
}
```

#### 5. Star Lookup by Block Hash

**Method**

```
GET
```

**Endpoint**

```
http://localhost:8000/stars/hash:hash
```

**Parameters**

```
hash - The hash of one block created before
```

**Example**
```
curl "http://localhost:8000/stars/hash:2eb83385f12709dbfeb33c67eb25394868d64e3f3e8c05c886320cc21c764916"
```

**Response Example**
```
{
    "hash": "2eb83385f12709dbfeb33c67eb25394868d64e3f3e8c05c886320cc21c764916",
    "height": 1,
    "body": {
        "address": "1JhzgwjPp8xGswhfNHvoPmiANTe21r6Wq3",
        "star": {
            "dec": "-26° 29' 24.9",
            "ra": "16h 29m 1.0s",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
        }
    }
	"time": "1537668090",
	"previousBlockHash": "98db1e26c067711b1ea67606a35aafda8cc26f181d42a1f8586aadc38352977d",
}
```

#### 6. Star Lookup by Block Height

**Method**

```
GET
```

**Endpoint**

```
http://localhost:8000/block/:height
```

**Parameters**

```
height - The height of block
```

**Example**
```
curl "http://localhost:8000/block/1"
```

**Response Example**
```
{
    "hash": "2eb83385f12709dbfeb33c67eb25394868d64e3f3e8c05c886320cc21c764916",
    "height": 1,
    "body": {
        "address": "1JhzgwjPp8xGswhfNHvoPmiANTe21r6Wq3",
        "star": {
            "dec": "-26° 29' 24.9",
            "ra": "16h 29m 1.0s",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
        }
    }
	"time": "1537668090",
	"previousBlockHash": "98db1e26c067711b1ea67606a35aafda8cc26f181d42a1f8586aadc38352977d",
}
```
If the block wasn't found, it was showed:

```
{
	"status":404,"message":
	"Block not found"
}
```

## Udacity honor

Giving credits for places that helped to do this project:

Udacity Project4 Concepts section
Udacity slack of nanodegree
https://github.com/RusPosevkin/blockchain-server