# NFT Marketplace 项目

这是一个完整的去中心化 NFT 市场（NFT Marketplace）学习项目，基于以太坊 **Sepolia** 测试网开发。包含智能合约（Hardhat）和前端应用（Next.js），实现了 NFT 的铸造、上架、购买以及个人藏品展示等功能。

---

## ✨ 项目特点

* **完整的 NFT 铸造流程**：图片上传至 IPFS，元数据自动生成。
* **市场合约逻辑**：支持 NFT 的上架、购买、取消上架。
* **个人资产展示**：展示用户拥有的 NFT 和已上架的 NFT。
* **链上数据集成**：使用 Alchemy 获取数据，Etherscan 验证合约。
* **去中心化存储**：使用 Filebase (S3-compatible IPFS) 存储资源。

## 🛠 技术栈

* **智能合约**: Solidity 0.8.28 + OpenZeppelin
* **开发框架**: Hardhat
* **前端**: Next.js 14 (App Router) + TypeScript
* **区块链交互**: ethers v6
* **数据索引**: Alchemy SDK + Etherscan API
* **存储**: Filebase (S3-compatible IPFS)
* **UI 组件**: shadcn/ui + Tailwind CSS

---

## 🚀 快速开始

### 前置条件

* Node.js 18+ 和 npm/yarn
* MetaMask 钱包（用于交互）
* 一些 Sepolia 测试网 ETH（可从 [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia) 获取）

### 1. 克隆仓库
```bash
git clone [https://github.com/18809186371/nft-marketplace.git](https://github.com/18809186371/nft-marketplace.git)
cd nft-marketplace
```
### 2. 安装依赖
```bash
# 安装根目录依赖（合约开发）
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```
## ⚙️环境变量配置
根目录 `.env` 文件
在根目录创建 `.env` 文件，用于 Hardhat 部署和验证：
```env
# Alchemy Sepolia RPC URL（用于部署）
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# 部署账户的私钥（不要提交到 Git！）
SEPOLIA_PRIVATE_KEY=你的钱包私钥（0x开头）

# Etherscan API Key（用于验证合约）
ETHERSCAN_API_KEY=你的Etherscan API密钥
```

获取方式：
 - `SEPOLIA_RPC_URL`: 登录 [Alchemy](https://www.alchemy.com/) → 创建新 App（选择 Ethereum Sepolia）→ 复制 HTTPS 端点。
 - `SEPOLIA_PRIVATE_KEY`: 从 MetaMask 导出账户私钥（设置 → 安全与隐私 → 导出私钥），注意：测试网私钥相对安全，但请勿用于主网。
 - `ETHERSCAN_API_KEY`: 登录 [Etherscan](https://etherscan.io/) → 右上角用户名 → API Keys → 创建新密钥。

 前端目录 `frontend/.env.local` 文件
 在 `frontend` 目录下创建 `.env.local` 文件：
```env
# 部署后的合约地址
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x你的SimpleNFT合约地址
NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS=0x你的NFTMarketPlace合约地址

# RPC URL（与根目录相同或复用）
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Filebase 配置（用于 IPFS 上传）
NEXT_PUBLIC_FILEBASE_ACCESS_KEY=你的Filebase访问密钥
NEXT_PUBLIC_FILEBASE_SECRET_KEY=你的Filebase密钥
NEXT_PUBLIC_FILEBASE_BUCKET=你的存储桶名称

# Alchemy API Key（用于获取 NFT 元数据）
NEXT_PUBLIC_ALCHEMY_API_KEY=你的Alchemy API密钥

# Etherscan API Key（用于快速获取事件）
NEXT_PUBLIC_ETHERSCAN_API_KEY=你的Etherscan API密钥
```
获取方式：
 - 合约地址：部署合约后从控制台输出复制（见下方部署步骤）。
 - `NEXT_PUBLIC_RPC_URL`: 同根目录的 `SEPOLIA_RPC_URL`。
 - Filebase 密钥：
 1. 注册 [Filebase](https://filebase.com/)
 2. 创建存储桶（Bucket），记下桶名称。
 3. 在“Access Keys”页面生成 Access Key 和 Secret Key。
 - `NEXT_PUBLIC_ALCHEMY_API_KEY`: 与 RPC URL 中的 API Key 相同（可复用）。
 - `NEXT_PUBLIC_ETHERSCAN_API_KEY`: 与根目录的 ETHERSCAN_API_KEY 相同。
部署合约
1. 编译合约
```bash
npx hardhat compile
```
2. 部署到sepolia测试网
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
部署成功后，控制台会输出 `SimpleNFT` 和 `NFTMarketPlace` 的合约地址，请将它们填入前端的 .env.local。
3. 验证合约（可选，但推荐）
```bash
# 验证 SimpleNFT
npx hardhat verify --network sepolia 你的SimpleNFT合约地址

# 验证 NFTMarketPlace（需要构造函数参数：手续费接收地址）
npx hardhat verify --constructor-args arguments.js 你的NFTMarketPlace合约地址 --network sepolia
```
其中 arguments.js 文件内容为：
```bash
module.exports = ["0x你的手续费接收地址"]; // 通常为部署者地址
```
运行前端
1. 启动开发服务器
```bash
cd frontend
npm run dev
```
2. 访问应用
打开浏览器访问 `http://localhost:3000`。
3. 功能说明
 - 首页（市场）：浏览所有已上架的 NFT，可按价格或最新排序。
 - 铸造页面：上传图片，填写名称和描述，铸造自己的 NFT（图片上传至 Filebase）。
 - 个人页面：查看自己拥有的 NFT 和已上架的 NFT，支持上架和取消上架。
 - 详情页：查看 NFT 详细信息，可购买在售的 NFT。

常见问题
Q: 图片无法显示?

A: 由于 IPFS 网关的特殊性，建议使用原生 <img> 标签而非 Next.js Image 组件。本项目已处理。

Q: 交易失败或事件查询不到？

A: 确保 MetaMask 网络切换为 Sepolia，并且账户有足够的测试 ETH。事件查询已集成 Etherscan API，如遇失败会自动回退到 RPC 查询。

Q: 如何获取 Sepolia 测试 ETH？

A: 使用水龙头（如 Alchemy Sepolia Faucet），输入钱包地址即可领取。

贡献指南
欢迎提交 Issue 和 Pull Request 来改进项目。请确保代码风格一致，并更新相关文档。

许可证
MIT

> Happy Learning! 如果这个项目对你有所帮助，请给个 ⭐ 支持一下。