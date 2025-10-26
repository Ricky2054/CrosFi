'use client'

import { useEffect } from 'react'
import { initializeGlobalErrorHandlers, suppressConsoleErrors } from '@/lib/global-error-handler'

export function GlobalErrorHandler() {
  useEffect(() => {
    // Initialize global error handlers
    initializeGlobalErrorHandlers()
    
    // Suppress console errors for user rejections
    suppressConsoleErrors()
  }, [])

  return null // This component doesn't render anything
}
