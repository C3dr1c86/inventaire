/**
 * Service pour les opérations sur les tags.
 *
 * Fournit les fonctions pour communiquer avec l'API des tags.
 */

import api from './api'

/**
 * Récupère tous les tags avec pagination
 * @param {Object} params - Paramètres de requête (skip, limit)
 * @returns {Promise<Array>} Liste de tags
 */
export const getTags = async (params = {}) => {
  const response = await api.get('/tags', { params })
  return response.data
}

/**
 * Récupère un tag par son ID
 * @param {number} id - ID du tag
 * @returns {Promise<Object>} Tag
 */
export const getTag = async (id) => {
  const response = await api.get(`/tags/${id}`)
  return response.data
}

/**
 * Crée un nouveau tag
 * @param {Object} data - Données du tag (nom, couleur, description)
 * @returns {Promise<Object>} Tag créé
 */
export const createTag = async (data) => {
  const response = await api.post('/tags', data)
  return response.data
}

/**
 * Met à jour un tag
 * @param {number} id - ID du tag
 * @param {Object} data - Nouvelles données
 * @returns {Promise<Object>} Tag mis à jour
 */
export const updateTag = async (id, data) => {
  const response = await api.put(`/tags/${id}`, data)
  return response.data
}

/**
 * Supprime un tag
 * @param {number} id - ID du tag
 * @returns {Promise<Object>} Message de confirmation
 */
export const deleteTag = async (id) => {
  const response = await api.delete(`/tags/${id}`)
  return response.data
}

/**
 * Associe un tag à un article
 * @param {number} tagId - ID du tag
 * @param {number} articleId - ID de l'article
 * @returns {Promise<Object>} Article mis à jour avec le tag ajouté
 */
export const addTagToArticle = async (tagId, articleId) => {
  const response = await api.post(`/tags/${tagId}/articles/${articleId}`)
  return response.data
}

/**
 * Retire un tag d'un article
 * @param {number} tagId - ID du tag
 * @param {number} articleId - ID de l'article
 * @returns {Promise<Object>} Article mis à jour sans le tag
 */
export const removeTagFromArticle = async (tagId, articleId) => {
  const response = await api.delete(`/tags/${tagId}/articles/${articleId}`)
  return response.data
}
