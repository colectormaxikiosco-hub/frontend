"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useData } from "../contexts/DataContext"
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Button,
  DialogActions,
  InputAdornment,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from "@mui/material"
import {
  Close,
  Delete,
  Search,
  FilterList,
  Download,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  Assessment,
} from "@mui/icons-material"
import { formatDate } from "../utils/dateUtils"
import conteoService from "../services/conteoService"
import * as XLSX from "xlsx"

const HistorialPage = () => {
  const location = useLocation()
  const { conteos, refreshData } = useData()
  const [selectedConteo, setSelectedConteo] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchPlantilla, setSearchPlantilla] = useState("")
  const [searchUsuario, setSearchUsuario] = useState("")
  const [searchFecha, setSearchFecha] = useState("")
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [conteoToDelete, setConteoToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [searchProducto, setSearchProducto] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")

  useEffect(() => {
    if (location.state?.openConteoId && conteos.length > 0) {
      const conteo = conteos.find((c) => c.id === location.state.openConteoId)
      if (conteo) {
        handleOpenDetail(conteo)
        // Limpiar el state para que no se abra nuevamente si el usuario navega de vuelta
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, conteos])

  const handleOpenDetail = async (conteo) => {
    setOpenDialog(true)
    setLoadingDetail(true)
    try {
      const conteoCompleto = await conteoService.getById(conteo.id)
      const conteoMapeado = {
        ...conteoCompleto,
        plantillaNombre: conteoCompleto.plantilla_nombre,
        usuarioNombre: conteoCompleto.usuario_nombre,
        productos:
          conteoCompleto.productos?.map((p) => ({
            productoId: p.producto_id,
            codigo: p.codigo,
            nombre: p.nombre,
            categoria: p.categoria,
            cantidadDeseada: p.cantidad_deseada,
            cantidadReal: p.cantidad_real,
            cantidadSistema: p.cantidad_sistema,
            faltante: p.faltante,
            sobrante: p.sobrante,
            pedido: p.pedido,
          })) || [],
      }
      setSelectedConteo(conteoMapeado)
    } catch (error) {
      console.error("[v0] Error cargando detalle del conteo:", error)
      alert("Error al cargar el detalle del conteo")
      setOpenDialog(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedConteo(null)
  }

  const handleOpenDeleteDialog = (conteo, event) => {
    event.stopPropagation()
    setConteoToDelete(conteo)
    setOpenDeleteDialog(true)
  }

  const handleDeleteConteo = async () => {
    if (!conteoToDelete) return

    try {
      setDeleting(true)
      await conteoService.delete(conteoToDelete.id)
      await refreshData()
      setOpenDeleteDialog(false)
      setConteoToDelete(null)
      alert("Conteo eliminado correctamente")
    } catch (error) {
      console.error("[v0] Error eliminando conteo:", error)
      alert("Error al eliminar el conteo")
    } finally {
      setDeleting(false)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const conteosFiltrados = conteos.filter((conteo) => {
    const matchPlantilla = conteo.plantilla_nombre?.toLowerCase().includes(searchPlantilla.toLowerCase())
    const matchUsuario = conteo.usuario_nombre?.toLowerCase().includes(searchUsuario.toLowerCase())
    const matchFecha = searchFecha ? conteo.fecha_inicio?.includes(searchFecha) : true
    return matchPlantilla && matchUsuario && matchFecha
  })

  const conteosPaginados = conteosFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleExportarExcel = () => {
    if (!selectedConteo || !selectedConteo.productos) return

    const productosParaExportar = selectedConteo.productos.map((p) => ({
      Código: p.codigo,
      Producto: p.nombre,
      Categoría: p.categoria || "Sin categoría",
      "Cantidad Deseada": p.cantidadDeseada || 0,
      "Cantidad Real": p.cantidadReal || 0,
      "Cantidad Sistema": p.cantidadSistema || 0,
      Faltante: p.faltante || 0,
      Sobrante: p.sobrante || 0,
      Pedido: p.pedido || 0,
    }))

    const ws = XLSX.utils.json_to_sheet(productosParaExportar)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Conteo")

    const fileName = `Conteo_${selectedConteo.plantillaNombre}_${formatDate(selectedConteo.fecha_inicio).replace(/\//g, "-")}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const productosFiltrados =
    selectedConteo?.productos?.filter((producto) => {
      const matchBusqueda =
        producto.nombre?.toLowerCase().includes(searchProducto.toLowerCase()) ||
        producto.codigo?.toLowerCase().includes(searchProducto.toLowerCase())

      let matchTipo = true
      if (filtroTipo === "faltante") {
        matchTipo = (producto.faltante || 0) > 0
      } else if (filtroTipo === "sobrante") {
        matchTipo = (producto.sobrante || 0) > 0
      } else if (filtroTipo === "sin_diferencia") {
        matchTipo = (producto.faltante || 0) === 0 && (producto.sobrante || 0) === 0
      }

      return matchBusqueda && matchTipo
    }) || []

  const calcularEstadisticas = () => {
    if (!selectedConteo?.productos) return null

    const totalProductos = selectedConteo.productos.length
    const productosConFaltante = selectedConteo.productos.filter((p) => (p.faltante || 0) > 0).length
    const productosConSobrante = selectedConteo.productos.filter((p) => (p.sobrante || 0) > 0).length
    const productosSinDiferencia = selectedConteo.productos.filter(
      (p) => (p.faltante || 0) === 0 && (p.sobrante || 0) === 0,
    ).length
    const totalFaltante = selectedConteo.productos.reduce((sum, p) => sum + (p.faltante || 0), 0)
    const totalSobrante = selectedConteo.productos.reduce((sum, p) => sum + (p.sobrante || 0), 0)

    return {
      totalProductos,
      productosConFaltante,
      productosConSobrante,
      productosSinDiferencia,
      totalFaltante,
      totalSobrante,
    }
  }

  const estadisticas = calcularEstadisticas()

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, pb: 10 }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          Historial de Conteos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}>
          Registro de todos los conteos realizados
        </Typography>
      </Box>

      {conteos.length === 0 ? (
        <Alert severity="info">No hay conteos registrados</Alert>
      ) : (
        <>
          <Paper sx={{ p: { xs: 2, sm: 2 }, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <FilterList color="primary" />
              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: "0.938rem", sm: "1rem" } }}>
                Filtros de búsqueda
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por plantilla..."
                value={searchPlantilla}
                onChange={(e) => {
                  setSearchPlantilla(e.target.value)
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
                    fontSize: { xs: "0.938rem", sm: "0.875rem" },
                    py: { xs: 1.5, sm: 1 },
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por usuario..."
                value={searchUsuario}
                onChange={(e) => {
                  setSearchUsuario(e.target.value)
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
                    fontSize: { xs: "0.938rem", sm: "0.875rem" },
                    py: { xs: 1.5, sm: 1 },
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Filtrar por fecha"
                value={searchFecha}
                onChange={(e) => {
                  setSearchFecha(e.target.value)
                  setPage(0)
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "0.938rem", sm: "0.875rem" },
                    py: { xs: 1.5, sm: 1 },
                  },
                }}
              />
              {(searchPlantilla || searchUsuario || searchFecha) && (
                <Button
                  size="small"
                  onClick={() => {
                    setSearchPlantilla("")
                    setSearchUsuario("")
                    setSearchFecha("")
                    setPage(0)
                  }}
                  sx={{ fontSize: { xs: "0.875rem", sm: "0.813rem" } }}
                >
                  Limpiar filtros
                </Button>
              )}
            </Box>
          </Paper>

          {conteosFiltrados.length === 0 ? (
            <Alert severity="info">No se encontraron conteos con los filtros aplicados</Alert>
          ) : (
            <>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                {conteosPaginados.map((conteo) => {
                  return (
                    <Card key={conteo.id} sx={{ cursor: "pointer" }}>
                      <CardContent onClick={() => handleOpenDetail(conteo)} sx={{ p: { xs: 2, sm: 2 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
                            >
                              {conteo.plantilla_nombre}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                            >
                              Usuario: {conteo.usuario_nombre}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              gutterBottom
                              sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                            >
                              Fecha: {formatDate(conteo.fecha_inicio)}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                              <Chip
                                label={`${conteo.productos_contados || 0}/${conteo.total_productos || 0} productos`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                              />
                              <Chip
                                label={conteo.estado === "finalizado" ? "Finalizado" : "En progreso"}
                                size="small"
                                color={conteo.estado === "finalizado" ? "success" : "warning"}
                                sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                              />
                            </Box>
                          </Box>
                          <IconButton
                            color="error"
                            onClick={(e) => handleOpenDeleteDialog(conteo, e)}
                            size="small"
                            sx={{ p: { xs: 1, sm: 0.5 } }}
                          >
                            <Delete sx={{ fontSize: { xs: "1.25rem", sm: "1.125rem" } }} />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>

              <Paper sx={{ mt: 2 }}>
                <TablePagination
                  component="div"
                  count={conteosFiltrados.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 25, 50]}
                  labelRowsPerPage="Conteos por página:"
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
        </>
      )}

      <Dialog open={openDeleteDialog} onClose={() => !deleting && setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer
          </Alert>
          <Typography>
            ¿Está seguro de que desea eliminar el conteo de la plantilla "{conteoToDelete?.plantilla_nombre}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConteo} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {selectedConteo?.plantillaNombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usuario: {selectedConteo?.usuarioNombre} • Fecha:{" "}
                {selectedConteo && formatDate(selectedConteo.fecha_inicio)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExportarExcel}
                disabled={!selectedConteo?.productos || selectedConteo.productos.length === 0}
              >
                Exportar Excel
              </Button>
              <IconButton onClick={handleCloseDialog}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingDetail ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
              <Typography>Cargando detalles...</Typography>
            </Box>
          ) : selectedConteo && selectedConteo.productos && selectedConteo.productos.length > 0 ? (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Assessment sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {estadisticas?.totalProductos || 0}
                          </Typography>
                          <Typography variant="body2">Total Productos</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: "error.light", color: "error.contrastText" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TrendingDown sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {estadisticas?.productosConFaltante || 0}
                          </Typography>
                          <Typography variant="body2">Con Faltante</Typography>
                          <Typography variant="caption">Total: {estadisticas?.totalFaltante || 0} unidades</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: "success.light", color: "success.contrastText" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TrendingUp sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {estadisticas?.productosConSobrante || 0}
                          </Typography>
                          <Typography variant="body2">Con Sobrante</Typography>
                          <Typography variant="caption">Total: {estadisticas?.totalSobrante || 0} unidades</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: "info.light", color: "info.contrastText" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {estadisticas?.productosSinDiferencia || 0}
                          </Typography>
                          <Typography variant="body2">Sin Diferencia</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar por nombre o código de producto..."
                      value={searchProducto}
                      onChange={(e) => setSearchProducto(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FilterList />
                      <ToggleButtonGroup
                        value={filtroTipo}
                        exclusive
                        onChange={(e, newValue) => newValue && setFiltroTipo(newValue)}
                        size="small"
                        fullWidth
                      >
                        <ToggleButton value="todos">Todos</ToggleButton>
                        <ToggleButton value="faltante">Faltante</ToggleButton>
                        <ToggleButton value="sobrante">Sobrante</ToggleButton>
                        <ToggleButton value="sin_diferencia">Sin Diferencia</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </Grid>
                </Grid>
                {(searchProducto || filtroTipo !== "todos") && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Mostrando {productosFiltrados.length} de {selectedConteo.productos.length} productos
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        setSearchProducto("")
                        setFiltroTipo("todos")
                      }}
                      sx={{ mt: 1 }}
                    >
                      Limpiar filtros
                    </Button>
                  </Box>
                )}
              </Paper>

              {productosFiltrados.length === 0 ? (
                <Alert severity="info">No se encontraron productos con los filtros aplicados</Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>Código</TableCell>
                        <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>Producto</TableCell>
                        <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>Categoría</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                          Deseada
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                          Real
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                          Sistema
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                          Faltante
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                          Sobrante
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                          Pedido
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productosFiltrados.map((producto) => {
                        const faltante = producto.faltante || 0
                        const sobrante = producto.sobrante || 0
                        const pedido = producto.pedido || 0

                        return (
                          <TableRow
                            key={producto.productoId}
                            sx={{
                              "&:hover": { bgcolor: "action.hover" },
                              bgcolor: faltante > 0 ? "error.lighter" : sobrante > 0 ? "success.lighter" : "inherit",
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {producto.codigo}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {producto.nombre}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={producto.categoria || "Sin categoría"} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{producto.cantidadDeseada || 0}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                {producto.cantidadReal || 0}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{producto.cantidadSistema || 0}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={faltante}
                                size="small"
                                color={faltante > 0 ? "error" : "default"}
                                sx={{ fontWeight: "bold" }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={sobrante}
                                size="small"
                                color={sobrante > 0 ? "success" : "default"}
                                sx={{ fontWeight: "bold" }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={pedido}
                                size="small"
                                color={pedido > 0 ? "warning" : "default"}
                                sx={{ fontWeight: "bold" }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : (
            <Alert severity="info">No hay productos en este conteo</Alert>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default HistorialPage
