/**
 * Service utilisateurs.
 *
 * Gère les appels API pour la gestion des utilisateurs (admin only).
 */

import api from './api'

/**
 * Récupère la liste de tous les utilisateurs.
 *
 * @returns {Promise} Liste des utilisateurs
 */
export const getUsers = async () => {
  const response = await api.get('/users')
  return response.data
}

/**
 * Récupère un utilisateur par son ID.
 *
 * @param {number} id - ID de l'utilisateur
 * @returns {Promise} Données de l'utilisateur
 */
export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`)
  return response.data
}

/**
 * Crée un nouvel utilisateur avec un rôle spécifique (admin only).
 *
 * @param {Object} userData - Données de l'utilisateur (username, email, password, role)
 * @returns {Promise} Utilisateur créé
 */
export const createUser = async (userData) => {
  const response = await api.post('/users', userData)
  return response.data
}

/**
 * Change le rôle d'un utilisateur.
 *
 * @param {number} userId - ID de l'utilisateur
 * @param {string} role - Nouveau rôle (admin, gestionnaire, technicien, consultation)
 * @returns {Promise} Utilisateur mis à jour
 */
export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/users/${userId}/role`, { role })
  return response.data
}

/**
 * Met à jour les permissions custom d'un utilisateur.
 *
 * @param {number} userId - ID de l'utilisateur
 * @param {Array<string>} permissions - Liste de permissions (format "resource:action") ou null
 * @returns {Promise} Utilisateur mis à jour
 */
export const updateUserPermissions = async (userId, permissions) => {
  const response = await api.put(`/users/${userId}/permissions`, { permissions })
  return response.data
}

/**
 * Désactive un utilisateur (is_active = false).
 *
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise} Utilisateur désactivé
 */
export const deactivateUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`)
  return response.data
}

/**
 * Réactive un utilisateur (is_active = true).
 *
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise} Utilisateur réactivé
 */
export const reactivateUser = async (userId) => {
  const response = await api.post(`/users/${userId}/reactivate`)
  return response.data
}
