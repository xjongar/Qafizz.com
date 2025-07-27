"use client"

import { useState, useEffect } from "react"
import { AuthService, type User } from "@/lib/auth"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      const authenticated = AuthService.isAuthenticated()
      const userData = AuthService.getUser()

      setIsAuthenticated(authenticated)
      setUser(userData)
      setIsLoading(false)
    }

    checkAuth()

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "qafizz_auth" || e.key === "qafizz_user") {
        checkAuth()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const login = (userData: User) => {
    AuthService.login(userData)
    AuthService.initializeDefaultNotes(userData.id)
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = () => {
    AuthService.logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      AuthService.updateUser(updates)
      setUser(updatedUser)
    }
  }

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    updateUser,
  }
}
