# crowdfunding-blockchain

This project is a decentralized crowdfunding platform based on Solidity.

## Usage

### Pre Requisites

Before running any command, make sure to install dependencies:

```sh
npm install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
npm run compile
```

### Test

Run the tests:

```sh
npm run test
```

### Deploy contract to localhost

```sh
npx hardhat node
```

Open a new terminal and deploy the smart contract in the localhost network

```sh
npx hardhat run --network localhost scripts/deploy.js
```

As general rule, you can target any network from your Hardhat config using:

```sh
npx hardhat run --network <your-network> scripts/deploy.js
```

### Deploy contract to Rinkeby testnet

What is Infura:

Infura is a widely-used Infrastructure-as-a-Service (IaaS) platform that provides developers with scalable and reliable access to Ethereum and IPFS networks. It offers an API that enables developers to interact with Ethereum nodes without having to set up and maintain their own nodes.

Infura acts as a bridge between decentralized applications (dApps) and the Ethereum network, making it easier for developers to build and deploy their dApps. By using Infura, developers can focus on building their applications without worrying about the underlying infrastructure, such as node maintenance, uptime, and syncing with the blockchain.

To use Infura, developers need to sign up for a free account, create a project, and obtain an API key (also known as the Project ID). This API key is then used to authenticate requests made to Infura's Ethereum nodes.

What is the Rinkeby testnet:

The Rinkeby testnet is an Ethereum test network that enables developers to test their smart contracts and decentralized applications (dApps) in a safe and cost-free environment before deploying them to the Ethereum mainnet. It is a public testnet, meaning that anyone can access it and use it for development purposes. The Ether on the Rinkeby testnet has no real-world value, making it an ideal sandbox for experimentation and learning.

To request Ether for the testnet we will use Rinkeby Authenticated Faucet

This is a platform used to obtain testnet Ether for deploying and interacting with smart contracts. This faucet requires users to authenticate their request for Ether by making a public post on social media platforms like Twitter, Google Plus, or Facebook. This authentication mechanism helps prevent spam and abuse of the faucet while ensuring a fair distribution of testnet Ether.

Will need to create a Twitter for this.
