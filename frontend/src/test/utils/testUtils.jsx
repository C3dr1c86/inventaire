import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../../contexts/AuthContext'
import { vi } from 'vitest'

// Mock localStorage
export const mockLocalStorage = () => {
  const storage = {}
  return {
    getItem: vi.fn((key) => storage[key] || null),
    setItem: vi.fn((key, value) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    })
  }
}

// Créer un QueryClient pour les tests
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

// Wrapper avec tous les providers nécessaires
export const AllTheProviders = ({ children, queryClient = createTestQueryClient() }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Render customisé avec tous les providers
export const renderWithProviders = (ui, options = {}) => {
  const { queryClient, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions
  })
}

// Mock user pour les tests d'authentification
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  permissions: ['*:*'],
  is_active: true
}

export const mockGestionnaireUser = {
  id: 2,
  username: 'gestionnaire',
  email: 'gest@example.com',
  role: 'gestionnaire',
  permissions: [
    'articles:read', 'articles:create', 'articles:update', 'articles:delete',
    'categories:read', 'categories:create', 'categories:update', 'categories:delete'
  ],
  is_active: true
}

export const mockConsultationUser = {
  id: 3,
  username: 'consultation',
  email: 'consult@example.com',
  role: 'consultation',
  permissions: ['articles:read', 'categories:read'],
  is_active: true
}

// Mock axios pour les tests API
export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}

// Réexporter tout de @testing-library/react
export * from '@testing-library/react'
