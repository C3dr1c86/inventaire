/**
 * Composant de scan de QR code
 * Utilise html5-qrcode pour scanner les QR codes avec la caméra
 *
 * Correction v2.0.1 : le div #qr-reader doit être visible (display != none)
 * avant d'appeler Html5Qrcode.start(). On utilise un useEffect déclenché
 * par isScanning=true (après le rendu) pour lancer la caméra.
 */

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'
import './QRScanner.css'

const QRScanner = ({ onScan, onError, onClose }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  // Callbacks stables via ref pour éviter les dépendances cycliques dans useEffect
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  useEffect(() => { onScanRef.current = onScan }, [onScan])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  // Récupérer la liste des caméras disponibles
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices)
          // Préférer la caméra arrière (mots-clés multi-langues)
          const backCamera = devices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('arrière') ||
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          )
          setSelectedCamera(backCamera?.id || devices[0].id)
        } else {
          onErrorRef.current?.('Aucune caméra détectée')
        }
      })
      .catch((err) => {
        console.error('Erreur lors de la détection des caméras:', err)
        onErrorRef.current?.('Impossible d\'accéder aux caméras')
      })
  }, [])

  // Démarrer la caméra APRÈS que le div #qr-reader soit visible dans le DOM.
  // Ce useEffect s'exécute après chaque rendu où isScanning passe à true,
  // ce qui garantit que display:block est appliqué avant Html5Qrcode.start().
  useEffect(() => {
    if (!isScanning || !selectedCamera) return

    let cancelled = false
    let hasScanned = false // verrou : empêche les callbacks multiples (10fps)
    const scanner = new Html5Qrcode('qr-reader')

    scanner.start(
      selectedCamera,
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      (decodedText) => {
        if (cancelled || hasScanned) return
        hasScanned = true // verrouiller immédiatement pour les frames suivantes
        scanner.stop().catch(() => {})
        setIsScanning(false)
        onScanRef.current(decodedText)
      },
      () => {
        // Erreur de frame normale (pas encore de QR code dans le champ)
        // On ne remonte pas ces erreurs pour éviter de polluer l'UI
      }
    ).catch((err) => {
      if (cancelled) return
      console.error('Erreur lors du démarrage du scan:', err)
      setIsScanning(false)
      onErrorRef.current?.('Impossible de démarrer la caméra. Vérifiez que l\'application est en HTTPS.')
    })

    return () => {
      cancelled = true
      scanner.stop().catch(() => {})
    }
  }, [isScanning, selectedCamera])

  const handleStartScan = () => {
    if (!selectedCamera) {
      onErrorRef.current?.('Veuillez sélectionner une caméra')
      return
    }
    setIsScanning(true) // → re-rendu → div visible → useEffect démarre la caméra
  }

  const handleStopScan = () => {
    setIsScanning(false) // → useEffect cleanup arrête la caméra
  }

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
            setIsScanning(false)
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
              onClick={handleStartScan}
              disabled={!selectedCamera}
            >
              <Camera size={20} />
              Démarrer le scan
            </button>

            <p className="qr-scanner-instructions">
              Positionnez le QR code devant la caméra pour scanner automatiquement.
            </p>
          </div>
        )}

        {/* Ce div doit toujours être dans le DOM — la classe contrôle la visibilité */}
        <div
          id="qr-reader"
          className={isScanning ? 'qr-scanner-active' : 'qr-scanner-inactive'}
        />

        {isScanning && (
          <div className="qr-scanner-actions">
            <button
              className="btn btn-danger"
              onClick={handleStopScan}
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
