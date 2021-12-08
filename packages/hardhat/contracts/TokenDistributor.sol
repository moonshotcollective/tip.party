//SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Token Distributor Contract
/// @author
/// @notice distributes donations or tips
contract TokenDistributor{
    using SafeMath for uint256;


    /// @notice Emitted when a token share has been distributed
    event tokenShareCompleted(uint256 amount, uint256 share, address from);

    /// @notice Emitted when an ETH share has been distributed
    event ethShareCompleted(uint256 share);


    modifier hasValidUsers(address[] memory users) {
        require(users.length > 0 && users.length < 256, "Invalid users array");
        _;
    }

    modifier hasEnoughBalance(uint256 balance, uint256 amount) {
        require(balance >= amount, "Not enough token balance");
        _;
    }


    /// @notice Splits ETH that is 'Tipped'
    /// @param users an ordered list of users addresses
    function splitEth(address[] memory users)
        public
        payable
        hasValidUsers(users)
    {
        uint256 share = _handleDistribution(
            users,
            msg.value,
            address(this),
            address(0),
            false
        );

        emit ethShareCompleted(share);
    }



    /// @notice Splits token from user
    /// @param users an ordered list of users addresses
    /// @param amount the total amount to be split
    /// @param token the token to be split
    function splitTokenFromUser(
        address[] memory users,
        uint256 amount,
        ERC20 token
    )
        public
        hasValidUsers(users)
        hasEnoughBalance(token.balanceOf(msg.sender), amount)
    {
        uint256 share = _handleDistribution(
            users,
            amount,
            msg.sender,
            address(token),
            true
        );

        emit tokenShareCompleted(amount, share, msg.sender);
    }

    /// @notice Handles the distribution
    /// @dev called internally by contract function
    /// @return share of the distribution
    function _handleDistribution(
        address[] memory users,
        uint256 amount,
        address from,
        address token,
        bool isToken
    ) private returns (uint256 share) {
        uint256 totalMembers = users.length;
        share = amount.div(totalMembers);

        for (uint256 i = 0; i < users.length; i++) {
            // if split token is requested, split from specified user
            if (isToken) {
                if (from == address(this)) {
                    ERC20(token).transfer(users[i], share);
                } else {
                    ERC20(token).transferFrom(from, users[i], share);
                }
            } else {
                payable(users[i]).transfer(share); // else split eth
            }
        }
    }
}