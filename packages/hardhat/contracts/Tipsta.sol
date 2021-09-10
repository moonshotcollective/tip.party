//SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./TokenDistributor.sol";

/// @title Token Distributor Contract
/// @author @ghostffcode
/// @notice distributes donations or tips
contract Tipsta is Ownable {
    using SafeMath for uint256;

    uint256 public tipperCost = 0.1 ether;
    address public fundsAccount;
    TokenDistributor tokenDistributorContract;

    modifier paidEnough() {
        require(
            msg.value >= tipperCost,
            "Not enough funds for this transaction"
        );
        _;
    }

    constructor(
        TokenDistributor distributor,
        address holder,
        uint256 cost
    ) public {
        updateTokenDistributorAddress(distributor);
        updateFundsAccount(holder);
        updateTipperCost(cost);
    }

    function updateFundsAccount(address holder) public onlyOwner {
        require(
            holder != address(0),
            "You can't send funds to the Genesis account"
        );
        fundsAccount = holder;
    }

    function updateTipperCost(uint256 cost) public onlyOwner {
        require(cost > 0, "You really want to fund public goods");
        tipperCost = cost;
    }

    function updateTokenDistributorAddress(TokenDistributor distributor)
        public
        onlyOwner
    {
        tokenDistributorContract = distributor;
    }

    function becomeATipsta() public payable paidEnough {
        // pay fee to fundsAccount
        (bool sent, ) = fundsAccount.call{value: tipperCost}("");
        require(sent, "Unable to pay tipsta fee");

        // add caller as new distributor
        tokenDistributorContract.addNewDistributor(msg.sender);

        // refund user for excess ETH
        uint256 refund = msg.value.sub(tipperCost);
        if (refund > 0) {
            (bool refunded, ) = msg.sender.call{value: refund}("");
            require(refunded, "Unable to refund excess ETH");
        }
    }
}
