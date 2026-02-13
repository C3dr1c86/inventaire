/**
 * Hook personnalisé pour gérer les permissions utilisateur.
 *
 * Fournit des fonctions helpers pour vérifier facilement les permissions.
 */

import { useAuth } from '../contexts/AuthContext'

/**
 * Hook pour vérifier les permissions de l'utilisateur.
 *
 * @returns {Object} Fonctions et propriétés de permissions
 */
export function usePermissions() {
  const { hasPermission, role } = useAuth()

  return {
    // Fonction de base
    hasPermission,

    // Vérifications de rôle
    isAdmin: role === 'admin',
    isGestionnaire: role === 'gestionnaire',
    isTechnicien: role === 'technicien',
    isConsultation: role === 'consultation',

    // Helpers pour actions courantes
    canCreate: (resource) => hasPermission(resource, 'create'),
    canRead: (resource) => hasPermission(resource, 'read'),
    canUpdate: (resource) => hasPermission(resource, 'update'),
    canDelete: (resource) => hasPermission(resource, 'delete'),
    canExport: (resource) => hasPermission(resource, 'export')
  }
}
