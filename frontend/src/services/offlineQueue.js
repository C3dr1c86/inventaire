/**
 * File d'attente hors-ligne via IndexedDB (Dexie.js).
 *
 * Stocke les opérations POST/PUT/DELETE effectuées sans réseau
 * pour les rejouer à la reconnexion.
 *
 * Structure d'une opération :
 *   { id, method, url, data, timestamp, status: 'pending'|'error', errorMessage }
 */

import Dexie from 'dexie'

// Base IndexedDB dédiée à la file hors-ligne
const db = new Dexie('inventaire-offline')
db.version(1).stores({
  pendingOperations: '++id, method, url, timestamp, status',
})

/**
 * Ajoute une opération à la file d'attente.
 * @param {string} method  - 'POST' | 'PUT' | 'DELETE'
 * @param {string} url     - URL relative de l'API (ex: '/mouvements/')
 * @param {object} data    - Corps de la requête (ou null pour DELETE)
 * @returns {Promise<number>} L'id de l'opération créée
 */
export async function enqueueOperation(method, url, data = null) {
  return db.pendingOperations.add({
    method,
    url,
    data,
    timestamp: new Date().toISOString(),
    status: 'pending',
    errorMessage: null,
  })
}

/**
 * Retourne toutes les opérations en attente (status = 'pending').
 */
export async function getPendingOperations() {
  return db.pendingOperations.where('status').equals('pending').toArray()
}

/**
 * Retourne le nombre d'opérations en attente.
 */
export async function countPendingOperations() {
  return db.pendingOperations.where('status').equals('pending').count()
}

/**
 * Retourne toutes les opérations (pending + error) pour affichage dans l'UI.
 */
export async function getAllQueuedOperations() {
  return db.pendingOperations.orderBy('timestamp').toArray()
}

/**
 * Supprime une opération de la file (après sync réussie).
 */
export async function removeOperation(id) {
  return db.pendingOperations.delete(id)
}

/**
 * Marque une opération comme en erreur.
 */
export async function markOperationError(id, errorMessage) {
  return db.pendingOperations.update(id, {
    status: 'error',
    errorMessage,
  })
}

/**
 * Remet une opération en état 'pending' pour la rejouer.
 */
export async function retryOperation(id) {
  return db.pendingOperations.update(id, {
    status: 'pending',
    errorMessage: null,
  })
}

/**
 * Supprime toutes les opérations en erreur.
 */
export async function clearErrors() {
  return db.pendingOperations.where('status').equals('error').delete()
}

export default db
