// Servicio de usuarios - Conectado con backend real
import api from "../config/api"

const STORAGE_KEY = "users"

// Usuarios de prueba
const mockUsers = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    name: "Administrador",
    role: "admin",
    email: "admin@almacen.com",
    active: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: 2,
    username: "empleado1",
    password: "emp123",
    name: "Juan Pérez",
    role: "empleado",
    email: "juan@almacen.com",
    active: true,
    createdAt: new Date("2024-01-05").toISOString(),
  },
  {
    id: 3,
    username: "empleado2",
    password: "emp123",
    name: "María González",
    role: "empleado",
    email: "maria@almacen.com",
    active: true,
    createdAt: new Date("2024-01-10").toISOString(),
  },
]

// Inicializar datos
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUsers))
  }
}

initializeData()

export const userService = {
  // Obtener todos - GET /api/users
  getAll: async () => {
    try {
      const response = await api.get("/users")
      return response.data.data
    } catch (error) {
      console.error("[v0] Error obteniendo usuarios:", error)
      throw error
    }
  },

  // Obtener por ID - GET /api/users/:id
  getById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`)
      return response.data.data
    } catch (error) {
      console.error("[v0] Error obteniendo usuario:", error)
      throw error
    }
  },

  // Crear - POST /api/users
  create: async (user) => {
    try {
      const response = await api.post("/users", user)
      return response.data.data
    } catch (error) {
      console.error("[v0] Error creando usuario:", error)
      throw error
    }
  },

  // Actualizar - PUT /api/users/:id
  update: async (id, data) => {
    try {
      const response = await api.put(`/users/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error("[v0] Error actualizando usuario:", error)
      throw error
    }
  },

  // Eliminar - DELETE /api/users/:id
  delete: async (id) => {
    try {
      await api.delete(`/users/${id}`)
    } catch (error) {
      console.error("[v0] Error eliminando usuario:", error)
      throw error
    }
  },
}
