import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import * as authService from '../../services/authService'

// Mock authService
vi.mock('../../services/authService', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  logout: vi.fn()
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fournit les valeurs initiales', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
    expect(result.current.permissions).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(typeof result.current.loginUser).toBe('function')
    expect(typeof result.current.logoutUser).toBe('function')
    expect(typeof result.current.hasPermission).toBe('function')
  })

  it('charge l\'utilisateur depuis le token au montage', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['*:*']
    }

    authService.getStoredToken.mockReturnValue('fake-token')
    authService.getCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    // Initialement loading
    expect(result.current.loading).toBe(true)

    // Attendre que l'utilisateur soit chargé
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.role).toBe('admin')
    expect(result.current.permissions).toEqual(['*:*'])
  })

  it('gère l\'échec de chargement du token', async () => {
    authService.getStoredToken.mockReturnValue('invalid-token')
    authService.getCurrentUser.mockRejectedValue(new Error('Unauthorized'))
    authService.logout.mockImplementation(() => {})

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(authService.logout).toHaveBeenCalled()
  })

  it('hasPermission retourne false si aucune permission', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    expect(result.current.hasPermission('articles', 'read')).toBe(false)
  })

  it('hasPermission vérifie les permissions exactes', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      role: 'gestionnaire',
      permissions: ['articles:read', 'articles:create']
    }

    authService.getStoredToken.mockReturnValue('fake-token')
    authService.getCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Permissions accordées
    expect(result.current.hasPermission('articles', 'read')).toBe(true)
    expect(result.current.hasPermission('articles', 'create')).toBe(true)

    // Permissions refusées
    expect(result.current.hasPermission('articles', 'delete')).toBe(false)
    expect(result.current.hasPermission('users', 'read')).toBe(false)
  })

  it('hasPermission gère les wildcards de ressource', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      role: 'gestionnaire',
      permissions: ['articles:*']
    }

    authService.getStoredToken.mockReturnValue('fake-token')
    authService.getCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Toutes les actions sur articles
    expect(result.current.hasPermission('articles', 'read')).toBe(true)
    expect(result.current.hasPermission('articles', 'create')).toBe(true)
    expect(result.current.hasPermission('articles', 'update')).toBe(true)
    expect(result.current.hasPermission('articles', 'delete')).toBe(true)

    // Mais pas sur d'autres ressources
    expect(result.current.hasPermission('users', 'read')).toBe(false)
  })

  it('hasPermission gère le wildcard admin', async () => {
    const mockUser = {
      id: 1,
      username: 'admin',
      role: 'admin',
      permissions: ['*:*']
    }

    authService.getStoredToken.mockReturnValue('fake-token')
    authService.getCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Toutes les permissions
    expect(result.current.hasPermission('articles', 'delete')).toBe(true)
    expect(result.current.hasPermission('users', 'create')).toBe(true)
    expect(result.current.hasPermission('anything', 'anything')).toBe(true)
  })

  it.skip('loginUser met à jour l\'état', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      role: 'admin',
      permissions: ['*:*']
    }

    authService.login.mockResolvedValue({ access_token: 'fake-token' })
    authService.getCurrentUser.mockResolvedValue(mockUser)
    authService.setStoredToken.mockImplementation(() => {})

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await result.current.loginUser({ username: 'testuser', password: 'password' })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    expect(result.current.role).toBe('admin')
    expect(result.current.permissions).toEqual(['*:*'])
    expect(authService.setStoredToken).toHaveBeenCalledWith('fake-token')
  })

  it('logoutUser efface l\'état', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      role: 'admin',
      permissions: ['*:*']
    }

    authService.getStoredToken.mockReturnValue('fake-token')
    authService.getCurrentUser.mockResolvedValue(mockUser)
    authService.logout.mockImplementation(() => {})

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    // Déconnexion
    result.current.logoutUser()

    // Attendre que l'état soit mis à jour
    await waitFor(() => {
      expect(result.current.user).toBeNull()
    })

    expect(result.current.role).toBeNull()
    expect(result.current.permissions).toEqual([])
    expect(authService.logout).toHaveBeenCalled()
  })

  it('lève une erreur si useAuth est utilisé hors de AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider')
  })
})
