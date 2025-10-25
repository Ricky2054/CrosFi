# Fix MetaMask "No Conversion Rate Available" Issue

## 🔧 **Problem**
MetaMask shows "No conversion rate available" for cUSD, cEUR, and cREAL tokens on Celo Alfajores Testnet.

## ✅ **Solution**

### **Step 1: Get Testnet Tokens**
The main issue is that you have "0" balance for these tokens. Get testnet tokens from:

1. **Celo Official Faucet**: https://celo.org/developers/faucet
2. **Chainlink Faucet**: https://faucets.chain.link/celo-alfajores-testnet

### **Step 2: Add Tokens to MetaMask**
Use these contract addresses to add tokens manually:

| Token | Contract Address | Symbol | Decimals |
|-------|------------------|--------|----------|
| cUSD  | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` | cUSD | 18 |
| cEUR  | `0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F` | cEUR | 18 |
| cREAL | `0xE4D517785D091D3c54818832dB6094bcc2744545` | cREAL | 18 |

### **Step 3: Import Tokens in MetaMask**
1. Open MetaMask Chrome Extension
2. Click "Import tokens" at the bottom
3. Select "Custom Token"
4. Paste the contract address
5. Enter symbol and decimals (18)
6. Click "Add Custom Token"

### **Step 4: Why "No Conversion Rate Available"**
- **This is normal for testnet tokens**
- MetaMask doesn't show prices for testnet tokens by design
- Testnet tokens have no real value
- The app now shows estimated values for display purposes

## 🎯 **Expected Results**

After following these steps:
- ✅ Tokens will show actual balances (not "0")
- ✅ You can use tokens in the vault
- ✅ MetaMask will still show "No conversion rate" (this is normal)
- ✅ The app will show estimated values for display

## 💡 **Alternative Solutions**

1. **Use the app's token display** - Shows estimated values
2. **Check CeloScan** - https://alfajores.celoscan.io/ (enter your wallet address)
3. **Use Valora wallet** - Better support for Celo tokens

## 📱 **Quick Fix**

The vault page now includes:
- **MetaMaskTokenFix component** - Shows contract addresses and instructions
- **TokenPriceDisplay component** - Shows estimated values for all tokens

This provides a complete solution for the conversion rate issue!
