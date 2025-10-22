"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Button, Alert, IconButton, Typography } from "@mui/material"
import { FlashlightOn, FlashlightOff } from "@mui/icons-material"
import { Html5Qrcode } from "html5-qrcode"

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [torch, setTorch] = useState(false)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setError(null)

      html5QrCodeRef.current = new Html5Qrcode("qr-reader")

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScan(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo
        },
      )

      setScanning(true)
    } catch (err) {
      setError("No se pudo acceder a la cámara. Verifique los permisos.")
    }
  }

  const stopScanning = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch (err) {}
    }
    setScanning(false)
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
      } catch (err) {}
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!scanning ? (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Apunte la cámara hacia el código de barras del producto
          </Alert>
          <Button variant="contained" onClick={startScanning} fullWidth size="large">
            Activar Cámara
          </Button>
        </Box>
      ) : (
        <Box>
          <Box sx={{ position: "relative", mb: 2 }}>
            <div id="qr-reader" style={{ width: "100%", borderRadius: 8 }} />

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
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "white",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                }}
              >
                {torch ? <FlashlightOn /> : <FlashlightOff />}
              </IconButton>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Escaneando... Apunte al código de barras
          </Typography>

          <Button
            variant="outlined"
            onClick={() => {
              stopScanning()
              onClose()
            }}
            fullWidth
          >
            Cancelar
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default BarcodeScanner
