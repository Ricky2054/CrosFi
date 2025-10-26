/**
 * Global error handler for catching and handling unhandled errors
 */

import { isUserRejection } from './transaction-utils'

/**
 * Initialize global error handlers
 */
export function initializeGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    
    // Don't log user rejections to console
    if (isUserRejection(error)) {
      event.preventDefault() // Prevent the default console error
      return
    }
    
    // Log other errors normally
    console.error('Unhandled promise rejection:', error)
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = event.error
    
    // Don't log user rejections to console
    if (isUserRejection(error)) {
      event.preventDefault() // Prevent the default console error
      return
    }
    
    // Log other errors normally
    console.error('Global error:', error)
  })
}

/**
 * Suppress specific error types from console
 */
export function suppressConsoleErrors() {
  const originalConsoleError = console.error
  
  console.error = (...args: any[]) => {
    const message = args.join(' ')
    
    // Suppress user rejection errors
    if (
      message.includes('user rejected') ||
      message.includes('User denied') ||
      message.includes('ACTION_REJECTED') ||
      message.includes('ethers-user-denied')
    ) {
      return // Don't log these errors
    }
    
    // Log other errors normally
    originalConsoleError.apply(console, args)
  }
}
