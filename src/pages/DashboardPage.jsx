"use client"

import { useState } from "react"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Avatar,
  Divider,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from "@mui/material"
import { Home, Inventory, Description, QrCodeScanner, History, People, Logout } from "@mui/icons-material"

// Importar páginas
import HomePage from "./HomePage"
import ProductsPage from "./ProductsPage"
import PlantillasPage from "./PlantillasPage"
import ConteoPage from "./ConteoPage"
import HistorialPage from "./HistorialPage"
import UsersPage from "./UsersPage"

const DashboardPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAdmin } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const getNavigationValue = () => {
    const path = location.pathname
    if (path.includes("/productos")) return 1
    if (path.includes("/plantillas")) return 2
    if (path.includes("/conteo")) return 3
    if (path.includes("/historial")) return 4
    if (path.includes("/usuarios")) return 5
    return 0
  }

  const handleNavigationChange = (event, newValue) => {
    const conteoActivo = localStorage.getItem("conteoActivo")
    const currentPath = location.pathname
    const isInConteo = currentPath.includes("/conteo")

    if (conteoActivo && isInConteo) {
      const routes = [
        "/dashboard",
        "/dashboard/productos",
        "/dashboard/plantillas",
        "/dashboard/conteo",
        "/dashboard/historial",
        "/dashboard/usuarios",
      ]
      setPendingNavigation(routes[newValue])
      setShowExitDialog(true)
      return
    }

    const routes = [
      "/dashboard",
      "/dashboard/productos",
      "/dashboard/plantillas",
      "/dashboard/conteo",
      "/dashboard/historial",
      "/dashboard/usuarios",
    ]
    navigate(routes[newValue])
  }

  const handleCancelarConteo = async () => {
    try {
      const conteoData = localStorage.getItem("conteoActivo")
      if (conteoData) {
        const { conteoId } = JSON.parse(conteoData)
        await fetch(`${import.meta.env.VITE_API_URL}/api/conteos/${conteoId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
      }
      localStorage.removeItem("conteoActivo")
      setShowExitDialog(false)
      if (pendingNavigation) {
        navigate(pendingNavigation)
        setPendingNavigation(null)
      }
    } catch (error) {
      console.error("Error al cancelar conteo:", error)
      alert("Error al cancelar el conteo")
    }
  }

  const handleContinuarDespues = () => {
    setShowExitDialog(false)
    if (pendingNavigation) {
      navigate(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const handleCancelarNavegacion = () => {
    setShowExitDialog(false)
    setPendingNavigation(null)
  }

  const appBarHeight = isMobile ? 56 : 64
  const bottomNavHeight = isMobile ? 64 : 70

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="fixed" elevation={2} sx={{ top: 0, zIndex: theme.zIndex.appBar }}>
        <Toolbar>
          <Inventory sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Colector de Datos
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "white", color: "primary.main" }}>
              {user?.nombre?.charAt(0).toUpperCase() || "U"}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {user?.nombre || "Usuario"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.rol === "admin" ? "Administrador" : "Empleado"}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: "auto",
          backgroundColor: "#f5f5f5",
          pt: `${appBarHeight}px`,
          pb: `${bottomNavHeight + 8}px`,
          minHeight: "100vh",
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/plantillas" element={<PlantillasPage />} />
          <Route path="/conteo" element={<ConteoPage />} />
          <Route path="/historial" element={<HistorialPage />} />
          {isAdmin() && <Route path="/usuarios" element={<UsersPage />} />}
        </Routes>
      </Box>

      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={getNavigationValue()}
          onChange={handleNavigationChange}
          showLabels={!isMobile}
          sx={{
            height: bottomNavHeight,
            "& .MuiBottomNavigationAction-root": {
              minWidth: isMobile ? "auto" : 80,
              padding: isMobile ? "6px 0" : "6px 12px",
              "& .MuiBottomNavigationAction-label": {
                fontSize: isMobile ? "0.65rem" : "0.75rem",
                marginTop: isMobile ? "2px" : "4px",
                display: isMobile ? "none" : "block",
              },
              "& .MuiSvgIcon-root": {
                fontSize: isMobile ? "1.5rem" : "1.75rem",
              },
            },
            "& .MuiBottomNavigationAction-root.Mui-selected": {
              "& .MuiSvgIcon-root": {
                fontSize: isMobile ? "1.75rem" : "2rem",
              },
            },
          }}
        >
          <BottomNavigationAction label="Inicio" icon={<Home />} />
          <BottomNavigationAction label="Productos" icon={<Inventory />} />
          <BottomNavigationAction label="Plantillas" icon={<Description />} />
          <BottomNavigationAction label="Conteo" icon={<QrCodeScanner />} />
          <BottomNavigationAction label="Historial" icon={<History />} />
          {isAdmin() && <BottomNavigationAction label="Usuarios" icon={<People />} />}
        </BottomNavigation>
      </Paper>

      <Dialog
        open={showExitDialog}
        onClose={handleCancelarNavegacion}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            mx: 2,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>Conteo en Progreso</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tienes un conteo en progreso. ¿Qué deseas hacer?
          </Alert>
          <DialogContentText sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, mb: 2 }}>
            <strong>Continuar más tarde:</strong> El conteo se guardará como pendiente y podrás continuarlo después
            desde el historial.
          </DialogContentText>
          <DialogContentText sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
            <strong>Cancelar conteo:</strong> Se eliminará el conteo y perderás todo el progreso realizado.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: { xs: "column", sm: "row" }, gap: 1 }}>
          <Button
            onClick={handleCancelarNavegacion}
            variant="outlined"
            fullWidth={isMobile}
            sx={{ minHeight: { xs: 48, sm: 36 } }}
          >
            Volver al Conteo
          </Button>
          <Button
            onClick={handleCancelarConteo}
            color="error"
            variant="outlined"
            fullWidth={isMobile}
            sx={{ minHeight: { xs: 48, sm: 36 } }}
          >
            Cancelar Conteo
          </Button>
          <Button
            onClick={handleContinuarDespues}
            variant="contained"
            fullWidth={isMobile}
            sx={{ minHeight: { xs: 48, sm: 36 } }}
          >
            Continuar Más Tarde
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DashboardPage
