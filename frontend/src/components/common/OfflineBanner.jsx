/**
 * Bannière affichée en haut de page lorsque l'application est hors-ligne.
 * Disparaît automatiquement à la reconnexion.
 */

import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="offline-banner">
      <WifiOff size={16} />
      <span>Mode hors-ligne — les données affichées proviennent du cache local</span>
    </div>
  )
}
