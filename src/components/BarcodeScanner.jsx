// BarcodeScanner.jsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Button, Alert, IconButton, Typography, CircularProgress, Paper } from "@mui/material"
import { FlashlightOn, FlashlightOff, CameraAlt, Close } from "@mui/icons-material"
import { Html5Qrcode } from "html5-qrcode"

/**
 * BarcodeScanner (mejorado)
 * - Corrige el recuadro negro forzando attributes en el <video> que crea html5-qrcode
 * - Añade retries/playsInline/muted/autoplay
 * - Toggle torch accediendo al MediaStreamTrack
 *
 * Props:
 * - onScan(decodedText)
 * - onClose()
 */

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [torch, setTorch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cameraId, setCameraId] = useState(null)
  const html5QrCodeRef = useRef(null)
  const scannerInitialized = useRef(false)
  // guard to store last stream track used (for torch)
  const videoTrackRef = useRef(null)

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopScanning().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // utility: find the <video> element html5-qrcode created inside #qr-reader
  const getReaderVideoElement = () => {
    const container = document.getElementById("qr-reader")
    if (!container) return null
    // html5-qrcode typically injects <video> element
    return container.querySelector("video")
  }

  const checkCameraSupport = async () => {
    try {
      console.log("[v1] Verificando soporte de cámara...")
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Su navegador no soporta acceso a la cámara")
      }

      const devices = await Html5Qrcode.getCameras()
      console.log("[v1] Cámaras encontradas:", devices)

      if (!devices || devices.length === 0) {
        throw new Error("No se encontraron cámaras en el dispositivo")
      }

      const backCamera = devices.find((device) => {
        const label = (device.label || "").toLowerCase()
        return (
          label.includes("back") ||
          label.includes("rear") ||
          label.includes("trasera") ||
          label.includes("environment") ||
          label.includes("camera 1")
        )
      })

      const selectedId = backCamera ? backCamera.id : devices[0].id
      console.log("[v1] Cámara seleccionada:", selectedId)
      return selectedId
    } catch (err) {
      console.error("[v1] Error al verificar cámaras:", err)
      throw err
    }
  }

  // After html5-qrcode starts, ensure the video element has the right attributes for iOS autoplay/playsinline
  const fixVideoElementAttributes = async () => {
    try {
      const video = getReaderVideoElement()
      if (!video) {
        console.warn("[v1] No se encontró <video> dentro del reader")
        return
      }

      // Force attributes required by iOS Safari & mobile autoplay policies
      video.muted = true
      video.autoplay = true
      video.playsInline = true
      video.setAttribute("playsinline", "")
      video.setAttribute("webkit-playsinline", "")
      video.setAttribute("muted", "")
      // Style to avoid letterboxing / black bars
      video.style.objectFit = "cover"
      video.style.width = "100%"
      video.style.height = "100%"

      // Attach the track ref for torch toggling
      if (video.srcObject && video.srcObject.getVideoTracks && video.srcObject.getVideoTracks().length > 0) {
        videoTrackRef.current = video.srcObject.getVideoTracks()[0]
      }

      try {
        // Try to play the video element (sometimes necessary)
        await video.play()
        console.log("[v1] video.play() OK")
      } catch (playErr) {
        console.warn("[v1] video.play() fallo inicialmente:", playErr)
        // retry slight delay — helps cuando modal tiene animación
        setTimeout(() => {
          video.play().catch((err) => console.warn("[v1] retry video.play() fallo:", err))
        }, 250)
      }
    } catch (err) {
      console.error("[v1] fixVideoElementAttributes error:", err)
    }
  }

  const startScanning = async () => {
    try {
      console.log("[v1] Iniciando escaneo...")
      setError(null)
      setLoading(true)

      // Pequeño delay para asegurarnos modal/render DOM visible (aumentar si usas animaciones)
      await new Promise((r) => setTimeout(r, 250))

      const selectedCameraId = await checkCameraSupport()
      setCameraId(selectedCameraId)

      const readerElement = document.getElementById("qr-reader")
      if (!readerElement) {
        throw new Error("Elemento del escáner no encontrado en el DOM")
      }

      console.log("[v1] Elemento del escáner encontrado, inicializando Html5Qrcode...")

      if (!scannerInitialized.current) {
        // clear previous nodes inside reader if any
        readerElement.innerHTML = ""
        html5QrCodeRef.current = new Html5Qrcode("qr-reader", /* verbose= */ false)
        scannerInitialized.current = true
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // experimentalFeatures: { useBarCodeDetectorIfSupported: true } // opcional si quieres experimentales
      }

      console.log("[v1] Llamando html5QrCode.start con config:", config)

      // Start scanner with selected camera id
      await html5QrCodeRef.current.start(
        selectedCameraId,
        config,
        (decodedText) => {
          console.log("[v1] Código escaneado:", decodedText)
          try {
            onScan(decodedText)
          } catch (err) {
            console.warn("[v1] onScan callback error:", err)
          }
          stopScanning().catch(() => {})
        },
        (errorMessage) => {
          // Manejo silencioso de errores de lectura continua (no queremos spamear)
          // console.debug("[v1] scanning error:", errorMessage)
        },
      )

      // html5-qrcode inicializó la cámara; fijamos atributos en el <video>
      await fixVideoElementAttributes()

      console.log("[v1] Cámara iniciada exitosamente")
      setScanning(true)
      setLoading(false)
    } catch (err) {
      console.error("[v1] Error al iniciar escáner:", err)
      setLoading(false)
      setScanning(false)

      let errorMessage = "No se pudo acceder a la cámara."

      const msg = (err && err.message) || ""
      const name = (err && err.name) || ""

      if (msg.includes("Permission denied") || msg.includes("NotAllowedError") || name === "NotAllowedError") {
        errorMessage =
          "Permiso de cámara denegado. Por favor, permita el acceso a la cámara en la configuración de su navegador."
      } else if (msg.includes("NotFoundError") || msg.includes("no encontraron cámaras") || name === "NotFoundError") {
        errorMessage = "No se encontró ninguna cámara en su dispositivo."
      } else if (msg.includes("NotReadableError") || name === "NotReadableError") {
        errorMessage = "La cámara está siendo usada por otra aplicación. Cierre otras apps que usen la cámara."
      } else if (msg.includes("OverconstrainedError") || name === "OverconstrainedError") {
        errorMessage = "La configuración de la cámara no es compatible. Intente con otro dispositivo."
      } else if (msg.includes("Su navegador no soporta")) {
        errorMessage = msg
      }

      setError(errorMessage)
    }
  }

  const stopScanning = async () => {
    console.log("[v1] Deteniendo escáner...")
    try {
      if (html5QrCodeRef.current) {
        // html5-qrcode.stop() puede lanzar si ya está detenido => envolver en try/catch
        try {
          await html5QrCodeRef.current.stop()
        } catch (stopErr) {
          console.warn("[v1] html5QrCode.stop() warning:", stopErr)
        }
        try {
          html5QrCodeRef.current.clear()
        } catch (clearErr) {
          console.warn("[v1] html5QrCode.clear() warning:", clearErr)
        }
        html5QrCodeRef.current = null
      }

      // también parar tracks si quedaron colgando
      const video = getReaderVideoElement()
      if (video && video.srcObject) {
        try {
          const tracks = video.srcObject.getTracks()
          tracks.forEach((t) => t.stop())
        } catch (err) {
          console.warn("[v1] stop tracks warning:", err)
        }
        video.srcObject = null
      }

      videoTrackRef.current = null
    } catch (err) {
      console.error("[v1] Error al detener escáner:", err)
    } finally {
      scannerInitialized.current = false
      setScanning(false)
      setLoading(false)
      setTorch(false)
    }
  }

  // Toggle torch using the running MediaStreamTrack (if supported)
  const toggleTorch = async () => {
    try {
      // Intenta obtener la pista actual desde el video
      const video = getReaderVideoElement()
      let track = videoTrackRef.current
      if (!track && video && video.srcObject) {
        const tracks = video.srcObject.getVideoTracks()
        track = tracks && tracks.length ? tracks[0] : null
        videoTrackRef.current = track
      }

      if (!track) {
        console.warn("[v1] No se encontró MediaStreamTrack para linterna")
        return
      }

      const capabilities = track.getCapabilities ? track.getCapabilities() : {}
      if (!capabilities.torch) {
        console.warn("[v1] Torch no soportado por este dispositivo (capabilities):", capabilities)
        return
      }

      // Apply constraint to toggle torch
      await track.applyConstraints({ advanced: [{ torch: !torch }] })
      setTorch((prev) => !prev)
      console.log("[v1] Torch toggled ->", !torch)
    } catch (err) {
      console.error("[v1] Error al cambiar linterna:", err)
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
            // dejar fondo oscuro para el overlay pero el video será visible por encima
            bgcolor: "black",
            // asegurar que el reader sea visible para que video pueda renderizar
            minHeight: { xs: "360px", sm: "400px" },
          }}
        >
          <div
            id="qr-reader"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "360px",
              maxHeight: "500px",
              // evitar que el contenedor empiece oculto (causa black box en algunos navegadores)
              display: "block",
              background: "transparent",
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
                stopScanning().catch(() => {})
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
            stopScanning().catch(() => {})
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
