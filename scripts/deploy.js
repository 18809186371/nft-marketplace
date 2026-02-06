const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");
  const simpleNFT = await SimpleNFT.deploy();
  await simpleNFT.waitForDeployment();
  const nftAddress = await simpleNFT.getAddress();
  console.log("SimpleNFT at:", nftAddress);

  const Marketplace = await hre.ethers.getContractFactory("NFTMarketPlace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();
  console.log("Marketplace at:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});