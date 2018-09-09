# Blockchain Notary Services

Building a RESTful API using a Node.js framework that will interface with private blockchain.

Creating a RESTful web API for your private blockchain. The API project requires two endpoints:

 ● Get block
 ● Post block

## Prerequisites

Installing Node and NPM:

[Node.js website](https://nodejs.org/en "Title")

```
npm install
```

## Node.js framework

Installing Restful Framework(Express.js):

[Express.js](https://expressjs.com/en/starter/installing.html "Title")

```
npm install express --save 
```

## Endpoint Documentation

### 1. Run the server

```
node index.js
```

The default URL remain private facing using localhost for connectivity (http://localhost:8000).

### 2. Test Endpoint

Testing with CURL on the terminal to send the requests to the url (http://localhost:8000).

- Get block endpoint

```
curl http://localhost:8000/block/number(eg. 0,1,2...)
```

example:

```
curl http://localhost:8000/block/0
```

The height of blockchain is started with zero index.

- Post block endpoint

Post the info of block.

example:

```
curl -X "POST" "http://localhost:8000/block" -H 'Content-Type: application/json' -d $'{"body":"Testing Add."}'
```