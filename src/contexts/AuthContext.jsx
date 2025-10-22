"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authService } from "../services/authService"

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedUser = authService.getCurrentUser()
    if (savedUser) {
      setUser(savedUser)
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const result = await authService.login(username, password)
      if (result.success) {
        setUser(result.user)
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (error) {
      return { success: false, error: "Error al iniciar sesión" }
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const isAdmin = () => {
    return user?.rol === "admin"
  }

  const isAuthenticated = !!user

  const value = {
    user,
    login,
    logout,
    isAdmin,
    isAuthenticated,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
