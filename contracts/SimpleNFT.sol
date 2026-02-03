// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 手动定义一个最简化的 ERC-721 接口，用于实现核心功能
interface IERC721 {
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

contract SimpleNFT {
    string public name = "SimpleNFT";
    string public symbol = "SNFT";
    uint256 public totalSupply; // 当前Token ID，也代表总供应量
    mapping(uint256 => address) private _owners; // Token ID => 所有者
    mapping(address => uint256) private _balances; // 地址 => 拥有的数量

    // 铸造事件
    event Mint(address indexed to, uint256 indexed tokenId);

    // 铸造函数
    function mint(address to) public returns (uint256) {
        totalSupply++; // Token ID 递增
        uint256 newTokenId = totalSupply;
        _owners[newTokenId] = to;
        _balances[to]++;
        emit Mint(to, newTokenId);
        return newTokenId;
    }

    // 基础查询函数（为了兼容性）
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Address zero is not a valid owner");
        return _balances[owner];
    }
}