"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface CurrencyContextType {
  currency: string
  currencySymbol: string
  currencyName: string
  setCurrency: (currency: string) => void
  formatAmount: (amount: number) => string
}

const currencyConfig = {
  ghs: { symbol: "GHS", name: "Ghana Cedis" },
  usd: { symbol: "USD", name: "US Dollar" },
  eur: { symbol: "EUR", name: "Euro" },
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState("ghs")

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency)
    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("system-currency", newCurrency)
    }
  }

  useEffect(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("system-currency")
      if (saved && currencyConfig[saved as keyof typeof currencyConfig]) {
        setCurrencyState(saved)
      }
    }
  }, [])

  const config = currencyConfig[currency as keyof typeof currencyConfig] || currencyConfig.ghs

  const formatAmount = (amount: number) => {
    return `${config.symbol} ${amount.toLocaleString()}`
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol: config.symbol,
        currencyName: config.name,
        setCurrency,
        formatAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
