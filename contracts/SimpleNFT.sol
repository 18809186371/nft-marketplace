// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleNFT is ERC721, ERC721URIStorage, Ownable {
    // 直接用 uint256 记录下一个可用的 tokenId（从 0 开始）
    uint256 private _tokenIdCounter;

    // 构造函数：设置 NFT 名称和符号，并初始化 Ownable
    constructor() ERC721("SimpleNFT", "SNFT") Ownable(msg.sender) {}

    /**
     * @dev 安全的铸造函数
     * @param to NFT接收者地址
     * @param uri 指向该NFT元数据JSON文件的链接（IPFS链接等）
     * @return 新铸造的tokenId
     */
    function safeMint(address to, string memory uri) public returns (uint256) {
        // 获取当前 tokenId（从 0 开始）
        uint256 newTokenId = _tokenIdCounter;
        // 安全铸造：检查接收地址是否支持 ERC721 接收
        _safeMint(to, newTokenId);
        // 设置元数据 URI
        _setTokenURI(newTokenId, uri);
        // tokenId 递增，准备下一次铸造
        _tokenIdCounter++;

        return newTokenId;
    }

    /**
     * @dev 简化铸造函数
     * 注意：此函数传递空字符串作为 URI，铸造出来的 NFT 元数据将为空。
     * 建议前端改为调用 safeMint(to, uri) 传入真实 URI。
     */
    function mint(address to) public returns (uint256) {
        return safeMint(to, "");
    }

    // ----- 必须的重写函数（ERC721 与 ERC721URIStorage 的继承冲突解决）-----
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}