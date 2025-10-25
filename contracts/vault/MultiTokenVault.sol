// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../libraries/TokenConfig.sol";

/**
 * @title MultiTokenVault
 * @dev Vault supporting multiple tokens (cUSD, USDC, CELO) with yield generation
 */
contract MultiTokenVault is ERC20, ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;

    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, address indexed token, uint256 shares, uint256 amount);
    event StrategyUpdated(address indexed oldStrategy, address indexed newStrategy);
    event TokenWhitelisted(address indexed token, bool isWhitelisted);
    event EmergencyWithdraw(address indexed user, address indexed token, uint256 amount);

    // State variables
    mapping(address => bool) public whitelistedTokens;
    mapping(address => mapping(address => uint256)) public userTokenShares; // user => token => shares
    mapping(address => uint256) public totalTokenAssets; // token => total assets
    mapping(address => uint256) public totalTokenShares; // token => total shares
    
    address public strategy;
    uint256 public constant MAX_FEE = 1000; // 10% max fee
    uint256 public depositFee = 0; // 0% deposit fee
    uint256 public withdrawalFee = 0; // 0% withdrawal fee
    uint256 public performanceFee = 200; // 2% performance fee

    // Modifiers
    modifier onlyWhitelistedToken(address token) {
        require(whitelistedTokens[token], "Token not whitelisted");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than 0");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address _strategy
    ) ERC20(name, symbol) {
        strategy = _strategy;
        
        // Whitelist supported tokens
        address[] memory supportedTokens = TokenConfig.getAllSupportedTokens();
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            whitelistedTokens[supportedTokens[i]] = true;
            emit TokenWhitelisted(supportedTokens[i], true);
        }
    }

    /**
     * @dev Deposit tokens into the vault
     * @param token Token address to deposit
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        onlyWhitelistedToken(token)
        validAmount(amount)
    {
        TokenConfig.TokenInfo memory tokenInfo = TokenConfig.getTokenInfo(token);
        require(amount >= tokenInfo.minDeposit, "Amount below minimum");
        require(amount <= tokenInfo.maxDeposit, "Amount above maximum");

        uint256 depositAmount = amount;
        
        // Handle native CELO deposits
        if (TokenConfig.isNativeToken(token)) {
            require(msg.value == amount, "Incorrect CELO amount");
        } else {
            // Transfer ERC20 tokens
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }

        // Calculate shares to mint
        uint256 shares = convertToShares(token, depositAmount);
        require(shares > 0, "Shares must be greater than 0");

        // Apply deposit fee if any
        if (depositFee > 0) {
            uint256 feeAmount = depositAmount.mul(depositFee).div(10000);
            depositAmount = depositAmount.sub(feeAmount);
            shares = convertToShares(token, depositAmount);
        }

        // Update state
        userTokenShares[msg.sender][token] = userTokenShares[msg.sender][token].add(shares);
        totalTokenAssets[token] = totalTokenAssets[token].add(depositAmount);
        totalTokenShares[token] = totalTokenShares[token].add(shares);

        // Mint vault shares
        _mint(msg.sender, shares);

        // Transfer to strategy if not native token
        if (!TokenConfig.isNativeToken(token)) {
            IERC20(token).approve(strategy, depositAmount);
            // Strategy will handle the deposit
        }

        emit Deposit(msg.sender, token, depositAmount, shares);
    }

    /**
     * @dev Withdraw tokens from the vault
     * @param token Token address to withdraw
     * @param shares Shares to burn
     */
    function withdraw(address token, uint256 shares) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyWhitelistedToken(token)
        validAmount(shares)
    {
        require(userTokenShares[msg.sender][token] >= shares, "Insufficient shares");
        require(totalTokenShares[token] >= shares, "Insufficient total shares");

        // Calculate assets to withdraw
        uint256 assets = convertToAssets(token, shares);
        require(assets > 0, "Assets must be greater than 0");

        // Apply withdrawal fee if any
        uint256 feeAmount = 0;
        if (withdrawalFee > 0) {
            feeAmount = assets.mul(withdrawalFee).div(10000);
            assets = assets.sub(feeAmount);
        }

        // Update state
        userTokenShares[msg.sender][token] = userTokenShares[msg.sender][token].sub(shares);
        totalTokenAssets[token] = totalTokenAssets[token].sub(assets.add(feeAmount));
        totalTokenShares[token] = totalTokenShares[token].sub(shares);

        // Burn vault shares
        _burn(msg.sender, shares);

        // Transfer tokens to user
        if (TokenConfig.isNativeToken(token)) {
            payable(msg.sender).transfer(assets);
        } else {
            IERC20(token).transfer(msg.sender, assets);
        }

        emit Withdraw(msg.sender, token, shares, assets);
    }

    /**
     * @dev Convert assets to shares for a specific token
     * @param token Token address
     * @param assets Asset amount
     * @return shares Share amount
     */
    function convertToShares(address token, uint256 assets) public view returns (uint256) {
        if (totalTokenShares[token] == 0) {
            return assets; // 1:1 ratio for first deposit
        }
        return assets.mul(totalTokenShares[token]).div(totalTokenAssets[token]);
    }

    /**
     * @dev Convert shares to assets for a specific token
     * @param token Token address
     * @param shares Share amount
     * @return assets Asset amount
     */
    function convertToAssets(address token, uint256 shares) public view returns (uint256) {
        if (totalTokenShares[token] == 0) {
            return 0;
        }
        return shares.mul(totalTokenAssets[token]).div(totalTokenShares[token]);
    }

    /**
     * @dev Get user's asset balance for a specific token
     * @param user User address
     * @param token Token address
     * @return balance Asset balance
     */
    function userAssetBalance(address user, address token) external view returns (uint256) {
        uint256 shares = userTokenShares[user][token];
        return convertToAssets(token, shares);
    }

    /**
     * @dev Get user's shares for a specific token
     * @param user User address
     * @param token Token address
     * @return shares Share amount
     */
    function userTokenSharesBalance(address user, address token) external view returns (uint256) {
        return userTokenShares[user][token];
    }

    /**
     * @dev Get total assets for a specific token
     * @param token Token address
     * @return assets Total asset amount
     */
    function totalAssets(address token) external view returns (uint256) {
        return totalTokenAssets[token];
    }

    /**
     * @dev Get total shares for a specific token
     * @param token Token address
     * @return shares Total share amount
     */
    function totalShares(address token) external view returns (uint256) {
        return totalTokenShares[token];
    }

    /**
     * @dev Get current APY for a specific token (placeholder - will be implemented by strategy)
     * @param token Token address
     * @return apy APY in basis points (e.g., 800 = 8%)
     */
    function getAPY(address token) external view returns (uint256) {
        // This will be implemented by the strategy contract
        // For now, return a placeholder value
        return 800; // 8% APY
    }

    /**
     * @dev Update strategy contract
     * @param newStrategy New strategy address
     */
    function updateStrategy(address newStrategy) external onlyOwner {
        require(newStrategy != address(0), "Invalid strategy address");
        address oldStrategy = strategy;
        strategy = newStrategy;
        emit StrategyUpdated(oldStrategy, newStrategy);
    }

    /**
     * @dev Whitelist/unwhitelist a token
     * @param token Token address
     * @param isWhitelisted Whether to whitelist the token
     */
    function setTokenWhitelist(address token, bool isWhitelisted) external onlyOwner {
        whitelistedTokens[token] = isWhitelisted;
        emit TokenWhitelisted(token, isWhitelisted);
    }

    /**
     * @dev Set fees
     * @param _depositFee Deposit fee in basis points
     * @param _withdrawalFee Withdrawal fee in basis points
     * @param _performanceFee Performance fee in basis points
     */
    function setFees(
        uint256 _depositFee,
        uint256 _withdrawalFee,
        uint256 _performanceFee
    ) external onlyOwner {
        require(_depositFee <= MAX_FEE, "Deposit fee too high");
        require(_withdrawalFee <= MAX_FEE, "Withdrawal fee too high");
        require(_performanceFee <= MAX_FEE, "Performance fee too high");
        
        depositFee = _depositFee;
        withdrawalFee = _withdrawalFee;
        performanceFee = _performanceFee;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw function (only when paused)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external whenPaused {
        require(userTokenShares[msg.sender][token] > 0, "No shares to withdraw");
        
        if (TokenConfig.isNativeToken(token)) {
            require(address(this).balance >= amount, "Insufficient CELO balance");
            payable(msg.sender).transfer(amount);
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
            IERC20(token).transfer(msg.sender, amount);
        }
        
        emit EmergencyWithdraw(msg.sender, token, amount);
    }

    /**
     * @dev Get token configuration information
     * @param token Token address
     * @return TokenInfo struct with token configuration
     */
    function getTokenInfo(address token) external pure returns (TokenConfig.TokenInfo memory) {
        return TokenConfig.getTokenInfo(token);
    }

    /**
     * @dev Receive function for CELO deposits
     */
    receive() external payable {
        // Only allow CELO deposits through the deposit function
        revert("Use deposit function for CELO");
    }
}
