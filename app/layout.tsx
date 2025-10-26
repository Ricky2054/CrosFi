import type React from "react"
import type { Metadata } from "next"
import { Inter, Orbitron, Rajdhani } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/contexts/WalletContext"
import { NotificationProvider } from "@/components/NotificationProvider"
import { BottomNav } from "@/components/mobile/BottomNav"
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const orbitron = Orbitron({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron" 
})
const rajdhani = Rajdhani({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani" 
})

export const metadata: Metadata = {
  title: "Cross-Currency Lending Protocol - Celo",
  description: "Borrow in any currency, collateralize with another. Access cUSD, cEUR, cREAL, and eXOF liquidity using multi-currency collateral on Celo.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable} font-orbitron antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <NotificationProvider>
              <GlobalErrorHandler />
              {children}
              <BottomNav />
            </NotificationProvider>
          </WalletProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
