/**
 * Configuration Axios pour les appels API.
 *
 * Centralise la configuration HTTP et les intercepteurs.
 * En mode hors-ligne, les requêtes d'écriture (POST/PUT/DELETE)
 * sont placées dans la file d'attente IndexedDB au lieu d'échouer.
 */

import axios from 'axios'
import { getToken, removeToken } from './storageService'
import { enqueueOperation } from './offlineQueue'

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

    // IMPORTANT: Ajouter automatiquement le trailing slash pour les routes racines
    // Ex: /tags -> /tags/ (nécessaire car les routes FastAPI sont définies avec /)
    // Gérer aussi les query parameters : /articles?skip=0 -> /articles/?skip=0
    if (config.url && !config.url.endsWith('/')) {
      // Séparer le chemin et les query parameters
      const [path, queryString] = config.url.split('?')

      // Compter les segments du chemin (ignorer les query params)
      const segments = path.split('/').filter(s => s.length > 0)

      // Ajouter le slash seulement si c'est une route racine (1 segment)
      if (segments.length === 1 && !path.match(/\/\w+\//)) {
        // Reconstruire l'URL avec le slash
        config.url = queryString ? `${path}/?${queryString}` : `${path}/`
      }
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
  async (error) => {
    const method = error.config?.method?.toUpperCase()
    const isWriteOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)
    // Les routes d'auth ne sont jamais mises en file d'attente (login/register nécessitent le réseau)
    const isAuthRoute = error.config?.url?.includes('/auth/')

    /**
     * Tente de parser les données de la requête en JSON.
     * Le login envoie du form-urlencoded (pas du JSON) → on retourne null dans ce cas.
     */
    const parseRequestData = (data) => {
      if (!data) return null
      if (typeof data === 'object') return data
      try {
        return JSON.parse(data)
      } catch {
        return null // form-urlencoded ou autre format non-JSON : non queuable
      }
    }

    // Hors-ligne : mise en file d'attente des opérations d'écriture (hors auth)
    if (!navigator.onLine && isWriteOperation && error.config && !isAuthRoute) {
      await enqueueOperation(method, error.config.url, parseRequestData(error.config.data))

      // Retourner une réponse mock marquée comme "queued" pour ne pas casser l'UI
      return Promise.resolve({
        data: { __queued: true, method, url: error.config.url },
        status: 202,
        statusText: 'Queued',
        headers: {},
        config: error.config,
      })
    }

    // Gestion globale des erreurs réseau
    if (error.response) {
      // Erreur HTTP (4xx, 5xx)
      const message = error.response.data?.detail || error.response.data?.message || 'Une erreur est survenue'
      console.error('Erreur API:', message)

      // Gérer le cas du token invalide ou expiré
      if (error.response.status === 401) {
        removeToken()
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    } else if (error.request) {
      // Pas de réponse du serveur (réseau coupé mais navigator.onLine encore true)
      if (isWriteOperation && error.config && !isAuthRoute) {
        await enqueueOperation(method, error.config.url, parseRequestData(error.config.data))
        return Promise.resolve({
          data: { __queued: true, method, url: error.config.url },
          status: 202,
          statusText: 'Queued',
          headers: {},
          config: error.config,
        })
      }
      console.error('Pas de réponse du serveur')
      error.message = 'Impossible de contacter le serveur. Vérifiez votre connexion.'
      return Promise.reject(error)
    } else {
      console.error('Erreur:', error.message)
      return Promise.reject(error)
    }
  }
)

export default api
