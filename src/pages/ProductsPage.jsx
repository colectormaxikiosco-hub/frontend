"use client"

import { useState, useRef } from "react"
import { useData } from "../contexts/DataContext"
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  TablePagination,
} from "@mui/material"
import {
  Search,
  Upload,
  Edit,
  Delete,
  Add,
  CloudUpload,
  Refresh,
  ExpandMore,
  DeleteSweep,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material"
import { productService } from "../services/productService"

const ProductsPage = () => {
  const { products, addProduct, updateProduct, deleteProduct, refreshData } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    stockSistema: 0,
  })
  const [uploadDialog, setUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("loading")
  const [uploadMessage, setUploadMessage] = useState("")
  const [uploadDetails, setUploadDetails] = useState({ processed: 0, total: 0 })
  const [anchorEl, setAnchorEl] = useState(null)
  const [deleteAllDialog, setDeleteAllDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const fullUploadRef = useRef(null)
  const stockUploadRef = useRef(null)

  const filteredProducts = products.filter(
    (p) =>
      (p.nombre && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.codigo && p.codigo.includes(searchTerm)) ||
      (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const paginatedProducts = filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setPage(0)
  }

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData(product)
    } else {
      setEditingProduct(null)
      setFormData({ codigo: "", nombre: "", categoria: "", stockSistema: 0 })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingProduct(null)
    setFormData({ codigo: "", nombre: "", categoria: "", stockSistema: 0 })
  }

  const handleSave = () => {
    if (editingProduct) {
      updateProduct(editingProduct.id, formData)
    } else {
      addProduct(formData)
    }
    handleCloseDialog()
  }

  const handleDelete = (id) => {
    if (window.confirm("¿Está seguro de eliminar este producto?")) {
      deleteProduct(id)
    }
  }

  const handleFileUpload = async (event, mode = "full") => {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ]
    const isCSV = file.name.endsWith(".csv")

    if (!validTypes.includes(file.type) && !isCSV) {
      alert("Por favor seleccione un archivo Excel (.xlsx, .xls) o CSV (.csv)")
      event.target.value = ""
      return
    }

    setUploadDialog(true)
    setUploading(true)
    setUploadProgress(0)
    setUploadStatus("loading")
    setUploadMessage(mode === "full" ? "Procesando archivo..." : "Actualizando stock...")
    setUploadDetails({ processed: 0, total: 0 })

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 300)

      let result
      if (mode === "full") {
        result = await productService.importFromExcel(file)
        setUploadDetails({ processed: result.data.total, total: result.data.total })
        setUploadMessage(`${result.data.total} productos procesados correctamente`)
      } else {
        result = await productService.updateStockFromExcel(file)
        setUploadDetails({ processed: result.data.total, total: result.data.total })
        setUploadMessage(`Stock actualizado en ${result.data.total} productos`)
      }

      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus("success")

      await refreshData()
    } catch (error) {
      setUploadStatus("error")
      setUploadMessage(error.response?.data?.message || error.message || "Error al procesar el archivo")
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }

    event.target.value = ""
  }

  const handleCloseUploadDialog = () => {
    setUploadDialog(false)
    setUploadProgress(0)
    setUploadStatus("loading")
    setUploadMessage("")
    setUploadDetails({ processed: 0, total: 0 })
  }

  const handleFullUploadClick = () => {
    handleMenuClose()
    setTimeout(() => {
      fullUploadRef.current?.click()
    }, 100)
  }

  const handleStockUploadClick = () => {
    handleMenuClose()
    setTimeout(() => {
      stockUploadRef.current?.click()
    }, 100)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      await productService.deleteAll()
      await refreshData()
      setDeleteAllDialog(false)
      alert("Todos los productos han sido eliminados")
    } catch (error) {
      alert(error.response?.data?.message || "Error al eliminar productos")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Productos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión de productos del almacén ({products.length} productos totales)
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: "flex", gap: 1, flexDirection: "column" }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre, código o categoría..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} fullWidth>
            Agregar
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            endIcon={<ExpandMore />}
            onClick={handleMenuOpen}
            fullWidth
            disabled={uploading}
          >
            Importar
          </Button>
        </Box>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleFullUploadClick}>
            <ListItemIcon>
              <CloudUpload fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Carga Completa" secondary="Crear/actualizar todos los productos" />
          </MenuItem>
          <MenuItem onClick={handleStockUploadClick}>
            <ListItemIcon>
              <Refresh fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Actualizar Stock" secondary="Solo actualizar stock de productos existentes" />
          </MenuItem>
        </Menu>
      </Box>

      <input
        ref={fullUploadRef}
        type="file"
        hidden
        accept=".xlsx,.xls,.csv"
        onChange={(e) => handleFileUpload(e, "full")}
      />
      <input
        ref={stockUploadRef}
        type="file"
        hidden
        accept=".xlsx,.xls,.csv"
        onChange={(e) => handleFileUpload(e, "stock")}
      />

      {/* ... existing dialogs ... */}
      <Dialog open={uploadDialog} onClose={uploading ? undefined : handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {uploadStatus === "loading" && <CircularProgress size={24} />}
            {uploadStatus === "success" && <CheckCircle color="success" />}
            {uploadStatus === "error" && <ErrorIcon color="error" />}
            <Typography variant="h6">
              {uploadStatus === "loading" && "Cargando productos..."}
              {uploadStatus === "success" && "Carga completada"}
              {uploadStatus === "error" && "Error en la carga"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              {uploadMessage}
            </Typography>

            {uploadDetails.total > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Productos procesados: {uploadDetails.processed} de {uploadDetails.total}
              </Typography>
            )}

            {uploading && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  {uploadProgress}% completado
                </Typography>
              </Box>
            )}

            {uploadStatus === "success" && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Los productos se han cargado correctamente en el sistema
              </Alert>
            )}

            {uploadStatus === "error" && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Hubo un problema al procesar el archivo. Por favor, verifique el formato e intente nuevamente.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {!uploading && (
            <Button onClick={handleCloseUploadDialog} variant="contained">
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={deleteAllDialog} onClose={() => !deleting && setDeleteAllDialog(false)}>
        <DialogTitle>Eliminar todos los productos</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción eliminará permanentemente todos los {products.length} productos del sistema.
          </Alert>
          <Typography>¿Está seguro de que desea continuar? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialog(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteAll} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={24} /> : "Eliminar Todo"}
          </Button>
        </DialogActions>
      </Dialog>

      {filteredProducts.length === 0 ? (
        <Alert severity="info">No se encontraron productos</Alert>
      ) : (
        <Paper>
          <TableContainer
            sx={{
              maxHeight: "calc(100vh - 400px)",
              "& .MuiTableCell-root": {
                py: 1.5,
                px: { xs: 1, sm: 2 },
              },
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", bgcolor: "primary.main", color: "white" }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: "bold", bgcolor: "primary.main", color: "white" }}>Nombre</TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "primary.main",
                      color: "white",
                      display: { xs: "none", sm: "table-cell" },
                    }}
                  >
                    Categoría
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", bgcolor: "primary.main", color: "white" }} align="center">
                    Stock
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", bgcolor: "primary.main", color: "white" }} align="center">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    sx={{
                      "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                      "&:hover": { bgcolor: "action.selected" },
                    }}
                  >
                    <TableCell sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>{product.codigo}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          {product.nombre}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: { xs: "block", sm: "none" } }}
                        >
                          {product.categoria}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                      <Chip
                        label={product.categoria}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={product.stock_sistema || product.stockSistema || 0}
                        size="small"
                        color={
                          (product.stock_sistema || product.stockSistema || 0) > 10
                            ? "success"
                            : (product.stock_sistema || product.stockSistema || 0) > 0
                              ? "warning"
                              : "error"
                        }
                        sx={{ fontWeight: "bold", minWidth: 50 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(product)}
                          sx={{ p: { xs: 0.5, sm: 1 } }}
                        >
                          <Edit sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(product.id)}
                          sx={{ p: { xs: 0.5, sm: 1 } }}
                        >
                          <Delete sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredProducts.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{
              borderTop: 1,
              borderColor: "divider",
              ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
            }}
          />
        </Paper>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingProduct ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Código"
              fullWidth
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            />
            <TextField
              label="Nombre"
              fullWidth
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <TextField
              label="Categoría"
              fullWidth
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            />
            <TextField
              label="Stock Sistema"
              type="number"
              fullWidth
              value={formData.stockSistema}
              onChange={(e) => setFormData({ ...formData, stockSistema: Number.parseInt(e.target.value) || 0 })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default ProductsPage
