/**
 * Composant ProtectedRoute - Protège les routes nécessitant une authentification.
 *
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Afficher un loader pendant le chargement de l'état d'authentification
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-light)'
      }}>
        <div className="loader"></div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers login
  if (!user) {
    // Sauvegarder la destination pour rediriger après connexion
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Utilisateur authentifié : afficher le contenu protégé
  return children
}

export default ProtectedRoute
