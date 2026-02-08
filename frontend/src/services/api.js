/**
 * Configuration Axios pour les appels API.
 *
 * Centralise la configuration HTTP et les intercepteurs.
 */

import axios from 'axios'
import { getToken, removeToken } from './storageService'

// Obtenir l'URL de l'API depuis la config runtime (Docker) ou depuis Vite (dev)
const getApiUrl = () => {
  // En production Docker, window.ENV est défini par docker-entrypoint.sh
  if (window.ENV && window.ENV.VITE_API_URL) {
    return window.ENV.VITE_API_URL
  }
  // En développement, utiliser la variable d'environnement Vite
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
}

// Créer l'instance Axios avec configuration de base
const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur de requêtes - Ajoute le token JWT automatiquement
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur de réponses - Gère les erreurs et les tokens expirés
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Gestion globale des erreurs
    if (error.response) {
      // Erreur HTTP (4xx, 5xx)
      const message = error.response.data?.detail || error.response.data?.message || 'Une erreur est survenue'
      console.error('Erreur API:', message)

      // Gérer le cas du token invalide ou expiré
      if (error.response.status === 401) {
        // Token invalide ou expiré : déconnecter l'utilisateur
        removeToken()
        // Rediriger vers la page de connexion si on n'y est pas déjà
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login'
        }
      }

      // Garder la structure de l'erreur pour que les composants puissent accéder à error.response
      return Promise.reject(error)
    } else if (error.request) {
      // Pas de réponse du serveur
      console.error('Pas de réponse du serveur')
      error.message = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.'
      return Promise.reject(error)
    } else {
      // Erreur de configuration de la requête
      console.error('Erreur:', error.message)
      return Promise.reject(error)
    }
  }
)

export default api
