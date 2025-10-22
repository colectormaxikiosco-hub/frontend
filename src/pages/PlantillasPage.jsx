"use client"

import { useState } from "react"
import { useData } from "../contexts/DataContext"
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Divider,
  InputAdornment,
  Paper,
  TablePagination,
} from "@mui/material"
import { Add, Edit, Delete, Search, Close } from "@mui/icons-material"

const PlantillasPage = () => {
  const { plantillas, products, addPlantilla, updatePlantilla, deletePlantilla } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)
  const [openProductDialog, setOpenProductDialog] = useState(false)
  const [editingPlantilla, setEditingPlantilla] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    productos: [],
  })
  const [productSearch, setProductSearch] = useState("")
  const [selectedProducts, setSelectedProducts] = useState([])
  const [tempCantidad, setTempCantidad] = useState({})

  const handleTempCantidadChange = (productId, value) => {
    setTempCantidad({ ...tempCantidad, [productId]: value })
  }

  const handleFocusSelect = (e) => {
    e.target.select()
  }

  const filteredPlantillas = plantillas.filter((p) => p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()))

  const paginatedPlantillas = filteredPlantillas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenDialog = (plantilla = null) => {
    if (plantilla) {
      setEditingPlantilla(plantilla)
      setFormData(plantilla)
      const mappedProducts = Array.isArray(plantilla.productos)
        ? plantilla.productos.map((p) => ({
            productoId: p.producto_id,
            nombre: p.nombre,
            codigo: p.codigo,
            cantidadDeseada: p.cantidad_deseada || 0,
            cantidadReal: p.cantidad_real || 0,
            cantidadSistema: p.stock_sistema || 0,
          }))
        : []
      setSelectedProducts(mappedProducts)
    } else {
      setEditingPlantilla(null)
      setFormData({ nombre: "", descripcion: "", productos: [] })
      setSelectedProducts([])
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingPlantilla(null)
    setFormData({ nombre: "", descripcion: "", productos: [] })
    setSelectedProducts([])
  }

  const handleSave = () => {
    const hasInvalidProducts = selectedProducts.some((p) => !p.cantidadDeseada || p.cantidadDeseada <= 0)

    if (hasInvalidProducts) {
      alert("Todos los productos deben tener una cantidad deseada mayor a 0")
      return
    }

    const plantillaData = {
      ...formData,
      productos: selectedProducts,
    }

    if (editingPlantilla) {
      updatePlantilla(editingPlantilla.id, plantillaData)
    } else {
      addPlantilla(plantillaData)
    }
    handleCloseDialog()
  }

  const handleDelete = (id) => {
    if (window.confirm("¿Está seguro de eliminar esta plantilla?")) {
      deletePlantilla(id)
    }
  }

  const handleOpenProductDialog = () => {
    setOpenProductDialog(true)
  }

  const handleCloseProductDialog = () => {
    setOpenProductDialog(false)
    setProductSearch("")
  }

  const handleAddProduct = (product) => {
    const exists = selectedProducts.find((p) => p.productoId === product.id)
    if (!exists) {
      const cantidad = tempCantidad[product.id] || 0
      setSelectedProducts([
        ...selectedProducts,
        {
          productoId: product.id,
          nombre: product.nombre,
          codigo: product.codigo,
          cantidadDeseada: cantidad,
          cantidadReal: 0,
          cantidadSistema: product.stockSistema,
        },
      ])
      setTempCantidad({ ...tempCantidad, [product.id]: undefined })
    }
  }

  const handleRemoveProduct = (productoId) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productoId !== productoId))
  }

  const handleUpdateCantidadDeseada = (productoId, cantidad) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.productoId === productoId ? { ...p, cantidadDeseada: Number.parseInt(cantidad) || 0 } : p,
      ),
    )
  }

  const getFilteredProducts = () => {
    // Si no hay búsqueda, no mostrar productos
    if (!productSearch || productSearch.trim().length < 2) {
      return []
    }

    const searchLower = productSearch.toLowerCase()
    const filtered = products.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(searchLower) ||
        p.codigo?.toLowerCase().includes(searchLower) ||
        p.categoria?.toLowerCase().includes(searchLower),
    )

    // <CHANGE> Removida la limitación de 10 resultados para mostrar todos los productos que coincidan
    return filtered
  }

  const filteredProducts = getFilteredProducts()

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, pb: 10 }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          Plantillas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}>
          Gestión de plantillas para conteo
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: "flex", gap: 1, flexDirection: "column" }}>
        <TextField
          fullWidth
          placeholder="Buscar plantillas..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(0)
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiInputBase-input": {
              fontSize: { xs: "0.938rem", sm: "1rem" },
              py: { xs: 1.5, sm: 2 },
            },
          }}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          fullWidth
          size="large"
          sx={{ minHeight: { xs: 48, sm: 42 }, fontSize: { xs: "0.938rem", sm: "0.875rem" } }}
        >
          Nueva Plantilla
        </Button>
      </Box>

      {filteredPlantillas.length === 0 ? (
        <Alert severity="info">No hay plantillas creadas</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedPlantillas.map((plantilla) => (
              <Grid item xs={12} key={plantilla.id}>
                <Card>
                  <CardContent sx={{ p: { xs: 2, sm: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
                        >
                          {plantilla.nombre}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                          sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
                        >
                          {plantilla.descripcion}
                        </Typography>
                        <Chip
                          label={`${plantilla.productos?.length || 0} productos`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 1, fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(plantilla)}
                          sx={{ p: { xs: 1, sm: 0.5 } }}
                        >
                          <Edit sx={{ fontSize: { xs: "1.25rem", sm: "1.125rem" } }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(plantilla.id)}
                          sx={{ p: { xs: 1, sm: 0.5 } }}
                        >
                          <Delete sx={{ fontSize: { xs: "1.25rem", sm: "1.125rem" } }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ mt: 2 }}>
            <TablePagination
              component="div"
              count={filteredPlantillas.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Plantillas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{
                ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                  fontSize: { xs: "0.813rem", sm: "0.875rem" },
                },
              }}
            />
          </Paper>
        </>
      )}

      {/* Dialog para crear/editar plantilla */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">{editingPlantilla ? "Editar Plantilla" : "Nueva Plantilla"}</Typography>
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ height: "70vh", overflow: "hidden", p: 0 }}>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
              <TextField
                label="Nombre de la Plantilla"
                fullWidth
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Gaseosas, Cervezas, etc."
              />
              <TextField
                label="Descripción"
                fullWidth
                multiline
                rows={2}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional de la plantilla"
              />

              <Divider />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Productos ({selectedProducts.length})
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenProductDialog()} size="small">
                  Agregar Productos
                </Button>
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: "auto", mt: 2, pr: 1, minHeight: 0 }}>
              {selectedProducts.length === 0 ? (
                <Alert severity="info">
                  No hay productos agregados. Haz click en "Agregar Productos" para comenzar.
                </Alert>
              ) : (
                selectedProducts.map((producto, index) => (
                  <Card key={producto.productoId} sx={{ mb: 1, bgcolor: "background.default" }}>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {producto.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Código: {producto.codigo} | Stock: {producto.cantidadSistema}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <TextField
                            label="Cantidad"
                            type="number"
                            size="small"
                            value={producto.cantidadDeseada || 0}
                            onChange={(e) => handleUpdateCantidadDeseada(producto.productoId, e.target.value)}
                            onFocus={handleFocusSelect}
                            sx={{ width: 90 }}
                            inputProps={{ min: 0 }}
                            error={!producto.cantidadDeseada || producto.cantidadDeseada <= 0}
                            helperText={!producto.cantidadDeseada || producto.cantidadDeseada <= 0 ? "Requerido" : ""}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveProduct(producto.productoId)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseDialog} fullWidth variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            fullWidth
            disabled={
              !formData.nombre ||
              selectedProducts.length === 0 ||
              selectedProducts.some((p) => !p.cantidadDeseada || p.cantidadDeseada <= 0)
            }
          >
            {editingPlantilla ? "Actualizar" : "Crear"} Plantilla
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para seleccionar productos */}
      <Dialog open={openProductDialog} onClose={handleCloseProductDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Agregar Productos</Typography>
            <IconButton onClick={handleCloseProductDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ height: "70vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Busca productos por nombre, código o categoría. Ingresa la cantidad deseada antes de agregar.
            </Alert>

            <TextField
              fullWidth
              placeholder="Buscar productos..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, overflow: "auto", pr: 1 }}>
            {!productSearch || productSearch.trim().length < 2 ? (
              <Alert severity="info">Escribe al menos 2 caracteres para buscar...</Alert>
            ) : filteredProducts.length === 0 ? (
              <Alert severity="warning">No se encontraron productos con "{productSearch}"</Alert>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {filteredProducts.length} resultado(s) encontrado(s)
                </Typography>
                {filteredProducts.map((product) => {
                  const isSelected = selectedProducts.find((p) => p.productoId === product.id)
                  return (
                    <Card key={product.id} sx={{ mb: 1, bgcolor: isSelected ? "action.selected" : "background.paper" }}>
                      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight="bold" noWrap>
                              {product.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Código: {product.codigo} | Categoría: {product.categoria} | Stock: {product.stockSistema}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            {!isSelected && (
                              <TextField
                                label="Cantidad"
                                type="number"
                                size="small"
                                value={tempCantidad[product.id] || ""}
                                onChange={(e) => handleTempCantidadChange(product.id, e.target.value)}
                                onFocus={handleFocusSelect}
                                sx={{ width: 90 }}
                                inputProps={{ min: 0 }}
                                placeholder="0"
                              />
                            )}
                            <Button
                              variant={isSelected ? "outlined" : "contained"}
                              size="small"
                              onClick={() => handleAddProduct(product)}
                              disabled={isSelected}
                              sx={{ minWidth: 90 }}
                            >
                              {isSelected ? "Agregado" : "Agregar"}
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseProductDialog} variant="contained" fullWidth>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default PlantillasPage