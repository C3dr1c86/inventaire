/**
 * Service d'authentification.
 *
 * Gère les appels API pour l'inscription, la connexion et la récupération de l'utilisateur.
 */

import api from './api'
import { getToken, setToken, removeToken } from './storageService'

/**
 * Inscrit un nouvel utilisateur.
 *
 * @param {Object} userData - Données de l'utilisateur (username, email, password)
 * @returns {Promise} Données de l'utilisateur créé
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

/**
 * Connecte un utilisateur et retourne le token JWT.
 *
 * @param {Object} credentials - Identifiants (username, password)
 * @returns {Promise} Token d'accès et type de token
 */
export const login = async (credentials) => {
  // Format OAuth2PasswordRequestForm (form-data, pas JSON)
  const formData = new URLSearchParams()
  formData.append('username', credentials.username)
  formData.append('password', credentials.password)

  const response = await api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return response.data
}

/**
 * Récupère les informations de l'utilisateur connecté.
 *
 * @returns {Promise} Données de l'utilisateur
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

/**
 * Déconnecte l'utilisateur en supprimant le token du localStorage.
 */
export const logout = () => {
  removeToken()
}

/**
 * Récupère le token stocké dans le localStorage.
 *
 * @returns {string|null} Token JWT ou null
 */
export const getStoredToken = () => {
  return getToken()
}

/**
 * Stocke le token dans le localStorage.
 *
 * @param {string} token - Token JWT à stocker
 */
export const setStoredToken = (token) => {
  setToken(token)
}
