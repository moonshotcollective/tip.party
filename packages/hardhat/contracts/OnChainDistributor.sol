//SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract OnChainDistributor is Ownable, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(bytes32 => EnumerableSet.AddressSet) rooms;

    event roomJoined(bytes32 room, address user);
    event payoutCompleted(
        bytes32 room,
        address from,
        address token,
        uint256 amount
    );

    function joinRoom(string memory _room) public returns (bool) {
        bytes32 roomId = _getRoomId(_room);

        require(
            !rooms[roomId].contains(msg.sender),
            "You are already in this room"
        );

        rooms[roomId].add(msg.sender);

        emit roomJoined(roomId, msg.sender);

        return true;
    }

    function addRoomUsers(string memory _room, address[] memory users)
        public
        returns (bool)
    {
        bytes32 roomId = _getRoomId(_room);

        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0)) {
                rooms[roomId].add(users[i]);
            }
        }
    }

    function payoutRoom(
        string memory _room,
        IERC20 token,
        uint256 amount
    ) public {
        require(amount > 0, "Your distribution amount is too low");

        bytes32 roomId = _getRoomId(_room);

        uint256 count = rooms[roomId].length();

        require(count > 0, "This room is empty, nobody to payout to");

        uint256 shares = amount.div(count);

        for (uint256 i = 0; i < count; i++) {
            address currentUser = rooms[roomId].at(i);
            if (currentUser != address(0)) {
                token.safeTransferFrom(msg.sender, currentUser, shares);
            }
        }

        emit payoutCompleted(roomId, msg.sender, address(token), amount);
    }

    function _getRoomId(string memory _room) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_room));
    }

    function roomCount(string memory _room) public view returns (uint256) {
        return rooms[_getRoomId(_room)].length();
    }
}
