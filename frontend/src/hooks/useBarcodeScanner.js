/**
 * Hook pour la détection des scans de code-barres via lecteur physique Zebra TC57.
 *
 * Le lecteur Zebra DataWedge envoie les caractères très rapidement (< 50 ms entre eux)
 * suivi d'une touche Entrée. Ce hook distingue la saisie humaine (lente) du scan
 * automatique (rapide) et appelle le callback onScan avec le code détecté.
 *
 * Usage :
 *   useBarcodeScanner((code) => console.log('Scanné :', code))
 *   useBarcodeScanner(handleScan, { enabled: estEnModeScan })
 *
 * Note : le hook n'intercepte PAS la saisie dans les champs INPUT/TEXTAREA
 * standard (pour ne pas perturber la saisie manuelle), SAUF si le champ possède
 * la classe CSS `barcode-capture-input`.
 */
import { useEffect, useRef, useCallback } from 'react'

// Intervalle maximum entre 2 caractères consécutifs d'un même scan (ms)
const SCAN_INTERVAL_MAX = 50

// Longueur minimale d'un code-barres valide
const MIN_BARCODE_LENGTH = 3

// Délai avant flush automatique si aucune touche Entrée n'est reçue (ms)
const FLUSH_TIMEOUT = 250

export function useBarcodeScanner(onScan, { enabled = true } = {}) {
  const bufferRef       = useRef('')
  const lastKeyTimeRef  = useRef(0)
  const flushTimerRef   = useRef(null)

  const flush = useCallback(() => {
    const code = bufferRef.current.trim()
    bufferRef.current = ''
    if (code.length >= MIN_BARCODE_LENGTH) {
      onScan(code)
    }
  }, [onScan])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e) => {
      // Ne pas intercepter la saisie dans un champ de formulaire classique
      const el = document.activeElement
      const isRegularInput =
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) &&
        !el.classList.contains('barcode-capture-input')

      if (isRegularInput) return

      const now     = Date.now()
      const elapsed = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // Touche Entrée → fin du scan, valider le buffer immédiatement
      if (e.key === 'Enter') {
        clearTimeout(flushTimerRef.current)
        flush()
        return
      }

      // Trop de temps écoulé entre deux touches → saisie humaine, vider le buffer
      if (elapsed > SCAN_INTERVAL_MAX * 4 && bufferRef.current.length > 0) {
        bufferRef.current = ''
      }

      // Accumuler uniquement les caractères imprimables
      if (e.key.length === 1) {
        bufferRef.current += e.key
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = setTimeout(flush, FLUSH_TIMEOUT)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(flushTimerRef.current)
    }
  }, [enabled, flush])
}
