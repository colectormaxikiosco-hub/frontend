import api from "../config/api"

const mapProductFromAPI = (product) => {
  if (!product) return null
  return {
    id: product.id,
    codigo: product.codigo,
    nombre: product.nombre,
    categoria: product.categoria,
    stockSistema: product.stock_sistema,
    precio: product.precio,
    fechaCreacion: product.fecha_creacion,
    fechaActualizacion: product.fecha_actualizacion,
  }
}

const mapProductToAPI = (product) => {
  return {
    codigo: product.codigo,
    nombre: product.nombre,
    categoria: product.categoria,
    stock_sistema: product.stockSistema,
    precio: product.precio,
  }
}

export const productService = {
  // Obtener todos - GET /api/products
  getAll: async () => {
    try {
      const response = await api.get("/products")
      return response.data.data.map(mapProductFromAPI)
    } catch (error) {
      console.error("[v0] Error obteniendo productos:", error)
      throw error
    }
  },

  // Obtener por ID - GET /api/products/:id
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`)
      return mapProductFromAPI(response.data.data)
    } catch (error) {
      console.error("[v0] Error obteniendo producto:", error)
      throw error
    }
  },

  // Obtener por código - GET /api/products/codigo/:codigo
  getByCodigo: async (codigo) => {
    try {
      const response = await api.get(`/products/codigo/${codigo}`)
      return mapProductFromAPI(response.data.data)
    } catch (error) {
      console.error("[v0] Error obteniendo producto por código:", error)
      throw error
    }
  },

  // Crear - POST /api/products
  create: async (product) => {
    try {
      const response = await api.post("/products", mapProductToAPI(product))
      return mapProductFromAPI(response.data.data)
    } catch (error) {
      console.error("[v0] Error creando producto:", error)
      throw error
    }
  },

  // Actualizar - PUT /api/products/:id
  update: async (id, data) => {
    try {
      const response = await api.put(`/products/${id}`, mapProductToAPI(data))
      return response.data.data
    } catch (error) {
      console.error("[v0] Error actualizando producto:", error)
      throw error
    }
  },

  // Eliminar - DELETE /api/products/:id
  delete: async (id) => {
    try {
      await api.delete(`/products/${id}`)
    } catch (error) {
      console.error("[v0] Error eliminando producto:", error)
      throw error
    }
  },

  // Importar desde Excel - POST /api/products/import
  importFromExcel: async (file) => {
    try {
      console.log("[v0] productService.importFromExcel - Archivo:", file.name, file.type)

      const formData = new FormData()
      formData.append("file", file)

      console.log("[v0] FormData creado, enviando a /products/import")

      const response = await api.post("/products/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("[v0] Respuesta del servidor:", response.data)
      return response.data
    } catch (error) {
      console.error("[v0] Error importando productos:", error)
      console.error("[v0] Error response:", error.response?.data)
      throw error
    }
  },

  // Actualizar stock desde Excel - POST /api/products/update-stock
  updateStockFromExcel: async (file) => {
    try {
      console.log("[v0] productService.updateStockFromExcel - Archivo:", file.name, file.type)

      const formData = new FormData()
      formData.append("file", file)

      console.log("[v0] FormData creado, enviando a /products/update-stock")

      const response = await api.post("/products/update-stock", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("[v0] Respuesta del servidor:", response.data)
      return response.data
    } catch (error) {
      console.error("[v0] Error actualizando stock:", error)
      console.error("[v0] Error response:", error.response?.data)
      throw error
    }
  },

  // Eliminar todos los productos - DELETE /api/products
  deleteAll: async () => {
    try {
      const response = await api.delete("/products")
      return response.data
    } catch (error) {
      console.error("[v0] Error eliminando todos los productos:", error)
      throw error
    }
  },
}
