/**
 * Safe transaction utilities
 * Handles preparing and sending transactions through Gnosis Safe
 */

import { ethers } from 'ethers'
import { getSDK, getSafeInfo } from './safe'
import { addresses } from './contracts/addresses.json'

export interface SafeTransaction {
  to: string
  data: string
  value: string
}

export interface SafeTxResponse {
  safeTxHash: string
  txHash?: string
  status: 'pending' | 'success' | 'failed'
}

/**
 * Prepare transaction data for a contract function call
 * @param contractAddress Contract address
 * @param abi Contract ABI
 * @param functionName Function name to call
 * @param params Function parameters
 * @returns Encoded transaction data
 */
export function prepareTransactionData(
  contractAddress: string,
  abi: any[],
  functionName: string,
  params: any[]
): string {
  const contract = new ethers.Contract(contractAddress, abi)
  return contract.interface.encodeFunctionData(functionName, params)
}

/**
 * Send transaction through Safe
 * @param transactions Array of transactions to send
 * @returns Safe transaction hash
 */
export async function sendSafeTransaction(
  transactions: SafeTransaction[]
): Promise<string> {
  const safeInfo = getSafeInfo()
  if (!safeInfo) {
    throw new Error('Not in Safe context')
  }

  const sdk = getSDK()
  
  try {
    const response = await sdk.txs.send({ txs: transactions })
    return response.safeTxHash
  } catch (error) {
    console.error('Error sending Safe transaction:', error)
    throw error
  }
}

/**
 * Get Safe transaction status
 * @param safeTxHash Safe transaction hash
 * @returns Transaction status
 */
export async function getSafeTxStatus(safeTxHash: string): Promise<SafeTxResponse> {
  const safeInfo = getSafeInfo()
  if (!safeInfo) {
    throw new Error('Not in Safe context')
  }

  const sdk = getSDK()
  
  try {
    const tx = await sdk.txs.getBySafeTxHash(safeTxHash)
    return {
      safeTxHash,
      txHash: tx.txHash,
      status: tx.txStatus === 'SUCCESS' ? 'success' : 
              tx.txStatus === 'FAILED' ? 'failed' : 'pending'
    }
  } catch (error) {
    console.error('Error getting Safe transaction status:', error)
    return {
      safeTxHash,
      status: 'pending'
    }
  }
}

// Admin operation helpers

/**
 * Prepare updateRates transaction
 * @param token Token address to update rates for
 * @returns Safe transaction data
 */
export function prepareUpdateRatesTx(token: string): SafeTransaction {
  const lendingPoolABI = [
    "function updateRates(address token) external"
  ]
  
  const data = prepareTransactionData(
    addresses.contracts.lendingPool,
    lendingPoolABI,
    'updateRates',
    [token]
  )
  
  return {
    to: addresses.contracts.lendingPool,
    data,
    value: '0'
  }
}

/**
 * Prepare accrueInterest transaction
 * @param user User address
 * @param token Token address
 * @returns Safe transaction data
 */
export function prepareAccrueInterestTx(user: string, token: string): SafeTransaction {
  const lendingPoolABI = [
    "function accrueInterest(address user, address token) external"
  ]
  
  const data = prepareTransactionData(
    addresses.contracts.lendingPool,
    lendingPoolABI,
    'accrueInterest',
    [user, token]
  )
  
  return {
    to: addresses.contracts.lendingPool,
    data,
    value: '0'
  }
}

/**
 * Prepare checkAndLiquidate transaction
 * @returns Safe transaction data
 */
export function prepareCheckAndLiquidateTx(): SafeTransaction {
  const lendingPoolABI = [
    "function checkAndLiquidate() external"
  ]
  
  const data = prepareTransactionData(
    addresses.contracts.lendingPool,
    lendingPoolABI,
    'checkAndLiquidate',
    []
  )
  
  return {
    to: addresses.contracts.lendingPool,
    data,
    value: '0'
  }
}

/**
 * Prepare governance vote transaction
 * @param proposalId Proposal ID
 * @param voteType Vote type (0=For, 1=Against, 2=Abstain)
 * @returns Safe transaction data
 */
export function prepareVoteTx(proposalId: number, voteType: number): SafeTransaction {
  const governanceABI = [
    "function castVote(uint256 proposalId, uint8 voteType) external"
  ]
  
  const data = prepareTransactionData(
    addresses.contracts.governance,
    governanceABI,
    'castVote',
    [proposalId, voteType]
  )
  
  return {
    to: addresses.contracts.governance,
    data,
    value: '0'
  }
}

/**
 * Prepare create proposal transaction
 * @param title Proposal title
 * @param description Proposal description
 * @returns Safe transaction data
 */
export function prepareCreateProposalTx(title: string, description: string): SafeTransaction {
  const governanceABI = [
    "function createProposal(string memory title, string memory description) external"
  ]
  
  const data = prepareTransactionData(
    addresses.contracts.governance,
    governanceABI,
    'createProposal',
    [title, description]
  )
  
  return {
    to: addresses.contracts.governance,
    data,
    value: '0'
  }
}
