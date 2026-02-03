const hre = require('hardhat');

async function main() {
    const SimpleNFT = await hre.ethers.getContractFactory('SimpleNFT');
    const simpleNFT = await SimpleNFT.deploy();
    await simpleNFT.waitForDeployment();
    const simpleAddress = await simpleNFT.getAddress();
    console.log("SimpleNFT deployed to:", simpleAddress);


    const NFTMarketPlace = await hre.ethers.getContractFactory('NFTMarketPlace');
    const nftMarketPlace = await NFTMarketPlace.deploy();
    await nftMarketPlace.waitForDeployment();
    const marketAddress = await nftMarketPlace.getAddress();
    console.log("NFTNFTMarketPlace deployed to:", marketAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});