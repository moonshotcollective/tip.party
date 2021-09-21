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
  console.log(`Loaded tipstaContract`);

  const adminRole = await tokenDistributorContract.DEFAULT_ADMIN_ROLE();
  console.log(`Loaded Admin role`);

  // give admin role to Tipsta - Tipsta can add new distributors
  const roleReq = await tokenDistributorContract.grantRole(
    adminRole,
    tipstaContract.address
  );
  console.log(`Granted Admin role to tipstaContract... awaiting confirmations`);

  await roleReq.wait(confirmationRequirement);
  console.log(`Confirmations received`);

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

    // transfer ownership to UI owner if needed
    const ownershipTransfer = await tokenDistributorContract.transferOwnership(
      frontendAddress
    );

    await ownershipTransfer.wait(confirmationRequirement);

    const mintedBalance = await dummyTokenContract.balanceOf(deployer);
    const splitValue = mintedBalance.div(ethers.BigNumber.from(2));

    // split tokens between frontendAddress and tokenDistributorContract for later distribution
    const dummySplit1 = await dummyTokenContract.transfer(
      frontendAddress,
      splitValue
    );

    await dummySplit1.wait(confirmationRequirement);

    const dummySplit2 = await dummyTokenContract.transfer(
      tokenDistributorContract.address,
      splitValue
    );

    await dummySplit2.wait(confirmationRequirement);

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

module.exports.tags = ["TokenDistributor", "dGTC", "Tipsta"];
