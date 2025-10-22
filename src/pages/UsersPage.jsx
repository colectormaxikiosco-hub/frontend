"use client"

import { useState } from "react"
import { useData } from "../contexts/DataContext"
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material"
import { Add, Edit, Delete, Person } from "@mui/icons-material"

const UsersPage = () => {
  const { users, addUser, updateUser, deleteUser } = useData()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    usuario: "",
    password: "",
    nombre: "",
    rol: "empleado",
  })

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({ ...user, password: "" })
    } else {
      setEditingUser(null)
      setFormData({ usuario: "", password: "", nombre: "", rol: "empleado" })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingUser(null)
    setFormData({ usuario: "", password: "", nombre: "", rol: "empleado" })
  }

  const handleSave = () => {
    if (editingUser) {
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }
      updateUser(editingUser.id, updateData)
    } else {
      addUser(formData)
    }
    handleCloseDialog()
  }

  const handleDelete = (id) => {
    if (window.confirm("¿Está seguro de eliminar este usuario?")) {
      deleteUser(id)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Gestión de Usuarios
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administración de usuarios del sistema
        </Typography>
      </Box>

      <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} fullWidth sx={{ mb: 3 }}>
        Nuevo Usuario
      </Button>

      {users.length === 0 ? (
        <Alert severity="info">No hay usuarios registrados</Alert>
      ) : (
        <Grid container spacing={2}>
          {users.map((user) => (
            <Grid item xs={12} key={user.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexGrow: 1 }}>
                      <Person sx={{ fontSize: 40, color: "primary.main" }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {user.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{user.usuario}
                        </Typography>
                        <Chip
                          label={user.rol === "admin" ? "Administrador" : "Empleado"}
                          size="small"
                          color={user.rol === "admin" ? "primary" : "default"}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(user)}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.usuario === "admin"}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nombre Completo"
              fullWidth
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <TextField
              label="Usuario"
              fullWidth
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              disabled={editingUser !== null}
            />
            <TextField
              label={editingUser ? "Nueva Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.rol}
                label="Rol"
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              >
                <MenuItem value="empleado">Empleado</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.nombre || !formData.usuario || (!editingUser && !formData.password)}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default UsersPage
