/**
 * Service API pour la gestion des emplacements physiques.
 *
 * Gère les appels API pour le système de localisation physique (3 niveaux : Zone → Étagère → Boîte).
 */

import api from './api'

/**
 * Récupère tous les emplacements (structure plate).
 * @returns {Promise<Array>} Liste de tous les emplacements
 */
export const getEmplacements = async () => {
  const response = await api.get('/emplacements')
  return response.data
}

/**
 * Récupère uniquement les Zones (emplacements racines, parent_id = NULL).
 * Utilisé pour le premier select du triple select cascadé.
 * @returns {Promise<Array>} Liste des Zones uniquement
 */
export const getEmplacementsRacines = async () => {
  const response = await api.get('/emplacements/racines')
  return response.data
}

/**
 * Récupère l'arbre hiérarchique complet (3 niveaux avec children imbriqués).
 * Utilisé pour l'affichage de l'arbre dans la page Emplacements.
 * @returns {Promise<Array>} Arbre des emplacements
 */
export const getEmplacementsTree = async () => {
  const response = await api.get('/emplacements/tree')
  return response.data
}

/**
 * Récupère un emplacement par son ID.
 * @param {number} id - ID de l'emplacement
 * @returns {Promise<Object>} Détails de l'emplacement
 */
export const getEmplacement = async (id) => {
  const response = await api.get(`/emplacements/${id}`)
  return response.data
}

/**
 * Récupère les sous-emplacements directs d'un parent.
 * Utilisé pour charger dynamiquement les étagères ou les boîtes dans le triple select.
 * @param {number} parentId - ID de l'emplacement parent
 * @returns {Promise<Array>} Liste des enfants directs
 */
export const getSousEmplacements = async (parentId) => {
  const response = await api.get(`/emplacements/${parentId}/children`)
  return response.data
}

/**
 * Récupère tous les articles stockés dans un emplacement.
 * @param {number} emplacementId - ID de l'emplacement
 * @param {number} skip - Pagination (nombre d'éléments à sauter)
 * @param {number} limit - Pagination (nombre d'éléments à retourner)
 * @returns {Promise<Array>} Liste des articles de l'emplacement
 */
export const getArticlesByEmplacement = async (emplacementId, skip = 0, limit = 100) => {
  const response = await api.get(`/emplacements/${emplacementId}/articles`, {
    params: { skip, limit }
  })
  return response.data
}

/**
 * Crée un nouvel emplacement.
 * @param {Object} data - Données de l'emplacement
 * @param {string} data.code - Code unique de l'emplacement
 * @param {string} [data.description] - Description (optionnel)
 * @param {number} [data.capacite_max] - Capacité maximale (NULL = illimité)
 * @param {number} [data.parent_id] - ID de l'emplacement parent
 * @returns {Promise<Object>} Emplacement créé
 */
export const createEmplacement = async (data) => {
  const response = await api.post('/emplacements', data)
  return response.data
}

/**
 * Met à jour un emplacement existant.
 * @param {number} id - ID de l'emplacement
 * @param {Object} data - Nouvelles données
 * @returns {Promise<Object>} Emplacement mis à jour
 */
export const updateEmplacement = async (id, data) => {
  const response = await api.put(`/emplacements/${id}`, data)
  return response.data
}

/**
 * Supprime un emplacement.
 * ATTENTION: Bloqué si l'emplacement a des sous-emplacements OU des articles associés.
 * @param {number} id - ID de l'emplacement
 * @returns {Promise<void>}
 */
export const deleteEmplacement = async (id) => {
  const response = await api.delete(`/emplacements/${id}`)
  return response.data
}

/**
 * Récupère l'URL du QR code d'un emplacement pour affichage dans un modal.
 * Utilise l'instance api qui ajoute automatiquement le token JWT.
 * @param {number} emplacementId - ID de l'emplacement
 * @returns {string} URL complète du QR code avec authentification
 */
export const getQRCodeUrl = (emplacementId) => {
  return `${api.defaults.baseURL}/emplacements/${emplacementId}/qrcode`
}

/**
 * Télécharge le QR code d'un emplacement (image PNG) avec authentification.
 * @param {number} emplacementId - ID de l'emplacement
 * @param {string} code - Code de l'emplacement pour le nom du fichier
 */
export const downloadQRCode = async (emplacementId, code) => {
  const response = await api.get(`/emplacements/${emplacementId}/qrcode`, {
    responseType: 'blob'
  })

  // Créer un lien de téléchargement
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `qrcode_${code}.png`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Récupère les suggestions d'emplacements pour un article basé sur sa catégorie.
 * Analyse les emplacements des articles existants de la même catégorie.
 * @param {number} categorieId - ID de la catégorie
 * @param {number} limit - Nombre maximum de suggestions (défaut: 5)
 * @returns {Promise<Array>} Liste de suggestions avec emplacement, count et raison
 */
export const getSuggestionsByCategory = async (categorieId, limit = 5) => {
  const response = await api.get(`/emplacements/suggestions/category/${categorieId}`, {
    params: { limit }
  })
  return response.data
}
