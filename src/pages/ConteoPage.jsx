"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useData } from "../contexts/DataContext"
import { conteoService } from "../services/conteoService"
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  LinearProgress,
  Snackbar,
  Divider,
  Paper,
  TablePagination,
} from "@mui/material"
import {
  CheckCircle,
  TrendingUp,
  TrendingDown,
  CheckCircleOutline,
  Cancel,
  ExitToApp,
  Search,
} from "@mui/icons-material"

const ConteoPage = () => {
  const { plantillas, products, refreshData } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedPlantilla, setSelectedPlantilla] = useState(null)
  const [conteoActivo, setConteoActivo] = useState(null)
  const [productosConteo, setProductosConteo] = useState([])
  const [searchProducto, setSearchProducto] = useState("")
  const [openCantidadDialog, setOpenCantidadDialog] = useState(false)
  const [productoActual, setProductoActual] = useState(null)
  const [cantidadReal, setCantidadReal] = useState("")
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })
  const [openExitDialog, setOpenExitDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const [searchPlantilla, setSearchPlantilla] = useState("")
  const [pagePlantilla, setPagePlantilla] = useState(0)
  const [rowsPerPagePlantilla, setRowsPerPagePlantilla] = useState(10)
  const [openReminderDialog, setOpenReminderDialog] = useState(false)
  const [plantillaToSelect, setPlantillaToSelect] = useState(null)
  const [isLeavingIntentionally, setIsLeavingIntentionally] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (conteoActivo && !isLeavingIntentionally) {
        e.preventDefault()
        e.returnValue = ""

        // Attempt to cancel the count on force close (limited by browser)
        try {
          await conteoService.delete(conteoActivo.id)
        } catch (error) {
          console.error("[v0] Error al cancelar conteo en cierre forzado:", error)
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [conteoActivo, isLeavingIntentionally])

  useEffect(() => {
    if (!conteoActivo) return

    const handlePopState = (e) => {
      if (conteoActivo && !isLeavingIntentionally) {
        e.preventDefault()
        window.history.pushState(null, "", window.location.pathname)
        setOpenExitDialog(true)
      }
    }

    // Push current state to enable back button interception
    window.history.pushState(null, "", window.location.pathname)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [conteoActivo, isLeavingIntentionally])

  const handleSelectPlantilla = (plantilla) => {
    setPlantillaToSelect(plantilla)
    setOpenReminderDialog(true)
  }

  const handleConfirmarInicioConteo = async () => {
    try {
      setLoading(true)
      setOpenReminderDialog(false)
      setSelectedPlantilla(plantillaToSelect)

      const conteo = await conteoService.create(plantillaToSelect.id)
      const conteoCompleto = await conteoService.getById(conteo.id)

      setConteoActivo(conteoCompleto)
      setProductosConteo(conteoCompleto.productos || [])
      setIsLeavingIntentionally(false)

      setSnackbar({
        open: true,
        message: "Conteo iniciado correctamente",
        severity: "success",
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al iniciar el conteo",
        severity: "error",
      })
    } finally {
      setLoading(false)
      setPlantillaToSelect(null)
    }
  }

  const handleProductClick = (producto) => {
    setProductoActual(producto)
    setCantidadReal(producto.cantidad_real !== null ? producto.cantidad_real.toString() : "")
    setOpenCantidadDialog(true)
  }

  const calcularDiferencias = (cantidadReal, cantidadSistema) => {
    const real = Number(cantidadReal) || 0
    const sistema = Number(cantidadSistema) || 0

    const diferencia = real - sistema
    const faltante = diferencia < 0 ? Math.abs(diferencia) : 0
    const sobrante = diferencia > 0 ? diferencia : 0

    return { diferencia, faltante, sobrante }
  }

  const handleSaveCantidad = async () => {
    if (productoActual && cantidadReal !== "") {
      try {
        setLoading(true)
        const cantidad = Number(cantidadReal) || 0

        await conteoService.updateProductQuantity(conteoActivo.id, productoActual.producto_id, cantidad)

        setProductosConteo((prev) =>
          prev.map((p) =>
            p.producto_id === productoActual.producto_id
              ? {
                  ...p,
                  cantidad_real: cantidad,
                  ...calcularDiferencias(cantidad, p.cantidad_sistema),
                }
              : p,
          ),
        )

        setOpenCantidadDialog(false)
        setProductoActual(null)
        setCantidadReal("")

        setSnackbar({
          open: true,
          message: "Cantidad registrada correctamente",
          severity: "success",
        })
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Error al guardar la cantidad",
          severity: "error",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleFinalizarConteo = async () => {
    if (window.confirm("¿Está seguro de finalizar el conteo?")) {
      try {
        setLoading(true)
        setIsLeavingIntentionally(true)
        await conteoService.finalize(conteoActivo.id)

        setSnackbar({
          open: true,
          message: "Conteo finalizado y guardado en el historial",
          severity: "success",
        })

        await refreshData()
        setConteoActivo(null)
        setSelectedPlantilla(null)
        setProductosConteo([])
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Error al finalizar el conteo",
          severity: "error",
        })
        setIsLeavingIntentionally(false)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCancelarConteo = async () => {
    try {
      setLoading(true)
      setIsLeavingIntentionally(true)
      await conteoService.delete(conteoActivo.id)

      setSnackbar({
        open: true,
        message: "Conteo cancelado correctamente",
        severity: "info",
      })

      await refreshData()
      setConteoActivo(null)
      setSelectedPlantilla(null)
      setProductosConteo([])
      setOpenExitDialog(false)

      if (pendingNavigation) {
        navigate(pendingNavigation)
        setPendingNavigation(null)
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al cancelar el conteo",
        severity: "error",
      })
      setIsLeavingIntentionally(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDejarPendiente = () => {
    setIsLeavingIntentionally(true)

    setSnackbar({
      open: true,
      message: "Conteo guardado como pendiente",
      severity: "info",
    })

    setConteoActivo(null)
    setSelectedPlantilla(null)
    setProductosConteo([])
    setOpenExitDialog(false)

    if (pendingNavigation) {
      navigate(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const plantillasFiltradas = plantillas.filter((plantilla) =>
    plantilla.nombre.toLowerCase().includes(searchPlantilla.toLowerCase()),
  )

  const plantillasPaginadas = plantillasFiltradas.slice(
    pagePlantilla * rowsPerPagePlantilla,
    pagePlantilla * rowsPerPagePlantilla + rowsPerPagePlantilla,
  )

  const handleChangePagePlantilla = (event, newPage) => {
    setPagePlantilla(newPage)
  }

  const handleChangeRowsPerPagePlantilla = (event) => {
    setRowsPerPagePlantilla(Number.parseInt(event.target.value, 10))
    setPagePlantilla(0)
  }

  const productosFiltrados = productosConteo.filter((producto) => {
    const searchLower = searchProducto.toLowerCase()
    return producto.nombre.toLowerCase().includes(searchLower) || producto.codigo.toLowerCase().includes(searchLower)
  })

  const productosContados = productosConteo.filter((p) => p.cantidad_real !== null).length
  const totalProductos = productosConteo.length
  const progreso = totalProductos > 0 ? (productosContados / totalProductos) * 100 : 0

  const diferenciasActuales =
    productoActual && cantidadReal !== "" ? calcularDiferencias(cantidadReal, productoActual.cantidad_sistema) : null

  if (!conteoActivo) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, pb: 10 }}>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
            Iniciar Conteo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}>
            Seleccione una plantilla para comenzar
          </Typography>
        </Box>

        {plantillas.length === 0 ? (
          <Alert severity="info">No hay plantillas disponibles. Cree una plantilla primero.</Alert>
        ) : (
          <>
            <TextField
              fullWidth
              placeholder="Buscar plantilla por nombre..."
              value={searchPlantilla}
              onChange={(e) => {
                setSearchPlantilla(e.target.value)
                setPagePlantilla(0)
              }}
              InputProps={{
                startAdornment: <Search sx={{ color: "text.secondary", mr: 1 }} />,
              }}
              sx={{
                mb: 2,
                "& .MuiInputBase-input": {
                  fontSize: { xs: "0.938rem", sm: "1rem" },
                  py: { xs: 1.5, sm: 2 },
                },
              }}
            />

            {plantillasFiltradas.length === 0 ? (
              <Alert severity="info">No se encontraron plantillas con ese nombre</Alert>
            ) : (
              <>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                  {plantillasPaginadas.map((plantilla) => (
                    <Card key={plantilla.id}>
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                          <Chip label={`${plantilla.productos?.length || 0} productos`} size="small" color="primary" />
                          <Button
                            variant="contained"
                            onClick={() => handleSelectPlantilla(plantilla)}
                            disabled={loading}
                            size="large"
                            sx={{
                              minHeight: { xs: 42, sm: 36 },
                              fontSize: { xs: "0.938rem", sm: "0.875rem" },
                            }}
                          >
                            Seleccionar
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                <Paper>
                  <TablePagination
                    component="div"
                    count={plantillasFiltradas.length}
                    page={pagePlantilla}
                    onPageChange={handleChangePagePlantilla}
                    rowsPerPage={rowsPerPagePlantilla}
                    onRowsPerPageChange={handleChangeRowsPerPagePlantilla}
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
          </>
        )}

        <Dialog open={openReminderDialog} onClose={() => setOpenReminderDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>Recordatorio Importante</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Antes de iniciar el conteo
            </Alert>
            <Typography variant="body1" gutterBottom sx={{ fontSize: { xs: "0.938rem", sm: "1rem" } }}>
              ¿La lista de productos está actualizada con el stock del sistema?
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
            >
              Recuerde que el objetivo del conteo es comparar el stock físico con el stock cargado en el sistema desde
              el Excel. Asegúrese de haber actualizado la lista de productos antes de continuar.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ flexDirection: "column", gap: 1, p: 2 }}>
            <Button
              variant="contained"
              onClick={handleConfirmarInicioConteo}
              fullWidth
              disabled={loading}
              size="large"
              sx={{ minHeight: { xs: 48, sm: 42 }, fontSize: { xs: "0.938rem", sm: "0.875rem" } }}
            >
              Sí, la lista está actualizada
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setOpenReminderDialog(false)
                setPlantillaToSelect(null)
              }}
              fullWidth
              size="large"
              sx={{ minHeight: { xs: 48, sm: 42 }, fontSize: { xs: "0.938rem", sm: "0.875rem" } }}
            >
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, pb: 10 }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          Conteo en Progreso
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}>
          {selectedPlantilla.nombre}
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontSize: { xs: "0.875rem", sm: "0.938rem" } }}>
              Progreso: {productosContados} / {totalProductos}
            </Typography>
            <Typography
              variant="subtitle2"
              color="primary"
              fontWeight="bold"
              sx={{ fontSize: { xs: "0.875rem", sm: "0.938rem" } }}
            >
              {progreso.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progreso} sx={{ height: { xs: 10, sm: 8 }, borderRadius: 4 }} />
        </CardContent>
      </Card>

      <TextField
        fullWidth
        placeholder="Buscar producto por nombre o código..."
        value={searchProducto}
        onChange={(e) => setSearchProducto(e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ color: "text.secondary", mr: 1 }} />,
        }}
        sx={{
          mb: 3,
          "& .MuiInputBase-root": {
            fontSize: { xs: "1rem", sm: "0.938rem" },
            minHeight: { xs: 56, sm: 48 },
          },
          "& .MuiInputBase-input": {
            py: { xs: 2, sm: 1.5 },
          },
        }}
      />

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircle />}
          onClick={handleFinalizarConteo}
          fullWidth
          size="large"
          disabled={loading}
          sx={{ minHeight: { xs: 56, sm: 48 }, fontSize: { xs: "1rem", sm: "0.938rem" } }}
        >
          Finalizar Conteo
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}>
        Productos ({productosContados}/{totalProductos}){searchProducto && ` - ${productosFiltrados.length} resultados`}
      </Typography>

      {productosFiltrados.length === 0 && searchProducto && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No se encontraron productos que coincidan con "{searchProducto}"
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {productosFiltrados.map((producto) => (
          <Card
            key={producto.producto_id}
            onClick={() => handleProductClick(producto)}
            sx={{
              bgcolor: producto.cantidad_real !== null ? "success.50" : "background.paper",
              border: producto.cantidad_real !== null ? "1px solid" : "none",
              borderColor: "success.main",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                transform: "scale(1.01)",
                boxShadow: 2,
              },
              "&:active": {
                transform: "scale(0.99)",
              },
            }}
          >
            <CardContent sx={{ py: { xs: 2, sm: 1.5 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ fontSize: { xs: "0.938rem", sm: "0.875rem" } }}
                  >
                    {producto.nombre}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                  >
                    Código: {producto.codigo}
                  </Typography>
                  {producto.cantidad_real !== null && (
                    <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        label={`Real: ${producto.cantidad_real}`}
                        size="small"
                        color="primary"
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                      />
                      <Chip
                        label={`Sistema: ${producto.cantidad_sistema}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                      />
                      {producto.faltante > 0 && (
                        <Chip
                          icon={<TrendingDown />}
                          label={`Faltante: ${producto.faltante}`}
                          size="small"
                          color="error"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                        />
                      )}
                      {producto.sobrante > 0 && (
                        <Chip
                          icon={<TrendingUp />}
                          label={`Sobrante: ${producto.sobrante}`}
                          size="small"
                          color="warning"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                        />
                      )}
                      {producto.faltante === 0 && producto.sobrante === 0 && (
                        <Chip
                          icon={<CheckCircleOutline />}
                          label="OK"
                          size="small"
                          color="success"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
                <Chip
                  label={producto.cantidad_real !== null ? "Contado" : "Pendiente"}
                  color={producto.cantidad_real !== null ? "success" : "default"}
                  size="small"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog
        open={openExitDialog}
        onClose={() => setOpenExitDialog(false)}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>¿Qué desea hacer con el conteo?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Está intentando salir del conteo en progreso
          </Alert>
          <Typography variant="body2" gutterBottom sx={{ mb: 2, fontSize: { xs: "0.875rem", sm: "0.938rem" } }}>
            Elija una de las siguientes opciones:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Paper sx={{ p: 2, bgcolor: "error.50", border: "1px solid", borderColor: "error.light" }}>
              <Typography variant="subtitle2" fontWeight="bold" color="error.main" gutterBottom>
                Cancelar Conteo
              </Typography>
              <Typography variant="caption" color="text.secondary">
                El conteo será eliminado permanentemente y no aparecerá en el historial.
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: "warning.50", border: "1px solid", borderColor: "warning.light" }}>
              <Typography variant="subtitle2" fontWeight="bold" color="warning.main" gutterBottom>
                Guardar como Pendiente
              </Typography>
              <Typography variant="caption" color="text.secondary">
                El conteo se guardará y podrá continuarlo más tarde desde el historial.
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexDirection: "column", gap: 1, p: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={handleCancelarConteo}
            fullWidth
            disabled={loading}
            sx={{ minHeight: { xs: 56, sm: 48 }, fontSize: { xs: "1rem", sm: "0.938rem" } }}
          >
            Cancelar Conteo (Eliminar)
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<ExitToApp />}
            onClick={handleDejarPendiente}
            fullWidth
            disabled={loading}
            sx={{ minHeight: { xs: 56, sm: 48 }, fontSize: { xs: "1rem", sm: "0.938rem" } }}
          >
            Guardar como Pendiente
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenExitDialog(false)}
            fullWidth
            sx={{ minHeight: { xs: 48, sm: 42 } }}
          >
            Continuar Conteo
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCantidadDialog}
        onClose={() => {
          setOpenCantidadDialog(false)
          setProductoActual(null)
          setCantidadReal("")
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>Ingresar Cantidad Real</DialogTitle>
        <DialogContent>
          {productoActual && (
            <Box sx={{ mt: 1 }}>
              <Paper sx={{ p: { xs: 2.5, sm: 2 }, mb: 2, bgcolor: "primary.50" }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
                >
                  {productoActual.nombre}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.875rem", sm: "0.938rem" } }}
                >
                  Código: {productoActual.codigo}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.875rem", sm: "0.938rem" } }}
                >
                  Stock en Sistema: {productoActual.cantidad_sistema}
                </Typography>
              </Paper>

              <TextField
                fullWidth
                label="Cantidad Real"
                type="number"
                value={cantidadReal}
                onChange={(e) => setCantidadReal(e.target.value)}
                onFocus={(e) => e.target.select()}
                autoFocus
                inputProps={{ min: 0, inputMode: "numeric" }}
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "1.125rem", sm: "1rem" },
                    py: { xs: 2, sm: 1.5 },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: { xs: "1rem", sm: "0.938rem" },
                  },
                }}
              />

              {diferenciasActuales && (
                <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {diferenciasActuales.faltante > 0 && (
                    <Chip
                      icon={<TrendingDown />}
                      label={`Faltante: ${diferenciasActuales.faltante}`}
                      color="error"
                      sx={{ fontSize: { xs: "0.875rem", sm: "0.813rem" } }}
                    />
                  )}
                  {diferenciasActuales.sobrante > 0 && (
                    <Chip
                      icon={<TrendingUp />}
                      label={`Sobrante: ${diferenciasActuales.sobrante}`}
                      color="warning"
                      sx={{ fontSize: { xs: "0.875rem", sm: "0.813rem" } }}
                    />
                  )}
                  {diferenciasActuales.faltante === 0 && diferenciasActuales.sobrante === 0 && (
                    <Chip
                      icon={<CheckCircleOutline />}
                      label="Coincide con el sistema"
                      color="success"
                      sx={{ fontSize: { xs: "0.875rem", sm: "0.813rem" } }}
                    />
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setOpenCantidadDialog(false)
              setProductoActual(null)
              setCantidadReal("")
            }}
            fullWidth
            size="large"
            sx={{ minHeight: { xs: 48, sm: 42 } }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveCantidad}
            variant="contained"
            disabled={cantidadReal === "" || loading}
            fullWidth
            size="large"
            sx={{ minHeight: { xs: 48, sm: 42 } }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default ConteoPage
