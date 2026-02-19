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
  MapPin,
  ScanLine,
  Tag,
  Truck,
  ArrowRightLeft,
  FileText,
  ShoppingCart,
  Menu,
  LogOut,
  Users,
  Moon,
  Sun
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, role, hasPermission, logoutUser } = useAuth()

  // Thème clair/sombre persisté dans localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
    toast.info('Déconnexion réussie')
  }

  // Couleurs des badges de rôles
  const roleBadgeColors = {
    admin: '#8b5cf6',
    gestionnaire: '#3b82f6',
    technicien: '#10b981',
    consultation: '#6b7280'
  }

  // Navigation items avec permissions requises
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/articles', icon: Package, label: 'Articles', permission: { resource: 'articles', action: 'read' } },
    { path: '/categories', icon: Layers, label: 'Catégories', permission: { resource: 'categories', action: 'read' } },
    { path: '/emplacements', icon: MapPin, label: 'Emplacements', permission: { resource: 'emplacements', action: 'read' } },
    { path: '/scan-qrcode', icon: ScanLine, label: 'Scanner QR' },
    { path: '/tags', icon: Tag, label: 'Tags', permission: { resource: 'tags', action: 'read' } },
    { path: '/fournisseurs', icon: Truck, label: 'Fournisseurs', permission: { resource: 'fournisseurs', action: 'read' } },
    { path: '/commandes', icon: ShoppingCart, label: 'Commandes', permission: { resource: 'commandes', action: 'read' } },
    { path: '/mouvements', icon: ArrowRightLeft, label: 'Mouvements', permission: { resource: 'mouvements', action: 'read' } },
    { path: '/rapports', icon: FileText, label: 'Rapports', permission: { resource: 'rapports', action: 'read' } },
    { path: '/users', icon: Users, label: 'Utilisateurs', permission: { resource: 'users', action: 'read' } },
  ]

  // Filtrer les items de navigation selon les permissions
  const visibleNavItems = useMemo(() => {
    return navItems.filter(item => {
      if (!item.permission) return true
      return hasPermission(item.permission.resource, item.permission.action)
    })
  }, [hasPermission])

  // Items du bottom nav (4 premiers + bouton "Plus" si nécessaire)
  const maxBottomItems = 4
  const bottomNavItems = visibleNavItems.slice(0, maxBottomItems)
  const hasOverflowItems = visibleNavItems.length > maxBottomItems

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
            {visibleNavItems.map((item) => {
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
            <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {user?.username}
            </p>
            {role && (
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                borderRadius: '0.25rem',
                backgroundColor: roleBadgeColors[role] || '#6b7280',
                color: '#fff',
                fontWeight: 500,
                textTransform: 'capitalize'
              }}>
                {role}
              </span>
            )}
          </div>

          {/* Toggle thème */}
          <button
            onClick={toggleTheme}
            className="btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              gap: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          </button>

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
            <p>v1.9.16</p>
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
        {/* Bouton menu mobile (affiché seulement si bottom nav est absent, i.e. >576px) */}
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

      {/* Barre de navigation mobile (bottom nav) */}
      <nav className="bottom-nav">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          )
        })}
        {hasOverflowItems && (
          <button
            className={`bottom-nav-item ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(prev => !prev)}
          >
            <Menu size={22} />
            <span>Plus</span>
          </button>
        )}
      </nav>
    </div>
  )
}

export default Layout
