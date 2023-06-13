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

### Run test

```sh
npx hardhat test
```

### Check test coverage

```sh
npx hardhat coverage
```

### Check test coverage

```sh
npx hardhat coverage
```

### Deploy to hardhat network

```sh
npx hardhat --verbose run scripts/deploy.js
```
