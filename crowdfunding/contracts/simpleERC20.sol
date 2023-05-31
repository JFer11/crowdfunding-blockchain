// contracts/SimpleERC20.sol
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleERC20 is ERC20 {
    constructor(uint256 initialSupply) ERC20("SimpleERC20", "SE20") {
        _mint(msg.sender, initialSupply);
    }
}
