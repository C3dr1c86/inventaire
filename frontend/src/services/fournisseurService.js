/**
 * Service pour les opérations sur les fournisseurs.
 *
 * Fournit les fonctions pour communiquer avec l'API des fournisseurs.
 */

import api from './api'

/**
 * Récupère tous les fournisseurs avec pagination
 * @param {Object} params - Paramètres de requête (skip, limit)
 * @returns {Promise<Array>} Liste de fournisseurs
 */
export const getFournisseurs = async (params = {}) => {
  const response = await api.get('/fournisseurs', { params })
  return response.data
}

/**
 * Récupère un fournisseur par son ID
 * @param {number} id - ID du fournisseur
 * @returns {Promise<Object>} Fournisseur
 */
export const getFournisseur = async (id) => {
  const response = await api.get(`/fournisseurs/${id}`)
  return response.data
}

/**
 * Crée un nouveau fournisseur
 * @param {Object} data - Données du fournisseur (nom, contact, email, téléphone, adresse, site_web, description)
 * @returns {Promise<Object>} Fournisseur créé
 */
export const createFournisseur = async (data) => {
  const response = await api.post('/fournisseurs', data)
  return response.data
}

/**
 * Met à jour un fournisseur
 * @param {number} id - ID du fournisseur
 * @param {Object} data - Nouvelles données
 * @returns {Promise<Object>} Fournisseur mis à jour
 */
export const updateFournisseur = async (id, data) => {
  const response = await api.put(`/fournisseurs/${id}`, data)
  return response.data
}

/**
 * Supprime un fournisseur
 * @param {number} id - ID du fournisseur
 * @returns {Promise<Object>} Message de confirmation
 */
export const deleteFournisseur = async (id) => {
  const response = await api.delete(`/fournisseurs/${id}`)
  return response.data
}

/**
 * Associe un fournisseur à un article
 * @param {number} fournisseurId - ID du fournisseur
 * @param {number} articleId - ID de l'article
 * @returns {Promise<Object>} Article mis à jour avec le fournisseur ajouté
 */
export const addFournisseurToArticle = async (fournisseurId, articleId) => {
  const response = await api.post(`/fournisseurs/${fournisseurId}/articles/${articleId}`)
  return response.data
}

/**
 * Retire un fournisseur d'un article
 * @param {number} fournisseurId - ID du fournisseur
 * @param {number} articleId - ID de l'article
 * @returns {Promise<Object>} Article mis à jour sans le fournisseur
 */
export const removeFournisseurFromArticle = async (fournisseurId, articleId) => {
  const response = await api.delete(`/fournisseurs/${fournisseurId}/articles/${articleId}`)
  return response.data
}

/**
 * Récupère tous les articles d'un fournisseur
 * @param {number} fournisseurId - ID du fournisseur
 * @param {Object} params - Paramètres de requête (skip, limit)
 * @returns {Promise<Array>} Liste des articles du fournisseur
 */
export const getArticlesByFournisseur = async (fournisseurId, params = {}) => {
  const response = await api.get(`/fournisseurs/${fournisseurId}/articles`, { params })
  return response.data
}
