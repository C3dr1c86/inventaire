import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from '../../hooks/usePermissions'
import { AuthProvider } from '../../contexts/AuthContext'
import * as authService from '../../services/authService'

// Mock authService
vi.mock('../../services/authService', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  logout: vi.fn()
}))

// Créer un wrapper personnalisé avec un user spécifique
const createWrapperWithUser = (user) => {
  authService.getStoredToken.mockReturnValue(user ? 'fake-token' : null)
  authService.getCurrentUser.mockResolvedValue(user)

  return ({ children }) => <AuthProvider>{children}</AuthProvider>
}

describe('usePermissions', () => {
  it('retourne isAdmin = true pour un utilisateur admin', async () => {
    const adminUser = {
      id: 1,
      username: 'admin',
      role: 'admin',
      permissions: ['*:*']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(adminUser)
    })

    // Attendre que le hook se stabilise
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isGestionnaire).toBe(false)
    expect(result.current.isTechnicien).toBe(false)
    expect(result.current.isConsultation).toBe(false)
  })

  it('retourne isGestionnaire = true pour un utilisateur gestionnaire', async () => {
    const gestionnaireUser = {
      id: 2,
      username: 'gest',
      role: 'gestionnaire',
      permissions: ['articles:*', 'categories:*']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(gestionnaireUser)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isGestionnaire).toBe(true)
    expect(result.current.isTechnicien).toBe(false)
    expect(result.current.isConsultation).toBe(false)
  })

  it('retourne isTechnicien = true pour un utilisateur technicien', async () => {
    const technicienUser = {
      id: 3,
      username: 'tech',
      role: 'technicien',
      permissions: ['articles:read', 'mouvements:create']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(technicienUser)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isGestionnaire).toBe(false)
    expect(result.current.isTechnicien).toBe(true)
    expect(result.current.isConsultation).toBe(false)
  })

  it('retourne isConsultation = true pour un utilisateur consultation', async () => {
    const consultationUser = {
      id: 4,
      username: 'consult',
      role: 'consultation',
      permissions: ['articles:read', 'categories:read']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(consultationUser)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isGestionnaire).toBe(false)
    expect(result.current.isTechnicien).toBe(false)
    expect(result.current.isConsultation).toBe(true)
  })

  it('canCreate vérifie la permission create', async () => {
    const user = {
      id: 1,
      username: 'gest',
      role: 'gestionnaire',
      permissions: ['articles:create', 'articles:read']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(user)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.canCreate('articles')).toBe(true)
    expect(result.current.canCreate('users')).toBe(false)
  })

  it('canRead vérifie la permission read', async () => {
    const user = {
      id: 1,
      username: 'consult',
      role: 'consultation',
      permissions: ['articles:read', 'categories:read']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(user)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.canRead('articles')).toBe(true)
    expect(result.current.canRead('categories')).toBe(true)
    expect(result.current.canRead('users')).toBe(false)
  })

  it('canUpdate vérifie la permission update', async () => {
    const user = {
      id: 1,
      username: 'gest',
      role: 'gestionnaire',
      permissions: ['articles:update']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(user)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.canUpdate('articles')).toBe(true)
    expect(result.current.canUpdate('categories')).toBe(false)
  })

  it('canDelete vérifie la permission delete', async () => {
    const user = {
      id: 1,
      username: 'gest',
      role: 'gestionnaire',
      permissions: ['articles:delete']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(user)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.canDelete('articles')).toBe(true)
    expect(result.current.canDelete('users')).toBe(false)
  })

  it('canExport vérifie la permission export', async () => {
    const user = {
      id: 1,
      username: 'gest',
      role: 'gestionnaire',
      permissions: ['rapports:export']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(user)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.canExport('rapports')).toBe(true)
    expect(result.current.canExport('articles')).toBe(false)
  })

  it('admin a toutes les permissions avec wildcard *:*', async () => {
    const adminUser = {
      id: 1,
      username: 'admin',
      role: 'admin',
      permissions: ['*:*']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(adminUser)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    // Admin peut tout faire
    expect(result.current.canCreate('articles')).toBe(true)
    expect(result.current.canRead('users')).toBe(true)
    expect(result.current.canUpdate('categories')).toBe(true)
    expect(result.current.canDelete('anything')).toBe(true)
    expect(result.current.canExport('rapports')).toBe(true)
  })

  it('wildcard resource:* accorde toutes les actions sur cette ressource', async () => {
    const user = {
      id: 1,
      username: 'gest',
      role: 'gestionnaire',
      permissions: ['articles:*']
    }

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapperWithUser(user)
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    // Toutes les actions sur articles
    expect(result.current.canCreate('articles')).toBe(true)
    expect(result.current.canRead('articles')).toBe(true)
    expect(result.current.canUpdate('articles')).toBe(true)
    expect(result.current.canDelete('articles')).toBe(true)
    expect(result.current.canExport('articles')).toBe(true)

    // Mais pas sur d'autres ressources
    expect(result.current.canRead('users')).toBe(false)
  })
})
