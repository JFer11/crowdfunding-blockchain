import Web3 from 'web3'

const provider = new Web3.providers.HttpProvider("")
const web3 = new Web3(provider)
const abi = '' //TODO: conseguir el abi del contract
const cfContract = new web3.eth.Contract(abi, "") //TODO: poner en el segundo parametro el address del contract

export default cfContract;