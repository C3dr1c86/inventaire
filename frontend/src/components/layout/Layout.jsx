/**
 * Composant Layout - Structure principale de l'application.
 *
 * Contient le sidebar de navigation et la zone de contenu principale.
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  ArrowRightLeft,
  FileText,
  Menu,
  LogOut
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logoutUser } = useAuth()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
    toast.info('Déconnexion réussie')
  }

  // Navigation items
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/articles', icon: Package, label: 'Articles' },
    { path: '/categories', icon: Layers, label: 'Catégories' },
    { path: '/tags', icon: Tag, label: 'Tags' },
    { path: '/mouvements', icon: ArrowRightLeft, label: 'Mouvements' },
    { path: '/rapports', icon: FileText, label: 'Rapports' },
  ]

  // Vérifier si un lien est actif
  const isActive = (path) => location.pathname === path

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            📦 Inventaire
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            Gestion de stock
          </p>
        </div>

        <nav>
          <ul className="nav-menu">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="nav-icon" size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          {/* Informations utilisateur */}
          <div style={{
            padding: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '1rem'
          }}>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>
              Connecté en tant que
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {user?.username}
            </p>
          </div>

          {/* Bouton déconnexion */}
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              gap: '0.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <LogOut size={18} />
            Déconnexion
          </button>

          {/* Version */}
          <div style={{ marginTop: '1rem', opacity: 0.6, fontSize: '0.75rem', textAlign: 'center' }}>
            <p>v1.0.0</p>
            <p>© 2026</p>
          </div>
        </div>
      </aside>

      {/* Overlay pour fermer la sidebar sur mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="main-content">
        {/* Bouton menu mobile */}
        <button
          className="btn btn-secondary mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1001
          }}
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>

        {children}
      </main>
    </div>
  )
}

export default Layout
