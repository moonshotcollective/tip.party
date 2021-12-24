//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// dummyToken Contract to test out TokenDistribution locally
contract GTC is ERC20 {
    constructor(address admin) public ERC20("dummyGTC", "dGTC") {
        _mint(admin, 1000e18);
    }

    function mint4Me(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
