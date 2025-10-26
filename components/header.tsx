"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useWallet } from "@/contexts/WalletContext"
import { NetworkStatus } from "@/components/NetworkStatus"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { address, isConnected, isLoading, connect, disconnect } = useWallet()

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleWalletClick = () => {
    if (isConnected) {
      disconnect()
    } else {
      connect()
    }
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Vault", href: "/vault" },
    { label: "Markets", href: "/markets" },
    { label: "Lend", href: "/lend" },
    { label: "Positions", href: "/positions" },
    { label: "Rates", href: "/rates" },
    { label: "Analytics", href: "/analytics" },
    { label: "Governance", href: "/governance" },
    { label: "API Docs", href: "/api-docs" },
  ]

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">
            CR
          </div>
          lCelo
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 h-10">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-foreground hover:text-primary transition-colors text-sm font-medium flex items-center h-full"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:flex gap-3 items-center h-10">
          <div className="flex items-center h-full">
            <NetworkStatus />
          </div>
          <div className="flex items-center h-full">
            <ThemeToggle />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleWalletClick}
            disabled={isLoading}
            className="h-8"
          >
            {isLoading 
              ? "Connecting..." 
              : isConnected && address 
                ? truncateAddress(address)
                : "Connect Wallet"
            }
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-border">
              <div className="flex justify-center">
                <NetworkStatus />
              </div>
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleWalletClick}
                disabled={isLoading}
              >
                {isLoading 
                  ? "Connecting..." 
                  : isConnected && address 
                    ? truncateAddress(address)
                    : "Connect Wallet"
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
