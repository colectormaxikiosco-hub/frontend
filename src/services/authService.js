import api from "../config/api"

const STORAGE_KEY = "auth_user"
const TOKEN_KEY = "auth_token"

export const authService = {
  // Login - POST /api/auth/login
  login: async (username, password) => {
    try {
      const response = await api.post("/auth/login", {
        usuario: username,
        password: password,
      })

      if (response.data.success) {
        const { token, user } = response.data.data

        // Guardar token y usuario
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))

        return { success: true, user }
      }

      return { success: false, error: "Error en el login" }
    } catch (error) {
      console.error("[v0] Error en login:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Usuario o contraseña incorrectos",
      }
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(STORAGE_KEY)
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem(STORAGE_KEY)
    return user ? JSON.parse(user) : null
  },

  // Verificar si está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY)
  },

  // Obtener perfil - GET /api/auth/profile
  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile")
      return response.data.data
    } catch (error) {
      console.error("[v0] Error obteniendo perfil:", error)
      throw error
    }
  },

  // Cambiar contraseña - POST /api/auth/change-password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      })
      return response.data
    } catch (error) {
      console.error("[v0] Error cambiando contraseña:", error)
      throw error
    }
  },
}
