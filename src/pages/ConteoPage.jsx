"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useData } from "../contexts/DataContext"
import { conteoService } from "../services/conteoService"
import BarcodeScanner from "../components/BarcodeScanner"
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
  IconButton,
  Snackbar,
  Divider,
  Paper,
  TablePagination,
} from "@mui/material"
import {
  QrCodeScanner,
  CheckCircle,
  Close,
  Keyboard,
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
  const [openScanner, setOpenScanner] = useState(false)
  const [openManualInput, setOpenManualInput] = useState(false)
  const [codigoManual, setCodigoManual] = useState("")
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

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (conteoActivo) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [conteoActivo])

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

  const handleScanCode = (codigo) => {
    const producto = productosConteo.find((p) => p.codigo === codigo)

    if (producto) {
      setProductoActual(producto)
      setOpenCantidadDialog(true)
      setOpenScanner(false)
    } else {
      setSnackbar({
        open: true,
        message: "Este producto no está en la plantilla seleccionada",
        severity: "warning",
      })
    }
  }

  const handleManualScan = () => {
    if (codigoManual.trim()) {
      handleScanCode(codigoManual.trim())
      setCodigoManual("")
      setOpenManualInput(false)
    }
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

        setTimeout(() => setOpenScanner(true), 500)
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
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCancelarConteo = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const handleDejarPendiente = () => {
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

  const handleOpenExitDialog = () => {
    setOpenExitDialog(true)
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

  const productosContados = productosConteo.filter((p) => p.cantidad_real !== null).length
  const totalProductos = productosConteo.length
  const progreso = totalProductos > 0 ? (productosContados / totalProductos) * 100 : 0

  const diferenciasActuales =
    productoActual && cantidadReal !== "" ? calcularDiferencias(cantidadReal, productoActual.cantidad_sistema) : null

  if (!conteoActivo) {
    return (
      <Container maxWidth="lg" sx={{ py: 3, pb: 10 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Iniciar Conteo
          </Typography>
          <Typography variant="body2" color="text.secondary">
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
              sx={{ mb: 2 }}
            />

            {plantillasFiltradas.length === 0 ? (
              <Alert severity="info">No se encontraron plantillas con ese nombre</Alert>
            ) : (
              <>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                  {plantillasPaginadas.map((plantilla) => (
                    <Card key={plantilla.id}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {plantilla.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {plantilla.descripcion}
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                          <Chip label={`${plantilla.productos?.length || 0} productos`} size="small" color="primary" />
                          <Button
                            variant="contained"
                            onClick={() => handleSelectPlantilla(plantilla)}
                            disabled={loading}
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
                  />
                </Paper>
              </>
            )}
          </>
        )}

        <Dialog open={openReminderDialog} onClose={() => setOpenReminderDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Recordatorio Importante</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Antes de iniciar el conteo
            </Alert>
            <Typography variant="body1" gutterBottom>
              ¿La lista de productos está actualizada con el stock del sistema?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Recuerde que el objetivo del conteo es comparar el stock físico con el stock cargado en el sistema desde
              el Excel. Asegúrese de haber actualizado la lista de productos antes de continuar.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ flexDirection: "column", gap: 1, p: 2 }}>
            <Button variant="contained" onClick={handleConfirmarInicioConteo} fullWidth disabled={loading}>
              Sí, la lista está actualizada
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setOpenReminderDialog(false)
                setPlantillaToSelect(null)
              }}
              fullWidth
            >
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3, pb: 10 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Conteo en Progreso
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedPlantilla.nombre}
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2">
              Progreso: {productosContados} / {totalProductos}
            </Typography>
            <Typography variant="subtitle2" color="primary" fontWeight="bold">
              {progreso.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progreso} sx={{ height: 8, borderRadius: 4 }} />
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<QrCodeScanner />}
          onClick={() => setOpenScanner(true)}
          fullWidth
          size="large"
        >
          Escanear
        </Button>
        <Button
          variant="outlined"
          startIcon={<Keyboard />}
          onClick={() => setOpenManualInput(true)}
          fullWidth
          size="large"
        >
          Manual
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircle />}
          onClick={handleFinalizarConteo}
          fullWidth
          size="large"
          disabled={loading}
        >
          Finalizar Conteo
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<ExitToApp />}
          onClick={handleOpenExitDialog}
          fullWidth
          size="large"
          disabled={loading}
        >
          Salir
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Cancel />}
          onClick={handleCancelarConteo}
          fullWidth
          size="large"
          disabled={loading}
        >
          Cancelar Conteo
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Productos ({productosContados}/{totalProductos})
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {productosConteo.map((producto) => (
          <Card
            key={producto.producto_id}
            sx={{
              bgcolor: producto.cantidad_real !== null ? "success.50" : "background.paper",
              border: producto.cantidad_real !== null ? "1px solid" : "none",
              borderColor: "success.main",
            }}
          >
            <CardContent sx={{ py: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {producto.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Código: {producto.codigo}
                  </Typography>
                  {producto.cantidad_real !== null && (
                    <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip label={`Real: ${producto.cantidad_real}`} size="small" color="primary" />
                      <Chip label={`Sistema: ${producto.cantidad_sistema}`} size="small" variant="outlined" />
                      {producto.faltante > 0 && (
                        <Chip
                          icon={<TrendingDown />}
                          label={`Faltante: ${producto.faltante}`}
                          size="small"
                          color="error"
                        />
                      )}
                      {producto.sobrante > 0 && (
                        <Chip
                          icon={<TrendingUp />}
                          label={`Sobrante: ${producto.sobrante}`}
                          size="small"
                          color="warning"
                        />
                      )}
                      {producto.faltante === 0 && producto.sobrante === 0 && (
                        <Chip icon={<CheckCircleOutline />} label="OK" size="small" color="success" />
                      )}
                    </Box>
                  )}
                </Box>
                <Chip
                  label={producto.cantidad_real !== null ? "Contado" : "Pendiente"}
                  color={producto.cantidad_real !== null ? "success" : "default"}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={openExitDialog} onClose={() => setOpenExitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>¿Qué desea hacer con el conteo?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Está saliendo del conteo en progreso
          </Alert>
          <Typography variant="body2" gutterBottom>
            Puede cancelar el conteo (se eliminará) o dejarlo como pendiente para continuar después.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: "column", gap: 1, p: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={handleCancelarConteo}
            fullWidth
            disabled={loading}
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
          >
            Dejar como Pendiente
          </Button>
          <Button variant="outlined" onClick={() => setOpenExitDialog(false)} fullWidth>
            Volver al Conteo
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openScanner}
        onClose={() => setOpenScanner(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { m: 2 },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Escanear Código</Typography>
            <IconButton onClick={() => setOpenScanner(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <BarcodeScanner onScan={handleScanCode} onClose={() => setOpenScanner(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={openManualInput} onClose={() => setOpenManualInput(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Ingresar Código Manual</Typography>
            <IconButton onClick={() => setOpenManualInput(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Código del Producto"
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
            autoFocus
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenManualInput(false)}>Cancelar</Button>
          <Button onClick={handleManualScan} variant="contained" disabled={!codigoManual.trim()}>
            Buscar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCantidadDialog} onClose={() => setOpenCantidadDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Ingresar Cantidad Real</DialogTitle>
        <DialogContent>
          {productoActual && (
            <Box sx={{ mt: 1 }}>
              <Paper sx={{ p: 2, mb: 2, bgcolor: "primary.50" }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {productoActual.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Código: {productoActual.codigo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
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
              />

              {diferenciasActuales && (
                <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {diferenciasActuales.faltante > 0 && (
                    <Chip icon={<TrendingDown />} label={`Faltante: ${diferenciasActuales.faltante}`} color="error" />
                  )}
                  {diferenciasActuales.sobrante > 0 && (
                    <Chip icon={<TrendingUp />} label={`Sobrante: ${diferenciasActuales.sobrante}`} color="warning" />
                  )}
                  {diferenciasActuales.faltante === 0 && diferenciasActuales.sobrante === 0 && (
                    <Chip icon={<CheckCircleOutline />} label="Coincide con el sistema" color="success" />
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCantidadDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveCantidad} variant="contained" disabled={cantidadReal === "" || loading}>
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
