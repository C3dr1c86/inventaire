/**
 * Service pour les opérations sur les articles.
 *
 * Fournit les fonctions pour communiquer avec l'API des articles.
 */

import api from './api'

/**
 * Récupère tous les articles avec filtres et pagination
 * @param {Object} params - Paramètres de requête (skip, limit, search, categorie_id, stock_bas)
 * @returns {Promise<Object>} Liste paginée d'articles
 */
export const getArticles = async (params = {}) => {
  const response = await api.get('/articles', { params })
  return response.data
}

/**
 * Récupère un article par son ID
 * @param {number} id - ID de l'article
 * @returns {Promise<Object>} Article
 */
export const getArticle = async (id) => {
  const response = await api.get(`/articles/${id}`)
  return response.data
}

/**
 * Crée un nouvel article
 * @param {Object} data - Données de l'article
 * @returns {Promise<Object>} Article créé
 */
export const createArticle = async (data) => {
  const response = await api.post('/articles', data)
  return response.data
}

/**
 * Met à jour un article
 * @param {number} id - ID de l'article
 * @param {Object} data - Nouvelles données
 * @returns {Promise<Object>} Article mis à jour
 */
export const updateArticle = async (id, data) => {
  const response = await api.put(`/articles/${id}`, data)
  return response.data
}

/**
 * Supprime un article
 * @param {number} id - ID de l'article
 * @returns {Promise<Object>} Message de confirmation
 */
export const deleteArticle = async (id) => {
  const response = await api.delete(`/articles/${id}`)
  return response.data
}
