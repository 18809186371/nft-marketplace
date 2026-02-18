const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 部署 SimpleNFT
  const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");
  const simpleNFT = await SimpleNFT.deploy();
  await simpleNFT.waitForDeployment();
  const simpleNFTAddress = await simpleNFT.getAddress();
  console.log("SimpleNFT at:", simpleNFTAddress);

  // 部署市场合约（只需传入手续费接收地址）
  const Marketplace = await hre.ethers.getContractFactory("NFTMarketPlace");
  const marketplace = await Marketplace.deploy(deployer.address); // 使用部署者作为手续费接收地址
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace at:", marketplaceAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});