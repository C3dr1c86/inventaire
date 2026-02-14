/**
 * Composant de scan de QR code
 * Utilise html5-qrcode pour scanner les QR codes avec la caméra
 */

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'
import './QRScanner.css'

const QRScanner = ({ onScan, onError, onClose }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  // Récupérer la liste des caméras disponibles
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices)
          // Sélectionner la caméra arrière par défaut (ou la première)
          const backCamera = devices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('arrière')
          )
          setSelectedCamera(backCamera?.id || devices[0].id)
        } else {
          onError?.('Aucune caméra détectée')
        }
      })
      .catch((err) => {
        console.error('Erreur lors de la détection des caméras:', err)
        onError?.('Impossible d\'accéder aux caméras')
      })
  }, [onError])

  // Démarrer le scan
  const startScanning = async () => {
    if (!selectedCamera) {
      onError?.('Veuillez sélectionner une caméra')
      return
    }

    try {
      html5QrCodeRef.current = new Html5Qrcode('qr-reader')

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }

      await html5QrCodeRef.current.start(
        selectedCamera,
        config,
        (decodedText) => {
          // QR code scanné avec succès
          stopScanning()
          onScan(decodedText)
        },
        () => {
          // Erreur de scan (normale pendant le scan)
          // On ne fait rien ici pour éviter de polluer la console
        }
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Erreur lors du démarrage du scan:', err)
      onError?.('Impossible de démarrer la caméra')
    }
  }

  // Arrêter le scan
  const stopScanning = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        setIsScanning(false)
      } catch (err) {
        console.error('Erreur lors de l\'arrêt du scan:', err)
      }
    }
  }

  // Cleanup à la fermeture
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-header">
        <h3>
          <Camera size={20} />
          Scanner un QR code
        </h3>
        <button
          className="btn-close"
          onClick={() => {
            stopScanning()
            onClose?.()
          }}
          title="Fermer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="qr-scanner-content">
        {!isScanning && (
          <div className="qr-scanner-controls">
            {cameras.length > 1 && (
              <div className="form-group">
                <label htmlFor="camera-select">Sélectionner une caméra</label>
                <select
                  id="camera-select"
                  className="form-control"
                  value={selectedCamera || ''}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Caméra ${camera.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              className="btn btn-primary btn-lg"
              onClick={startScanning}
              disabled={!selectedCamera}
            >
              <Camera size={20} />
              Démarrer le scan
            </button>

            <p className="qr-scanner-instructions">
              Positionnez le QR code d'un emplacement devant la caméra pour scanner.
              La liste des articles de cet emplacement s'affichera automatiquement.
            </p>
          </div>
        )}

        <div
          id="qr-reader"
          ref={scannerRef}
          className={isScanning ? 'qr-scanner-active' : 'qr-scanner-inactive'}
        />

        {isScanning && (
          <div className="qr-scanner-actions">
            <button
              className="btn btn-danger"
              onClick={stopScanning}
            >
              <X size={20} />
              Arrêter le scan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRScanner
