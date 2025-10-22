"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Button, Alert, IconButton, Typography, CircularProgress, Paper } from "@mui/material"
import { FlashlightOn, FlashlightOff, CameraAlt, Close } from "@mui/icons-material"
import { Html5Qrcode } from "html5-qrcode"

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [torch, setTorch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cameraId, setCameraId] = useState(null)
  const html5QrCodeRef = useRef(null)
  const scannerInitialized = useRef(false)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const checkCameraSupport = async () => {
    try {
      console.log("[v0] Verificando soporte de cámara...")

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Su navegador no soporta acceso a la cámara")
      }

      const devices = await Html5Qrcode.getCameras()
      console.log("[v0] Cámaras encontradas:", devices)

      if (!devices || devices.length === 0) {
        throw new Error("No se encontraron cámaras en el dispositivo")
      }

      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("trasera") ||
          device.label.toLowerCase().includes("environment"),
      )

      const selectedId = backCamera ? backCamera.id : devices[0].id
      console.log("[v0] Cámara seleccionada:", selectedId)
      return selectedId
    } catch (err) {
      console.error("[v0] Error al verificar cámaras:", err)
      throw err
    }
  }

  const startScanning = async () => {
    try {
      console.log("[v0] Iniciando escaneo...")
      setError(null)
      setLoading(true)

      await new Promise((resolve) => setTimeout(resolve, 100))

      const selectedCameraId = await checkCameraSupport()
      setCameraId(selectedCameraId)

      const readerElement = document.getElementById("qr-reader")
      if (!readerElement) {
        throw new Error("Elemento del escáner no encontrado en el DOM")
      }

      console.log("[v0] Elemento del escáner encontrado, inicializando...")

      if (!scannerInitialized.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader")
        scannerInitialized.current = true
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      console.log("[v0] Iniciando cámara con config:", config)

      await html5QrCodeRef.current.start(
        selectedCameraId,
        config,
        (decodedText) => {
          console.log("[v0] Código escaneado:", decodedText)
          onScan(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo
        },
      )

      console.log("[v0] Cámara iniciada exitosamente")
      setScanning(true)
      setLoading(false)
    } catch (err) {
      console.error("[v0] Error al iniciar escáner:", err)
      setLoading(false)
      setScanning(false)

      let errorMessage = "No se pudo acceder a la cámara."

      if (err.message.includes("Permission denied") || err.message.includes("NotAllowedError")) {
        errorMessage =
          "Permiso de cámara denegado. Por favor, permita el acceso a la cámara en la configuración de su navegador."
      } else if (err.message.includes("NotFoundError") || err.message.includes("no encontraron cámaras")) {
        errorMessage = "No se encontró ninguna cámara en su dispositivo."
      } else if (err.message.includes("NotReadableError")) {
        errorMessage = "La cámara está siendo usada por otra aplicación. Cierre otras apps que usen la cámara."
      } else if (err.message.includes("OverconstrainedError")) {
        errorMessage = "La configuración de la cámara no es compatible. Intente con otro dispositivo."
      } else if (err.message.includes("no soporta")) {
        errorMessage = err.message
      } else if (err.name === "NotAllowedError") {
        errorMessage = "Debe permitir el acceso a la cámara para escanear códigos de barras."
      }

      setError(errorMessage)
    }
  }

  const stopScanning = async () => {
    console.log("[v0] Deteniendo escáner...")
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        scannerInitialized.current = false
      } catch (err) {
        console.error("[v0] Error al detener escáner:", err)
      }
    }
    setScanning(false)
    setLoading(false)
  }

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        const track = html5QrCodeRef.current.getRunningTrackCameraCapabilities()
        if (track && track.torch) {
          await html5QrCodeRef.current.applyVideoConstraints({
            advanced: [{ torch: !torch }],
          })
          setTorch(!torch)
        }
      } catch (err) {
        console.error("[v0] Error al cambiar linterna:", err)
      }
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: !scanning && !loading ? "block" : "none" }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "0.813rem" } }}>
            <strong>Instrucciones:</strong>
          </Typography>
          <Typography variant="body2" component="div" sx={{ fontSize: { xs: "0.813rem", sm: "0.75rem" } }}>
            1. Permita el acceso a la cámara cuando se lo solicite
            <br />
            2. Apunte la cámara hacia el código de barras
            <br />
            3. Mantenga el código dentro del recuadro verde
            <br />
            4. El escaneo es automático
          </Typography>
        </Alert>
        <Button
          variant="contained"
          onClick={startScanning}
          fullWidth
          size="large"
          startIcon={<CameraAlt />}
          sx={{
            minHeight: { xs: 56, sm: 48 },
            fontSize: { xs: "1.1rem", sm: "1rem" },
          }}
        >
          Activar Cámara
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 4 }}>
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "1rem", sm: "0.938rem" } }}>
            Iniciando cámara...
          </Typography>
        </Box>
      )}

      <Box sx={{ display: scanning ? "block" : "none" }}>
        <Paper
          elevation={3}
          sx={{
            position: "relative",
            mb: 2,
            overflow: "hidden",
            borderRadius: 2,
            bgcolor: "black",
          }}
        >
          <div
            id="qr-reader"
            style={{
              width: "100%",
              minHeight: "400px",
              maxHeight: "500px",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              gap: 1,
              zIndex: 10,
            }}
          >
            <IconButton
              onClick={toggleTorch}
              sx={{
                bgcolor: "rgba(0,0,0,0.6)",
                color: "white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                width: { xs: 48, sm: 40 },
                height: { xs: 48, sm: 40 },
              }}
            >
              {torch ? <FlashlightOn /> : <FlashlightOff />}
            </IconButton>
            <IconButton
              onClick={() => {
                stopScanning()
                onClose()
              }}
              sx={{
                bgcolor: "rgba(0,0,0,0.6)",
                color: "white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                width: { xs: 48, sm: 40 },
                height: { xs: 48, sm: 40 },
              }}
            >
              <Close />
            </IconButton>
          </Box>

          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: "rgba(0,0,0,0.7)",
              color: "white",
              py: 1.5,
              px: 2,
              textAlign: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: "1rem", sm: "0.875rem" },
                fontWeight: 500,
              }}
            >
              📷 Escaneando... Apunte al código de barras
            </Typography>
          </Box>
        </Paper>

        <Button
          variant="outlined"
          onClick={() => {
            stopScanning()
            onClose()
          }}
          fullWidth
          size="large"
          sx={{
            minHeight: { xs: 48, sm: 42 },
            fontSize: { xs: "1rem", sm: "0.938rem" },
          }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  )
}

export default BarcodeScanner
