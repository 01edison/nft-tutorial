const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer, player } = await getNamedAccounts();
  const chainId = network.config.chainId;
  log(
    `Deploying to the ${chainId == 31337 ? "local" : network.name} test net..`
  );
  log(`Deployer: ${deployer}`);
  log(`Player: ${player}`);
  const basicNFT = await deploy("BasicNFT", {
    from: deployer,
    args: [],
    log: true,
  });

  if (chainId != 31337) {
    log("Verifying....");
    await verify(basicNFT.address, []);
  }
  log("Deployed successfully!");
  log("--------------------------------------------");
};
module.exports.tags = ["basicNFT"];
