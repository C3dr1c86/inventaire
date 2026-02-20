/**
 * Composant racine de l'application.
 *
 * Gère le routage entre les différentes pages et l'authentification.
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/layout/Layout'
import OfflineBanner from './components/common/OfflineBanner'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Articles from './pages/Articles'
import Categories from './pages/Categories'
import Emplacements from './pages/Emplacements'
import ScanQRCode from './pages/ScanQRCode'
import PlanAtelier from './pages/PlanAtelier'
import Tags from './pages/Tags'
import Fournisseurs from './pages/Fournisseurs'
import Mouvements from './pages/Mouvements'
import Rapports from './pages/Rapports'
import Commandes from './pages/Commandes'
import NouvelleCommande from './pages/NouvelleCommande'
import Users from './pages/Users'

function App() {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <OfflineBanner />

      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes protégées */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/articles"
          element={
            <ProtectedRoute>
              <Layout>
                <Articles />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Layout>
                <Categories />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/emplacements"
          element={
            <ProtectedRoute>
              <Layout>
                <Emplacements />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan-qrcode"
          element={
            <ProtectedRoute>
              <Layout>
                <ScanQRCode />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan-atelier"
          element={
            <ProtectedRoute>
              <Layout>
                <PlanAtelier />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tags"
          element={
            <ProtectedRoute>
              <Layout>
                <Tags />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fournisseurs"
          element={
            <ProtectedRoute>
              <Layout>
                <Fournisseurs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mouvements"
          element={
            <ProtectedRoute>
              <Layout>
                <Mouvements />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rapports"
          element={
            <ProtectedRoute>
              <Layout>
                <Rapports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/commandes"
          element={
            <ProtectedRoute>
              <Layout>
                <Commandes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/commandes/nouvelle"
          element={
            <ProtectedRoute>
              <Layout>
                <NouvelleCommande />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Route par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
