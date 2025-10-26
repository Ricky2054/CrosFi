/**
 * Gnosis Safe integration utilities
 * Handles Safe context detection and provider setup
 */

import { ethers } from 'ethers'
import SafeAppsSDK, { SafeInfo } from '@safe-global/safe-apps-sdk'
import { SafeAppProvider } from '@safe-global/safe-apps-provider'

let sdk: SafeAppsSDK | null = null
let safeInfo: SafeInfo | null = null

/**
 * Initialize Safe Apps SDK
 */
export function getSDK(): SafeAppsSDK {
  if (!sdk) {
    sdk = new SafeAppsSDK()
  }
  return sdk
}

/**
 * Detect if app is running in Safe context
 * @returns SafeInfo if in Safe context, null otherwise
 */
export async function detectSafeContext(): Promise<SafeInfo | null> {
  try {
    const safeSDK = getSDK()
    const info = await safeSDK.safe.getInfo()
    safeInfo = info
    return info
  } catch (error) {
    console.log('Not running in Safe context:', error)
    safeInfo = null
    return null
  }
}

/**
 * Check if currently in Safe context
 * @returns True if in Safe context
 */
export function isSafeContext(): boolean {
  return safeInfo !== null
}

/**
 * Get current Safe info
 * @returns SafeInfo if available, null otherwise
 */
export function getSafeInfo(): SafeInfo | null {
  return safeInfo
}

/**
 * Get Safe provider for ethers.js
 * @returns SafeAppProvider if in Safe context, null otherwise
 */
export async function getSafeProvider(): Promise<SafeAppProvider | null> {
  if (!safeInfo) {
    return null
  }

  try {
    const safeSDK = getSDK()
    return new SafeAppProvider(safeInfo, safeSDK)
  } catch (error) {
    console.error('Error creating Safe provider:', error)
    return null
  }
}

/**
 * Create ethers signer from Safe provider
 * @param provider SafeAppProvider instance
 * @returns ethers.Signer
 */
export function createSafeSigner(provider: SafeAppProvider): ethers.Signer {
  const ethersProvider = new ethers.BrowserProvider(provider)
  return ethersProvider.getSigner()
}

/**
 * Check if current user is a Safe owner
 * @param userAddress User's address to check
 * @returns True if user is a Safe owner
 */
export function isSafeOwner(userAddress: string): boolean {
  if (!safeInfo || !userAddress) return false
  
  return safeInfo.owners.some(owner => 
    owner.toLowerCase() === userAddress.toLowerCase()
  )
}

/**
 * Get Safe transaction URL for a given transaction hash
 * @param safeTxHash Safe transaction hash
 * @returns URL to view transaction in Safe UI
 */
export function getSafeTxUrl(safeTxHash: string): string {
  if (!safeInfo) return ''
  
  const chainId = safeInfo.chainId
  const safeAddress = safeInfo.safeAddress
  
  // Safe transaction URL format
  return `https://app.safe.global/transactions/history?safe=celo:${safeAddress}&id=${safeTxHash}`
}

/**
 * Get Safe app URL for current Safe
 * @returns URL to Safe app
 */
export function getSafeAppUrl(): string {
  if (!safeInfo) return ''
  
  const chainId = safeInfo.chainId
  const safeAddress = safeInfo.safeAddress
  
  return `https://app.safe.global/home?safe=celo:${safeAddress}`
}
