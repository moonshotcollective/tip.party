//SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// todo: Do we not need any other functionality here? JR

// dummyToken Contract to test out TokenDistribution locally
contract dGTC is ERC20 {
    constructor() public ERC20("dummyGTC", "dGTC") {
        _mint(msg.sender, 10000000e18);
    }

    function mint4Me(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
