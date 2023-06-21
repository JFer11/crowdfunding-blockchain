const { ethers } = require('ethers');

async function increaseTimeAndMine(provider, seconds) {
  // Check if the provider is connected to the network
  if (!provider.isConnected()) {
    throw new Error('Provider is not connected to a network');
  }

  // Get the current block number
  const currentBlock = await provider.getBlockNumber();

  // Get the current block timestamp
  const currentTimestamp = (await provider.getBlock(currentBlock)).timestamp;

  // Calculate the new target timestamp
  const newTimestamp = currentTimestamp + seconds;

  // Set the new timestamp
  await provider.send('evm_setNextBlockTimestamp', [newTimestamp]);

  // Mine the next block
  await provider.send('evm_mine');
}

async function main() {
  // Connect to the injected Web3 provider (e.g., MetaMask)
  const url = 'HTTP://127.0.0.1:7545';
  const provider = new ethers.providers.JsonRpcProvider(url);

  try {
    await increaseTimeAndMine(provider, 10000); // Increase time by 10000 seconds and mine the next block
    console.log('Time increased and block mined successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}