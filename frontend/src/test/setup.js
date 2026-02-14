import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup après chaque test
afterEach(() => {
  cleanup()
})

// Mock de window.matchMedia (pour les composants responsive)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock de window.scrollTo
window.scrollTo = vi.fn()

// Mock de IntersectionObserver (pour composants avec lazy loading)
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Variables d'environnement de test
import.meta.env.VITE_API_URL = 'http://localhost:8000/api'
