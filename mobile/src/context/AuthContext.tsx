"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface User {
  id: string
  name: string
  email: string
  employeeId: string
  department: string
  position: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      const userData = await AsyncStorage.getItem("userData")

      if (token && userData) {
        setUser(JSON.parse(userData))
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Demo credentials check
      if (email === "employee@demo.akwaabahr.com" && password === "Employee123!") {
        const demoUser: User = {
          id: "1",
          name: "Kwame Asante",
          email: "employee@demo.akwaabahr.com",
          employeeId: "EMP001",
          department: "Finance",
          position: "Accountant",
        }

        await AsyncStorage.setItem("authToken", "demo-token")
        await AsyncStorage.setItem("userData", JSON.stringify(demoUser))

        setUser(demoUser)
        setIsAuthenticated(true)
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken")
      await AsyncStorage.removeItem("userData")
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
