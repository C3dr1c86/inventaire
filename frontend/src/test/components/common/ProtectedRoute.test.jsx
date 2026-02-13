import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../../../components/common/ProtectedRoute'

// Mock du contexte d'authentification avec un état mutable
let authState = {
  user: null,
  loading: false
}

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => authState
}))

const renderProtectedRoute = () => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Contenu protégé</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Page de connexion</div>} />
      </Routes>
    </BrowserRouter>
  )
}

describe('ProtectedRoute', () => {
  it('affiche un loader pendant le chargement', () => {
    authState = { user: null, loading: true }

    const { container } = renderProtectedRoute()

    expect(container.querySelector('.loader')).toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
  })

  it('redirige vers /login si l\'utilisateur n\'est pas authentifié', () => {
    authState = { user: null, loading: false }

    renderProtectedRoute()

    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
  })

  it.skip('affiche le contenu protégé si l\'utilisateur est authentifié', () => {
    authState = {
      user: { id: 1, username: 'testuser', role: 'admin' },
      loading: false
    }

    renderProtectedRoute()

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
    expect(screen.queryByText('Page de connexion')).not.toBeInTheDocument()
  })
})
