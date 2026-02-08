/**
 * Service pour les opérations sur les catégories.
 *
 * Fournit les fonctions pour communiquer avec l'API des catégories.
 */

import api from './api'

/**
 * Récupère toutes les catégories
 * @returns {Promise<Array>} Liste des catégories
 */
export const getCategories = async () => {
  const response = await api.get('/categories')
  return response.data
}

/**
 * Récupère une catégorie par son ID
 * @param {number} id - ID de la catégorie
 * @returns {Promise<Object>} Catégorie
 */
export const getCategorie = async (id) => {
  const response = await api.get(`/categories/${id}`)
  return response.data
}

/**
 * Crée une nouvelle catégorie
 * @param {Object} data - Données de la catégorie
 * @returns {Promise<Object>} Catégorie créée
 */
export const createCategorie = async (data) => {
  const response = await api.post('/categories', data)
  return response.data
}

/**
 * Met à jour une catégorie
 * @param {number} id - ID de la catégorie
 * @param {Object} data - Nouvelles données
 * @returns {Promise<Object>} Catégorie mise à jour
 */
export const updateCategorie = async (id, data) => {
  const response = await api.put(`/categories/${id}`, data)
  return response.data
}

/**
 * Supprime une catégorie
 * @param {number} id - ID de la catégorie
 * @returns {Promise<Object>} Message de confirmation
 */
export const deleteCategorie = async (id) => {
  const response = await api.delete(`/categories/${id}`)
  return response.data
}

/**
 * Récupère uniquement les catégories racines (sans parent)
 * @returns {Promise<Array>} Liste des catégories racines
 */
export const getCategoriesRacines = async () => {
  const response = await api.get('/categories/racines')
  return response.data
}

/**
 * Récupère l'arbre complet des catégories avec sous-catégories
 * @returns {Promise<Array>} Arbre hiérarchique des catégories
 */
export const getCategoriesTree = async () => {
  const response = await api.get('/categories/tree')
  return response.data
}

/**
 * Récupère les sous-catégories d'une catégorie parente
 * @param {number} parentId - ID de la catégorie parente
 * @returns {Promise<Array>} Liste des sous-catégories
 */
export const getSousCategories = async (parentId) => {
  const response = await api.get(`/categories/${parentId}/children`)
  return response.data
}
