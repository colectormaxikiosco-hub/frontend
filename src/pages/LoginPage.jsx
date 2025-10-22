"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Container, Paper, TextField, Button, Typography, Box, Alert, InputAdornment, IconButton } from "@mui/material"
import { Visibility, VisibilityOff, Inventory, Login as LoginIcon } from "@mui/icons-material"

const LoginPage = () => {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!username || !password) {
      setError("Por favor complete todos los campos")
      setLoading(false)
      return
    }

    try {
      const result = await login(username, password)

      if (result.success) {
        navigate("/dashboard", { replace: true })
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch (error) {
      console.error("[v0] Error en handleSubmit:", error)
      setError("Error de conexión. Verifica que el servidor esté corriendo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
        padding: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            borderRadius: 3,
            backgroundColor: "white",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#1976d2",
                mb: 2,
              }}
            >
              <Inventory sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
              Colector de Datos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema de Gestión de Almacén
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Usuario"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />

            <TextField
              label="Contraseña"
              variant="outlined"
              fullWidth
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{
                mt: 1,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default LoginPage
