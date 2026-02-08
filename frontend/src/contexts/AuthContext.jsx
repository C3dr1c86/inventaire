/**
 * Contexte d'authentification.
 *
 * Gère l'état global de l'authentification de l'utilisateur.
 */

import { createContext, useState, useEffect, useContext } from 'react'
import { login, getCurrentUser, logout, getStoredToken, setStoredToken } from '../services/authService'

const AuthContext = createContext()

/**
 * Provider du contexte d'authentification.
 *
 * Enveloppe l'application pour fournir l'état d'authentification à tous les composants.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Charger l'utilisateur au montage si un token existe
  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      getCurrentUser()
        .then((userData) => {
          setUser(userData)
        })
        .catch(() => {
          // Token invalide ou expiré
          logout()
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  /**
   * Connecte un utilisateur.
   *
   * @param {Object} credentials - Identifiants (username, password)
   */
  const loginUser = async (credentials) => {
    const { access_token } = await login(credentials)
    setStoredToken(access_token)
    const userData = await getCurrentUser()
    setUser(userData)
  }

  /**
   * Déconnecte l'utilisateur.
   */
  const logoutUser = () => {
    logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte d'authentification.
 *
 * @returns {Object} Contexte d'authentification (user, loading, loginUser, logoutUser)
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider')
  }
  return context
}
