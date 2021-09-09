// deploy/00_deploy_tokendistributor_contract.js
require("dotenv").config();
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, getChainId, deployments }) => {
  // const frontendAddress = "YOUR_FRONTEND_ADDRESS";
  const frontendAddress = process.env.FRONTENDADDRESS;
  const receiverAddress = process.env.RECEIVERADDRESS;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  await deploy("TokenDistributor", {
    from: deployer,
    args: [frontendAddress],
    log: true,
  });

  const tokenDistributorContract = await ethers.getContract(
    "TokenDistributor",
    deployer
  );

  // deploy Tipsta
  await deploy("Tipsta", {
    from: deployer,
    args: [
      tokenDistributorContract.address,
      receiverAddress,
      "100000000000000000",
    ],
    log: true,
  });

  const tipstaContract = await ethers.getContract("Tipsta", deployer);
  const adminRole = await tokenDistributorContract.DEFAULT_ADMIN_ROLE();

  // give admin role to Tipsta - Tipsta can add new distributors
  await tokenDistributorContract.grantRole(adminRole, tipstaContract.address);

  // run this if not for production deployment
  if (chainId !== 1) {
    // send test ETH to developer address on localhost
    const developerAddress = process.env.DEVELOPER;

    if (chainId === 31337 && developerAddress) {
      const deployerWallet = ethers.provider.getSigner();
      await deployerWallet.sendTransaction({
        to: developerAddress,
        value: ethers.utils.parseEther("1"),
      });
    }

    await deploy("DummyToken", {
      from: deployer,
      log: true,
    });

    const dummyTokenContract = await ethers.getContract("DummyToken", deployer);

    // transfer ownership to UI owner if needed
    await tokenDistributorContract.transferOwnership(frontendAddress);

    const mintedBalance = await dummyTokenContract.balanceOf(deployer);
    const splitValue = mintedBalance.div(ethers.BigNumber.from(2));

    // split tokens between frontendAddress and tokenDistributorContract for later distribution
    await dummyTokenContract.transfer(frontendAddress, splitValue);
    await dummyTokenContract.transfer(
      tokenDistributorContract.address,
      splitValue
    );

    // split dummyToken balance between frontend account and tokenDistributor
    const frontendBalance = await dummyTokenContract.balanceOf(frontendAddress);
    const distributorBalance = await dummyTokenContract.balanceOf(
      tokenDistributorContract.address
    );

    console.log({
      frontend: frontendBalance.toString(),
      distributor: distributorBalance.toString(),
    });
  }
};

module.exports.tags = ["TokenDistributor", "DummyToken", "Tipsta"];
