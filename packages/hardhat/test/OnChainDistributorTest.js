const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("OnChainDistributor", function () {
  let OnChainDistributor;

  describe("OnChainDistributor", function () {
    it("Should deploy OnChainDistributor", async function () {
      const OCDContract = await ethers.getContractFactory("OnChainDistributor");

      OnChainDistributor = await OCDContract.deploy();
    });

    describe("joinRoom()", function () {
      it("Should be able to join a room", async function () {
        const room = "TestRoom";

        await OnChainDistributor.joinRoom(room);
        expect(await OnChainDistributor.roomCount(room)).to.equal(1);
      });
    });

    describe("addRoomUsers()", function () {
      it("Should be able to bulk add users to a room", async function () {
        const room = "TestRoom2";
        const users = (await ethers.getSigners()).map((u) => u.address);

        await OnChainDistributor.addRoomUsers(room, users);
        expect(await OnChainDistributor.roomCount(room)).to.equal(users.length);
      });
    });
  });
});
