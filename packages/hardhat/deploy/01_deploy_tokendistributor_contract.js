// deploy/00_deploy_tokendistributor_contract.js
require("dotenv").config();
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, getChainId, deployments }) => {
  const frontendAddress = process.env.FRONTENDADDRESS;
  const receiverAddress = process.env.RECEIVERADDRESS;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const deployerWallet = ethers.provider.getSigner();

  const confirmationRequirement = chainId === "31337" ? 1 : 3;

  await deploy("TokenDistributor", {
    from: deployer,
    log: true,
  });

  const tokenDistributorContract = await ethers.getContract(
    "TokenDistributor",
    deployer
  );


  // run this if not for production deployment
  if (chainId !== "1") {
    // send test ETH to developer address on localhost
    const developerAddress = process.env.DEVELOPER;

    if (chainId === "31337" && developerAddress) {
      const devTransfer = await deployerWallet.sendTransaction({
        to: developerAddress,
        value: ethers.utils.parseEther("0.15"),
      });

      await devTransfer.wait(confirmationRequirement);
    }

    await deploy("dGTC", {
      from: deployer,
      log: true,
    });

    const dummyTokenContract = await ethers.getContract("dGTC", deployer);




    const mintedBalance = await dummyTokenContract.balanceOf(deployer);
    // split tokens between frontendAddress and tokenDistributorContract for later distribution

    const dummySplit = await dummyTokenContract.transfer(
      frontendAddress,
      mintedBalance
    );


    await dummySplit.wait(confirmationRequirement);


    // split dummyToken balance between frontend account and tokenDistributor
    const frontendBalance = await dummyTokenContract.balanceOf(frontendAddress);


    console.log({
      frontend: frontendBalance.toString(),
    });
  }
};

module.exports.tags = ["TokenDistributor", "dGTC", "Tipsta"];
