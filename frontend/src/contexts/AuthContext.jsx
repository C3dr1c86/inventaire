/**
 * Contexte d'authentification.
 *
 * Gère l'état global de l'authentification de l'utilisateur avec permissions.
 */

import { createContext, useState, useEffect, useContext, useCallback } from 'react'
import { login, getCurrentUser, logout, getStoredToken, setStoredToken } from '../services/authService'

const AuthContext = createContext()

/**
 * Provider du contexte d'authentification.
 *
 * Enveloppe l'application pour fournir l'état d'authentification à tous les composants.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  // Charger l'utilisateur au montage si un token existe
  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      getCurrentUser()
        .then((userData) => {
          setUser(userData)
          setRole(userData.role)
          setPermissions(userData.permissions || [])
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
   * Vérifie si l'utilisateur a une permission spécifique.
   *
   * @param {string} resource - Ressource (ex: "articles", "users")
   * @param {string} action - Action (ex: "read", "create", "update", "delete")
   * @returns {boolean} True si l'utilisateur a la permission
   */
  const hasPermission = useCallback((resource, action) => {
    if (!permissions.length) return false

    const permissionString = `${resource}:${action}`
    const wildcardResource = `${resource}:*`
    const wildcardAll = '*:*'

    return permissions.includes(permissionString) ||
           permissions.includes(wildcardResource) ||
           permissions.includes(wildcardAll)
  }, [permissions])

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
    setRole(userData.role)
    setPermissions(userData.permissions || [])
  }

  /**
   * Déconnecte l'utilisateur.
   */
  const logoutUser = () => {
    logout()
    setUser(null)
    setRole(null)
    setPermissions([])
  }

  return (
    <AuthContext.Provider value={{ user, role, permissions, hasPermission, loading, loginUser, logoutUser }}>
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
