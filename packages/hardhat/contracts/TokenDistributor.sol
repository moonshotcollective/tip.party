//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Token Distributor Contract
/// @author
/// @notice distributes donations or tips
contract TokenDistributor is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /// @notice Emitted when a token share has been distributed
    event tokenShareCompleted(
        address token,
        uint256 indexed amount,
        address indexed from,
        bytes32 indexed room
    );

    /// @notice Emitted when an ETH share has been distributed
    event ethShareCompleted(
        uint256 indexed amount,
        address indexed from,
        bytes32 indexed room
    );

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
    function splitEth(address[] memory users, string memory _room)
        public
        payable
        hasValidUsers(users)
    {
        bytes32 room = keccak256(abi.encodePacked(_room));
        _handleDistribution(users, msg.value, address(this), address(0), false);

        emit ethShareCompleted(msg.value, msg.sender, room);
    }

    /// @notice Splits token from user
    /// @param users an ordered list of users addresses
    /// @param amount the total amount to be split
    /// @param token the token to be split
    function splitTokenFromUser(
        address[] memory users,
        uint256 amount,
        IERC20 token,
        string memory _room
    )
        public
        hasValidUsers(users)
        hasEnoughBalance(token.balanceOf(msg.sender), amount)
    {
        bytes32 room = keccak256(abi.encodePacked(_room));
        _handleDistribution(users, amount, msg.sender, address(token), true);

        emit tokenShareCompleted(address(token), amount, msg.sender, room);
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
                    IERC20(token).safeTransfer(users[i], share);
                } else {
                    IERC20(token).safeTransferFrom(from, users[i], share);
                }
            } else {
                (bool sent, bytes memory data) = users[i].call{value: share}(
                    ""
                );
                require(sent, "Failed to send Ether");
            }
        }
    }
}