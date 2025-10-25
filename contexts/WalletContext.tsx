"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ethers } from 'ethers'
import detectEthereumProvider from '@metamask/detect-provider'
import { detectSafeContext, getSafeProvider, createSafeSigner } from '@/lib/safe'
import { SafeInfo } from '@safe-global/safe-apps-sdk'

interface WalletContextType {
  address: string | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  switchToCeloNetwork: () => Promise<void>
  isSafe: boolean
  safeInfo: SafeInfo | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

// Celo Alfajores Testnet configuration
const ALFAJORES_TESTNET = {
  chainId: '0xAEF3', // 44787 in hex
  chainName: 'Celo Alfajores Testnet',
  nativeCurrency: {
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
  blockExplorerUrls: ['https://alfajores.celoscan.io'],
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [isSafe, setIsSafe] = useState(false)
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null)

  // Check if already connected on mount
  useEffect(() => {
    checkConnection()
    checkSafeContext()
  }, [])

  // Check Safe context
  const checkSafeContext = async () => {
    try {
      const safe = await detectSafeContext()
      if (safe) {
        setIsSafe(true)
        setSafeInfo(safe)
        console.log('Connected via Safe:', safe)
      } else {
        setIsSafe(false)
        setSafeInfo(null)
      }
    } catch (error) {
      console.log('Safe context check failed:', error)
      setIsSafe(false)
      setSafeInfo(null)
    }
  }

  // Poll for account changes when connected
  useEffect(() => {
    if (!isConnected) return

    const pollInterval = setInterval(async () => {
      try {
        const ethereumProvider = await detectEthereumProvider()
        if (ethereumProvider && 'request' in ethereumProvider) {
          const accounts = await (ethereumProvider as any).request({ method: 'eth_accounts' })
          if (accounts.length === 0) {
            // User disconnected
            setAddress(null)
            setIsConnected(false)
            setProvider(null)
            setSigner(null)
          } else if (accounts[0] !== address) {
            // User switched accounts
            setAddress(accounts[0])
            if (provider) {
              setSigner(await provider.getSigner())
            }
          }
        }
      } catch (err) {
        console.error('Error polling accounts:', err)
      }
    }, 1000) // Check every second

    return () => clearInterval(pollInterval)
  }, [isConnected, address, provider])

  const checkConnection = async () => {
    try {
      const ethereumProvider = await detectEthereumProvider()
      if (ethereumProvider && 'request' in ethereumProvider) {
        const accounts = await (ethereumProvider as any).request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          const browserProvider = new ethers.BrowserProvider(ethereumProvider as any)
          setProvider(browserProvider)
          setSigner(await browserProvider.getSigner())
        }
      }
    } catch (err) {
      console.error('Error checking connection:', err)
    }
  }

  const switchToCeloNetwork = async () => {
    try {
      const ethereumProvider = await detectEthereumProvider()
      if (ethereumProvider && 'request' in ethereumProvider) {
        // First try to switch to the network if it already exists
        try {
          await (ethereumProvider as any).request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ALFAJORES_TESTNET.chainId }],
          })
        } catch (switchError: any) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await (ethereumProvider as any).request({
              method: 'wallet_addEthereumChain',
              params: [ALFAJORES_TESTNET],
            })
          } else {
            throw switchError
          }
        }
      }
    } catch (err: any) {
      console.error('Error switching to Celo network:', err)
      throw new Error('Failed to switch to Celo Alfajores Testnet. Please add the network manually.')
    }
  }

  const connect = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const ethereumProvider = await detectEthereumProvider()
      
      if (!ethereumProvider) {
        throw new Error('MetaMask not detected. Please install MetaMask.')
      }

      // Request account access
      const accounts = await (ethereumProvider as any).request({ 
        method: 'eth_requestAccounts' 
      })

      if (accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)
        const browserProvider = new ethers.BrowserProvider(ethereumProvider as any)
        setProvider(browserProvider)
        setSigner(await browserProvider.getSigner())
        
        // Check if we're on the correct network
        const network = await browserProvider.getNetwork()
        if (network.chainId !== BigInt(44787)) {
          await switchToCeloNetwork()
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
      console.error('Wallet connection error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    setProvider(null)
    setSigner(null)
    setError(null)
    setIsSafe(false)
    setSafeInfo(null)
  }

  const value: WalletContextType = {
    address,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    provider,
    signer,
    switchToCeloNetwork,
    isSafe,
    safeInfo
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
