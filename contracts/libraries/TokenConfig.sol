// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TokenConfig
 * @dev Configuration for supported tokens on Celo Alfajores testnet
 */
library TokenConfig {
    struct TokenInfo {
        address tokenAddress;
        string symbol;
        string name;
        uint8 decimals;
        bool isNative; // true for CELO, false for ERC20 tokens
        uint256 maxDeposit; // Maximum deposit amount per user
        uint256 minDeposit; // Minimum deposit amount
        bool isActive; // Whether token is currently supported
    }

// Celo Alfajores testnet token addresses
address public constant CUSD_ADDRESS = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
address public constant USDC_ADDRESS = 0x41f4C5E67e9Ecf8C2c53d9B25C4c5B4f8C26b6e8;
address public constant CELO_ADDRESS = address(0); // Native token

    // Token configurations
    function getTokenInfo(address token) internal pure returns (TokenInfo memory) {
        if (token == CUSD_ADDRESS) {
            return TokenInfo({
                tokenAddress: CUSD_ADDRESS,
                symbol: "cUSD",
                name: "Celo Dollar",
                decimals: 18,
                isNative: false,
                maxDeposit: 1000000 * 10**18, // 1M cUSD
                minDeposit: 1 * 10**18, // 1 cUSD
                isActive: true
            });
        } else if (token == USDC_ADDRESS) {
            return TokenInfo({
                tokenAddress: USDC_ADDRESS,
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                isNative: false,
                maxDeposit: 1000000 * 10**6, // 1M USDC
                minDeposit: 1 * 10**6, // 1 USDC
                isActive: true
            });
        } else if (token == CELO_ADDRESS) {
            return TokenInfo({
                tokenAddress: CELO_ADDRESS,
                symbol: "CELO",
                name: "Celo",
                decimals: 18,
                isNative: true,
                maxDeposit: 100000 * 10**18, // 100K CELO
                minDeposit: 1 * 10**18, // 1 CELO
                isActive: true
            });
        } else {
            revert("TokenConfig: Unsupported token");
        }
    }

    function isSupportedToken(address token) internal pure returns (bool) {
        return token == CUSD_ADDRESS || token == USDC_ADDRESS || token == CELO_ADDRESS;
    }

    function getAllSupportedTokens() internal pure returns (address[] memory) {
        address[] memory tokens = new address[](3);
        tokens[0] = CUSD_ADDRESS;
        tokens[1] = USDC_ADDRESS;
        tokens[2] = CELO_ADDRESS;
        return tokens;
    }

    function getTokenSymbol(address token) internal pure returns (string memory) {
        return getTokenInfo(token).symbol;
    }

    function getTokenDecimals(address token) internal pure returns (uint8) {
        return getTokenInfo(token).decimals;
    }

    function isNativeToken(address token) internal pure returns (bool) {
        return getTokenInfo(token).isNative;
    }
}
