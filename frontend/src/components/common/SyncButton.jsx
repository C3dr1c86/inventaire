/**
 * Bouton de synchronisation manuelle des opérations hors-ligne.
 *
 * Affiche un badge avec le nombre d'opérations en attente.
 * Déclenche la synchronisation manuellement au clic.
 */

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { usePendingSync } from '../../hooks/usePendingSync'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { syncPendingOperations } from '../../services/syncService'

export default function SyncButton() {
  const { pendingCount, refresh } = usePendingSync()
  const isOnline = useOnlineStatus()
  const [isSyncing, setIsSyncing] = useState(false)

  // Ne rien afficher s'il n'y a rien à synchroniser
  if (pendingCount === 0) return null

  async function handleSync() {
    if (!isOnline) {
      toast.warning('Connexion requise pour synchroniser.')
      return
    }
    if (isSyncing) return

    setIsSyncing(true)
    try {
      const { synced, failed, errors } = await syncPendingOperations()

      if (synced > 0 && failed === 0) {
        toast.success(`${synced} opération(s) synchronisée(s) avec succès.`)
      } else if (synced > 0 && failed > 0) {
        toast.warning(
          `${synced} synchronisée(s), ${failed} en erreur : ${errors.map((e) => e.errorMessage).join(', ')}`
        )
      } else if (failed > 0) {
        toast.error(
          `Échec de la synchronisation : ${errors.map((e) => e.errorMessage).join(', ')}`
        )
      }
    } finally {
      setIsSyncing(false)
      await refresh()
    }
  }

  return (
    <button
      className={`sync-button ${!isOnline ? 'sync-button--offline' : ''}`}
      onClick={handleSync}
      disabled={isSyncing || !isOnline}
      title={
        !isOnline
          ? 'Hors-ligne — synchronisation impossible'
          : `${pendingCount} opération(s) en attente — cliquez pour synchroniser`
      }
    >
      {isSyncing ? (
        <RefreshCw size={16} className="sync-button__icon--spinning" />
      ) : isOnline ? (
        <CheckCircle size={16} />
      ) : (
        <AlertCircle size={16} />
      )}
      <span className="sync-button__label">
        {isSyncing ? 'Sync...' : `${pendingCount} en attente`}
      </span>
    </button>
  )
}
