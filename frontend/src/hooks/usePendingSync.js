/**
 * Hook qui retourne le nombre d'opérations hors-ligne en attente de sync.
 *
 * Se rafraîchit automatiquement lors des événements online/offline
 * et expose une fonction refresh() pour forcer la mise à jour.
 */

import { useState, useEffect, useCallback } from 'react'
import { countPendingOperations } from '../services/offlineQueue'

export function usePendingSync() {
  const [pendingCount, setPendingCount] = useState(0)

  const refresh = useCallback(async () => {
    const count = await countPendingOperations()
    setPendingCount(count)
  }, [])

  useEffect(() => {
    refresh()

    // Rafraîchir quand on revient en ligne (la sync vient de s'exécuter)
    window.addEventListener('online', refresh)
    window.addEventListener('offline', refresh)

    // Rafraîchir périodiquement si hors-ligne (opérations ajoutées)
    const interval = setInterval(refresh, 5000)

    return () => {
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', refresh)
      clearInterval(interval)
    }
  }, [refresh])

  return { pendingCount, refresh }
}
