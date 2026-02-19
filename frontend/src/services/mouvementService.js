/**
 * Service pour les opérations sur les mouvements de stock.
 *
 * Fournit les fonctions pour communiquer avec l'API des mouvements.
 */

import api from './api'

/**
 * Récupère tous les mouvements avec filtres et pagination
 * @param {Object} params - Paramètres de requête (skip, limit, article_id, type_mouvement)
 * @returns {Promise<Object>} Liste paginée de mouvements
 */
export const getMouvements = async (params = {}) => {
  const response = await api.get('/mouvements', { params })
  return response.data
}

/**
 * Récupère un mouvement par son ID
 * @param {number} id - ID du mouvement
 * @returns {Promise<Object>} Mouvement
 */
export const getMouvement = async (id) => {
  const response = await api.get(`/mouvements/${id}`)
  return response.data
}

/**
 * Récupère l'historique des mouvements d'un article
 * @param {number} articleId - ID de l'article
 * @param {Object} params - Paramètres de pagination
 * @returns {Promise<Object>} Liste paginée de mouvements
 */
export const getHistoriqueArticle = async (articleId, params = {}) => {
  const response = await api.get(`/mouvements/article/${articleId}`, { params })
  return response.data
}

/**
 * Crée un nouveau mouvement de stock
 * @param {Object} data - Données du mouvement (article_id, type, quantite, motif)
 * @returns {Promise<Object>} Mouvement créé
 */
export const createMouvement = async (data) => {
  const response = await api.post('/mouvements', data)
  return response.data
}

/**
 * Supprime un mouvement de l'historique
 * Note : Le stock de l'article n'est PAS modifié
 * @param {number} id - ID du mouvement
 * @returns {Promise<Object>} Message de confirmation
 */
export const deleteMouvement = async (id) => {
  const response = await api.delete(`/mouvements/${id}`)
  return response.data
}
