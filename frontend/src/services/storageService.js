/**
 * Service centralisé pour la gestion du stockage local.
 *
 * Encapsule tous les accès à localStorage pour éviter la duplication
 * et faciliter les migrations futures (ex: vers sessionStorage).
 */

const TOKEN_KEY = 'token'

/**
 * Récupère le token JWT du stockage
 * @returns {string|null} Le token ou null s'il n'existe pas
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Sauvegarde le token JWT dans le stockage
 * @param {string} token - Le token JWT à sauvegarder
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Supprime le token JWT du stockage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Vérifie si un token existe dans le stockage
 * @returns {boolean} True si un token existe
 */
export const hasToken = () => {
  return getToken() !== null
}

/**
 * Nettoie tout le stockage (utile pour déconnexion complète)
 */
export const clearAll = () => {
  localStorage.clear()
}
