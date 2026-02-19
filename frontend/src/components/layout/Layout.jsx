/**
 * Composant Layout - Structure principale de l'application.
 *
 * Contient la sidebar de navigation, le header fixe et la zone de contenu.
 * Conforme à la charte graphique : aucun style inline.
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
  Sun,
  ChevronLeft,
  ChevronRight,
  Warehouse,
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

// Titre affiché dans le header selon la route
const PAGE_TITLES = {
  '/dashboard':        { title: 'Tableau de bord',  subtitle: 'Vue d\'ensemble de votre inventaire' },
  '/articles':         { title: 'Articles',          subtitle: 'Gestion du catalogue produits' },
  '/categories':       { title: 'Catégories',        subtitle: 'Organisation hiérarchique' },
  '/emplacements':     { title: 'Emplacements',      subtitle: 'Gestion des zones de stockage' },
  '/scan-qrcode':      { title: 'Scanner QR Code',   subtitle: 'Identification par code-barres' },
  '/plan-atelier':     { title: 'Plan atelier',      subtitle: 'Visualisation des zones' },
  '/tags':             { title: 'Tags',              subtitle: 'Étiquettes et catégorisation' },
  '/fournisseurs':     { title: 'Fournisseurs',      subtitle: 'Gestion des partenaires' },
  '/commandes':        { title: 'Commandes',         subtitle: 'Suivi des commandes' },
  '/commandes/nouvelle': { title: 'Nouvelle commande', subtitle: 'Créer une commande' },
  '/mouvements':       { title: 'Mouvements',        subtitle: 'Historique des entrées / sorties' },
  '/rapports':         { title: 'Rapports',          subtitle: 'Analyses et exports' },
  '/users':            { title: 'Utilisateurs',      subtitle: 'Gestion des comptes et permissions' },
}

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { user, role, hasPermission, logoutUser } = useAuth()

  // Thème clair/sombre persisté dans localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Fermer la sidebar mobile au changement de route
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
    toast.info('Déconnexion réussie')
  }

  // Navigation items avec permissions requises
  const navItems = [
    { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/articles',   icon: Package,         label: 'Articles',     permission: { resource: 'articles',     action: 'read' } },
    { path: '/categories', icon: Layers,          label: 'Catégories',   permission: { resource: 'categories',   action: 'read' } },
    { path: '/emplacements', icon: MapPin,         label: 'Emplacements', permission: { resource: 'emplacements', action: 'read' } },
    { path: '/scan-qrcode',  icon: ScanLine,       label: 'Scanner QR' },
    { path: '/tags',         icon: Tag,            label: 'Tags',         permission: { resource: 'tags',         action: 'read' } },
    { path: '/fournisseurs', icon: Truck,          label: 'Fournisseurs', permission: { resource: 'fournisseurs', action: 'read' } },
    { path: '/commandes',    icon: ShoppingCart,   label: 'Commandes',    permission: { resource: 'commandes',    action: 'read' } },
    { path: '/mouvements',   icon: ArrowRightLeft, label: 'Mouvements',   permission: { resource: 'mouvements',   action: 'read' } },
    { path: '/rapports',     icon: FileText,       label: 'Rapports',     permission: { resource: 'rapports',     action: 'read' } },
    { path: '/users',        icon: Users,          label: 'Utilisateurs', permission: { resource: 'users',        action: 'read' } },
  ]

  // Filtrer selon les permissions
  const visibleNavItems = useMemo(() => {
    return navItems.filter(item => {
      if (!item.permission) return true
      return hasPermission(item.permission.resource, item.permission.action)
    })
  }, [hasPermission])

  // Items du bottom nav (4 premiers)
  const maxBottomItems = 4
  const bottomNavItems = visibleNavItems.slice(0, maxBottomItems)
  const hasOverflowItems = visibleNavItems.length > maxBottomItems

  const isActive = (path) => location.pathname === path

  // Titre du header selon la route courante
  const currentPage = PAGE_TITLES[location.pathname] || { title: 'Inventaire', subtitle: '' }

  return (
    <div className="app-shell">
      {/* ================================================================
          SIDEBAR
          ================================================================ */}
      <aside
        className={[
          'sidebar',
          collapsed   ? 'collapsed'    : '',
          sidebarOpen ? 'mobile-open'  : '',
        ].filter(Boolean).join(' ')}
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true">
            <Warehouse size={20} />
          </div>
          <span className="sidebar-logo-text">Inventaire</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Menu">
          <div className="sidebar-section">
            <div className="sidebar-section-label" aria-hidden="true">Navigation</div>
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-item-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="sidebar-item-label">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer : utilisateur + thème + collapse */}
        <div className="sidebar-footer">
          {/* Infos utilisateur */}
          <div className="sidebar-user">
            <div className="sidebar-item-icon" aria-hidden="true">
              <Users size={18} />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.username}</div>
              {role && (
                <span className={`sidebar-user-role ${role}`}>
                  {role}
                </span>
              )}
            </div>
          </div>

          {/* Toggle thème */}
          <button
            onClick={toggleTheme}
            className="sidebar-item"
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            <span className="sidebar-item-icon" aria-hidden="true">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            <span className="sidebar-item-label">
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </span>
          </button>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="sidebar-item"
            aria-label="Se déconnecter"
          >
            <span className="sidebar-item-icon" aria-hidden="true">
              <LogOut size={18} />
            </span>
            <span className="sidebar-item-label">Déconnexion</span>
          </button>

          {/* Collapse (desktop uniquement) */}
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(prev => !prev)}
            aria-label={collapsed ? 'Déplier la sidebar' : 'Replier la sidebar'}
            title={collapsed ? 'Déplier' : 'Replier'}
          >
            <span className="sidebar-item-icon" aria-hidden="true">
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </span>
            <span className="sidebar-item-label">Réduire</span>
          </button>

          {/* Version */}
          <div className="sidebar-version">
            v1.9.16 · © 2026
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================================================================
          HEADER (fixe en haut)
          ================================================================ */}
      <header
        className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}
        role="banner"
      >
        <div className="header-left">
          {/* Hamburger — visible en tablet (768px) et masqué sous 576px (bottom nav) */}
          <button
            className="btn btn-ghost btn-icon mobile-menu-btn"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>

          <div>
            <div className="header-page-title">{currentPage.title}</div>
          </div>
        </div>

        <div className="header-right">
          <span className="text-muted text-sm">{user?.username}</span>
        </div>
      </header>

      {/* ================================================================
          CONTENU PRINCIPAL
          ================================================================ */}
      <main
        className={`main-content-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}
        id="main-content"
      >
        {children}
      </main>

      {/* ================================================================
          BOTTOM NAV MOBILE (≤576px)
          ================================================================ */}
      <nav className="bottom-nav" aria-label="Navigation mobile">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
              aria-label={item.label}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
        {hasOverflowItems && (
          <button
            className={`bottom-nav-item ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Plus de navigation"
          >
            <Menu size={22} aria-hidden="true" />
            <span>Plus</span>
          </button>
        )}
      </nav>
    </div>
  )
}

export default Layout
