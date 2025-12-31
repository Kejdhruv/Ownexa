const hre = require("hardhat");

async function main() {
  const Stocks = await hre.ethers.getContractFactory("PropertyToken");
  console.log("Deploying Stocks...");

  const PropertyContract = await Stocks.deploy();
  await PropertyContract.waitForDeployment();

  console.log("Stocks Contract deployed to:", PropertyContract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 

