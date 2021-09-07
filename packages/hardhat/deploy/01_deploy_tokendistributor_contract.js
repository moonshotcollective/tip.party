// deploy/00_deploy_tokendistributor_contract.js

const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, getChainId, deployments }) => {
  // const frontendAddress = "YOUR_FRONTEND_ADDRESS";
  const frontendAddress = "0x3f15B8c6F9939879Cb030D6dd935348E57109637";

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

  // run this if not for production deployment
  if (chainId !== 1) {
    await deploy("DummyToken", {
      from: deployer,
      log: true,
    });

    const dummyTokenContract = await ethers.getContract("DummyToken", deployer);

    // transfer ownership to UI owner if needed
    await tokenDistributorContract.transferOwnership(frontendAddress);
    console.log(`Owned`);

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

module.exports.tags = ["TokenDistributor", "DummyToken"];
