// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NFTMarketPlace {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
    }

    uint256 public feeBasisPoints = 250; // 2.5%
    address payable public feeRecipient; // 在构造函数中设置
    mapping(address => mapping(uint256 => Listing)) public listings;

    event ItemListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemSold(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ListingCancelled(address indexed seller, address indexed nftContract, uint256 tokenId);

    // 构造函数，设置手续费接收地址为部署者
    constructor() {
        feeRecipient = payable(msg.sender);
    }

    // 上架NFT
    function listItem(address nftContract, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be > 0");
        // 这里需要你自行实现或调用一个IERC721的 `ownerOf` 和 `getApproved`/`isApprovedForAll` 检查
        // 为了简化，我们暂时假设调用者已授权且是所有者
        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            isActive: true
        });
        emit ItemListed(msg.sender, nftContract, tokenId, price);
    }

    // 购买NFT (关键：通过先更新状态再转账来防止重入)
    function buyItem(address nftContract, uint256 tokenId) external payable {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.isActive, "Not for sale");
        require(msg.value == listing.price, "Incorrect payment");

        // 1. 先更新状态，防止重入
        listing.isActive = false;

        // 2. 计算费用
        uint256 fee = (msg.value * feeBasisPoints) / 10000;
        uint256 sellerProceeds = msg.value - fee;

        // 3. 转账（注意：简化版，未使用call的返回值检查，生产环境需要）
        (bool sentToSeller, ) = payable(listing.seller).call{value: sellerProceeds}("");
        (bool sentToFee, ) = feeRecipient.call{value: fee}("");
        require(sentToSeller && sentToFee, "Payment failed");

        // 4. 转移NFT（这里需要你实现或调用NFT合约的safeTransferFrom）
        // 例如：IERC721(nftContract).safeTransferFrom(listing.seller, msg.sender, tokenId);
        // 由于我们的SimpleNFT没有实现transfer，这里暂时注释，你需要根据实际NFT合约调整
        // transferNFT(nftContract, listing.seller, msg.sender, tokenId);

        emit ItemSold(msg.sender, nftContract, tokenId, msg.value);
        delete listings[nftContract][tokenId]; // 删除记录
    }

    // 取消上架
    function cancelListing(address nftContract, uint256 tokenId) external {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.isActive, "Not active");
        require(listing.seller == msg.sender, "Not seller");
        listing.isActive = false;
        delete listings[nftContract][tokenId];
        emit ListingCancelled(msg.sender, nftContract, tokenId);
    }
}