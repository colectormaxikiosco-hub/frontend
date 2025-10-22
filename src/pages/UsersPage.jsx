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
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, pb: 10 }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          Gestión de Usuarios
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}>
          Administración de usuarios del sistema
        </Typography>
      </Box>

      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => handleOpenDialog()}
        fullWidth
        sx={{ mb: 3, minHeight: { xs: 48, sm: 42 }, fontSize: { xs: "0.938rem", sm: "0.875rem" } }}
        size="large"
      >
        Nuevo Usuario
      </Button>

      {users.length === 0 ? (
        <Alert severity="info">No hay usuarios registrados</Alert>
      ) : (
        <Grid container spacing={2}>
          {users.map((user) => (
            <Grid item xs={12} key={user.id}>
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexGrow: 1 }}>
                      <Person sx={{ fontSize: { xs: 48, sm: 40 }, color: "primary.main" }} />
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
                        >
                          {user.nombre}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.875rem", sm: "0.938rem" } }}
                        >
                          @{user.usuario}
                        </Typography>
                        <Chip
                          label={user.rol === "admin" ? "Administrador" : "Empleado"}
                          size="small"
                          color={user.rol === "admin" ? "primary" : "default"}
                          sx={{ mt: 1, fontSize: { xs: "0.75rem", sm: "0.688rem" } }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(user)}
                        sx={{ p: { xs: 1, sm: 0.5 } }}
                      >
                        <Edit sx={{ fontSize: { xs: "1.25rem", sm: "1.125rem" } }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.usuario === "admin"}
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
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>
          {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nombre Completo"
              fullWidth
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: { xs: "0.938rem", sm: "1rem" },
                  py: { xs: 1.5, sm: 1 },
                },
              }}
            />
            <TextField
              label="Usuario"
              fullWidth
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              disabled={editingUser !== null}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: { xs: "0.938rem", sm: "1rem" },
                  py: { xs: 1.5, sm: 1 },
                },
              }}
            />
            <TextField
              label={editingUser ? "Nueva Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: { xs: "0.938rem", sm: "1rem" },
                  py: { xs: 1.5, sm: 1 },
                },
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: { xs: "0.938rem", sm: "1rem" } }}>Rol</InputLabel>
              <Select
                value={formData.rol}
                label="Rol"
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                sx={{
                  "& .MuiSelect-select": {
                    fontSize: { xs: "0.938rem", sm: "1rem" },
                    py: { xs: 1.5, sm: 1 },
                  },
                }}
              >
                <MenuItem value="empleado">Empleado</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseDialog} fullWidth size="large" sx={{ minHeight: { xs: 48, sm: 42 } }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            fullWidth
            size="large"
            disabled={!formData.nombre || !formData.usuario || (!editingUser && !formData.password)}
            sx={{ minHeight: { xs: 48, sm: 42 } }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default UsersPage
