/**
 * Transaction utility functions for handling common transaction scenarios
 */

export interface TransactionError extends Error {
  code?: number | string
  reason?: string
  data?: any
}

/**
 * Check if an error is a user rejection
 */
export function isUserRejection(error: any): boolean {
  return (
    error.code === 4001 ||
    error.code === 'ACTION_REJECTED' ||
    error.message?.includes('user rejected') ||
    error.message?.includes('User denied') ||
    error.message?.includes('ethers-user-denied')
  )
}

/**
 * Check if an error is a network-related issue
 */
export function isNetworkError(error: any): boolean {
  return (
    error.message?.includes('network') ||
    error.message?.includes('Network') ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'UNPREDICTABLE_GAS_LIMIT'
  )
}

/**
 * Check if an error is related to insufficient funds
 */
export function isInsufficientFundsError(error: any): boolean {
  return (
    error.message?.includes('insufficient') ||
    error.message?.includes('Insufficient') ||
    error.reason?.includes('insufficient') ||
    error.code === 'INSUFFICIENT_FUNDS'
  )
}

/**
 * Check if an error is related to gas estimation
 */
export function isGasEstimationError(error: any): boolean {
  return (
    error.message?.includes('gas') ||
    error.message?.includes('Gas') ||
    error.code === 'UNPREDICTABLE_GAS_LIMIT' ||
    error.code === 'GAS_ESTIMATION_FAILED'
  )
}

/**
 * Get a user-friendly error message for transaction errors
 */
export function getTransactionErrorMessage(error: any): string {
  if (isUserRejection(error)) {
    return 'Transaction rejected by user. Please try again if you want to proceed.'
  }
  
  if (isNetworkError(error)) {
    return 'Network error: Please ensure you are connected to Celo Alfajores Testnet'
  }
  
  if (isInsufficientFundsError(error)) {
    return 'Insufficient funds: Please check your balance and try again'
  }
  
  if (isGasEstimationError(error)) {
    return 'Gas estimation failed: Please try again or increase gas limit'
  }
  
  if (error.message?.includes('Amount below minimum')) {
    return 'Amount below minimum: Please increase your deposit amount'
  }
  
  if (error.message?.includes('Amount above maximum')) {
    return 'Maximum deposit exceeded: Please reduce your deposit amount'
  }
  
  if (error.message?.includes('contract') || error.message?.includes('0x0000')) {
    return 'Contract not deployed: Please deploy vault contracts first'
  }
  
  // Return the original error message or a generic one
  return error.reason || error.message || 'Transaction failed: Please try again'
}

/**
 * Handle transaction errors with proper logging and user feedback
 */
export function handleTransactionError(error: any, context: string = 'Transaction'): string {
  const message = getTransactionErrorMessage(error)
  
  // Only log errors that are not user rejections to avoid console spam
  if (!isUserRejection(error)) {
    console.error(`${context} failed:`, error)
    
    // Log additional context for debugging
    if (error.code) {
      console.error(`Error code: ${error.code}`)
    }
    
    if (error.data) {
      console.error('Error data:', error.data)
    }
  }
  
  return message
}

/**
 * Execute a transaction with proper error handling
 */
export async function executeTransaction<T>(
  transactionFn: () => Promise<T>,
  context: string = 'Transaction'
): Promise<T> {
  try {
    return await transactionFn()
  } catch (error: any) {
    // Re-throw the error with proper handling
    const message = handleTransactionError(error, context)
    const enhancedError = new Error(message)
    enhancedError.cause = error
    throw enhancedError
  }
}

/**
 * Execute a transaction and wait for confirmation with proper error handling
 */
export async function executeTransactionAndWait<T extends { wait: () => Promise<any> }>(
  transactionFn: () => Promise<T>,
  context: string = 'Transaction'
): Promise<{ tx: T; receipt: any }> {
  try {
    const tx = await transactionFn()
    const receipt = await tx.wait()
    return { tx, receipt }
  } catch (error: any) {
    // Re-throw the error with proper handling
    const message = handleTransactionError(error, context)
    const enhancedError = new Error(message)
    enhancedError.cause = error
    throw enhancedError
  }
}
