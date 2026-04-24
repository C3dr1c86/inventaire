import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Home, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import { useCallback } from 'react'
import { toast } from 'react-toastify'

function TC57Layout({ children, title, showBack = true }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logoutUser } = useAuth()

  // Capture globale : tout scan depuis une page TC57 redirige vers le scan
  useBarcodeScanner(
    useCallback((code) => {
      if (location.pathname === '/tc57/scan') return
      navigate(`/tc57/scan?code=${encodeURIComponent(code)}`)
    }, [location.pathname, navigate])
  )

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
    toast.info('Déconnexion réussie')
  }

  return (
    <div className="tc57-shell">
      <header className="tc57-header">
        <div className="tc57-header-left">
          {showBack ? (
            <button className="tc57-btn-icon" onClick={() => navigate(-1)} aria-label="Retour">
              <ArrowLeft size={24} />
            </button>
          ) : (
            <button className="tc57-btn-icon" onClick={() => navigate('/tc57')} aria-label="Accueil TC57">
              <Home size={24} />
            </button>
          )}
        </div>

        <div className="tc57-header-title">{title}</div>

        <div className="tc57-header-right">
          <span className="tc57-header-user">{user?.username}</span>
          <button className="tc57-btn-icon" onClick={handleLogout} aria-label="Déconnexion">
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <main className="tc57-content">
        {children}
      </main>
    </div>
  )
}

export default TC57Layout
