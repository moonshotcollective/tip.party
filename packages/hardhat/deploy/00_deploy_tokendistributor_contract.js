// deploy/00_deploy_tokendistributor_contract.js
require("dotenv").config();
const { ethers } = require("hardhat");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, getChainId, deployments }) => {
  const developerAddress = process.env.DEVELOPER;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const deployerWallet = ethers.provider.getSigner();
  const confirmationRequirement = chainId === localChainId ? 1 : 3;

  await deploy("TokenDistributor", {
    from: deployer,
    args: [],
    log: true,
  });

  const tokenDistributorContract = await ethers.getContract(
    "TokenDistributor",
    deployer
  );

  let GTC = { address: "0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F" };

  // run this if not for production deployment
  if (chainId === "31337" && developerAddress) {
    // send test ETH to developer address on localhost
    const devTransfer = await deployerWallet.sendTransaction({
      to: developerAddress,
      value: ethers.utils.parseEther("0.15"),
    });

    await devTransfer.wait(confirmationRequirement);

    await deploy("GTC", {
      from: deployer,
      args: [developerAddress],
      log: true,
    });

    const GTC = await ethers.getContract("GTC", deployer);
  }

  // transfer ownership to UI owner if needed
  const ownershipTransfer = await tokenDistributorContract.transferOwnership(
    developerAddress
  );

  await ownershipTransfer.wait(confirmationRequirement);

  // Verify your contracts with Etherscan
  // You don't want to verify on localhost
  if (chainId !== localChainId) {
    // wait for etherscan to be ready to verify
    await sleep(15000);
    await run("verify:verify", {
      address: TokenDistributor.address,
      contract: "contracts/TokenDistributor.sol:TokenDistributor",
      contractArguments: [],
    });
  }
};

module.exports.tags = ["TokenDistributor", "GTC"];
