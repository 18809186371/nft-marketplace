// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 导入OpenZeppelin的安全合约和ERC721接口
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract NFTMarketPlace is ReentrancyGuard {
    using Address for address payable;

    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    uint256 public feeBasisPoints = 250; // 2.5%
    address payable public feeRecipient;

    // nftContract => (tokenId => Listing)
    mapping(address => mapping(uint256 => Listing)) public listings;

    event ItemListed(
        address indexed seller,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemSold(
        address indexed buyer,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 price
    );
    event ListingCancelled(
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId
    );

    // 改进：允许在部署时设置手续费接收地址
    constructor(address payable _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // ========== 核心修复 1: 添加上架前的完整权限检查 ==========
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be > 0");

        // 1. 检查调用者是否为NFT所有者
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not the NFT owner"
        );

        // 2. 检查市场合约是否已被授权转移此NFT
        // 优先检查 getApproved，如果未单独授权，则检查 isApprovedForAll
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
                IERC721(nftContract).isApprovedForAll(
                    msg.sender,
                    address(this)
                ),
            "Marketplace not approved to transfer this NFT"
        );

        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit ItemListed(msg.sender, nftContract, tokenId, price);
    }

    // ========== 核心修复 2: 在购买时实际转移NFT ==========
    function buyItem(
        address nftContract,
        uint256 tokenId
    ) external payable nonReentrant {
        Listing storage listing = listings[nftContract][tokenId];

        require(listing.isActive, "Not for sale");
        require(msg.value == listing.price, "Incorrect payment");
        require(listing.seller != msg.sender, "Seller cannot buy own listing");

        // 1. 先更新状态，防止重入
        listing.isActive = false;

        // 2. 计算费用和卖家收益
        uint256 fee = (msg.value * feeBasisPoints) / 10000;
        uint256 sellerProceeds = msg.value - fee;

        // 3. 转账（使用OpenZeppelin的sendValue，更安全）
        payable(listing.seller).sendValue(sellerProceeds);
        feeRecipient.sendValue(fee);

        // 4. 转移NFT（关键修复！）
        IERC721(nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            tokenId
        );

        // 5. 删除上架记录并触发事件
        delete listings[nftContract][tokenId];
        emit ItemSold(msg.sender, nftContract, tokenId, msg.value);
    }

    function cancelListing(
        address nftContract,
        uint256 tokenId
    ) external nonReentrant {
        Listing storage listing = listings[nftContract][tokenId];

        require(listing.isActive, "Not active");
        require(listing.seller == msg.sender, "Not seller");

        // 额外检查：确保NFT所有权未发生变化
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "No longer the NFT owner"
        );

        delete listings[nftContract][tokenId];
        emit ListingCancelled(msg.sender, nftContract, tokenId);
    }

    // 辅助函数：查看某个NFT是否已上架
    function getListing(
        address nftContract,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return listings[nftContract][tokenId];
    }
}
