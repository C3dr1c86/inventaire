/**
 * Service de synchronisation hors-ligne.
 *
 * Relit la file d'attente IndexedDB et rejoue les requêtes
 * vers l'API dès que la connexion est rétablie.
 * Invalide le cache React Query après chaque sync réussie.
 */

import api from './api'
import {
  getPendingOperations,
  removeOperation,
  markOperationError,
} from './offlineQueue'

// Référence au queryClient injectée depuis main.jsx / App.jsx
let _queryClient = null

export function setQueryClient(qc) {
  _queryClient = qc
}

/**
 * Invalide les caches React Query liés aux ressources modifiées.
 * Extrait la ressource depuis l'URL (ex: '/mouvements/' → 'mouvements').
 */
function invalidateRelatedQueries(url) {
  if (!_queryClient) return
  const resource = url.replace(/^\//, '').split('/')[0].replace(/\/$/, '')
  const relatedKeys = {
    mouvements: ['mouvements', 'articles', 'statistiques', 'stock-bas'],
    articles: ['articles', 'statistiques', 'stock-bas'],
    categories: ['categories', 'categories-tree'],
    fournisseurs: ['fournisseurs'],
    emplacements: ['emplacements'],
    tags: ['tags'],
    commandes: ['commandes'],
  }
  const keys = relatedKeys[resource] || [resource]
  keys.forEach((key) => _queryClient.invalidateQueries({ queryKey: [key] }))
}

/**
 * Rejoue une seule opération en attente.
 * Retourne true si réussie, false sinon.
 */
async function replayOperation(op) {
  try {
    const config = { method: op.method, url: op.url }
    if (op.data) config.data = op.data

    await api.request(config)
    await removeOperation(op.id)
    invalidateRelatedQueries(op.url)
    return true
  } catch (error) {
    const msg =
      error.response?.data?.detail ||
      error.message ||
      'Erreur lors de la synchronisation'
    await markOperationError(op.id, msg)
    return false
  }
}

/**
 * Synchronise toutes les opérations en attente.
 * Retourne un objet { synced, failed, errors }.
 */
export async function syncPendingOperations() {
  const pending = await getPendingOperations()
  if (pending.length === 0) return { synced: 0, failed: 0, errors: [] }

  let synced = 0
  let failed = 0
  const errors = []

  for (const op of pending) {
    const ok = await replayOperation(op)
    if (ok) {
      synced++
    } else {
      failed++
      errors.push(op)
    }
  }

  return { synced, failed, errors }
}

/**
 * Lance la synchronisation automatique dès la reconnexion.
 * À appeler une seule fois au démarrage de l'app.
 */
export function startAutoSync(onSyncComplete) {
  window.addEventListener('online', async () => {
    const result = await syncPendingOperations()
    if (onSyncComplete) onSyncComplete(result)
  })
}
