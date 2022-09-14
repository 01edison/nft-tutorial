const {ethers} = require("hardhat")

const BASE_FEE = "100000000000000000";
const GAS_PRICE_LINK = "1000000000"; // 0.000000001 LINK per gas
const DECIMALS = "18";
const INITIAL_ANSWER = ethers.utils.parseUnits("2000", "ether");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer} = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId == 31337) {
    log("Deploying to local network..");

    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    });

    await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER]
    })
    log("Mocks Deployed!")
    log("----------------------------------------------------")
  }
};

module.exports.tags = ["all", "mocks"];