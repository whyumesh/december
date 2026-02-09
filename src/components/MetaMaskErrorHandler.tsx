'use client'

import { useEffect } from 'react'

/**
 * Component to suppress MetaMask and other browser extension errors
 * that are injected into the page but not related to our application
 */
export default function MetaMaskErrorHandler() {
  useEffect(() => {
    // Suppress MetaMask connection errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || ''
      const errorSource = event.filename || ''
      
      // Check if error is from MetaMask extension
      const isMetaMaskError = 
        errorSource.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        errorSource.includes('moz-extension://') ||
        errorSource.includes('safari-extension://') ||
        errorMessage.includes('Failed to connect to MetaMask') ||
        errorMessage.includes('MetaMask') ||
        errorMessage.includes('ethereum') ||
        errorSource.includes('inpage.js')
      
      // Suppress MetaMask errors silently
      if (isMetaMaskError) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    // Suppress unhandled promise rejections from MetaMask
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const errorMessage = typeof reason === 'string' 
        ? reason 
        : reason?.message || ''
      
      const isMetaMaskRejection = 
        errorMessage.includes('Failed to connect to MetaMask') ||
        errorMessage.includes('MetaMask') ||
        errorMessage.includes('ethereum') ||
        (reason && typeof reason === 'object' && 'stack' in reason && 
         typeof reason.stack === 'string' && 
         reason.stack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn'))
      
      if (isMetaMaskRejection) {
        event.preventDefault()
        return false
      }
    }

    // Add event listeners
    window.addEventListener('error', handleError, true)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
