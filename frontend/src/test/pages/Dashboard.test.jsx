import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/testUtils'
import Dashboard from '../../pages/Dashboard'
import * as rapportService from '../../services/rapportService'
import * as articleService from '../../services/articleService'
import * as categorieService from '../../services/categorieService'

// Mock authService pour AuthProvider
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  getStoredToken: vi.fn(() => null), // Pas de token = pas d'appel getCurrentUser
  setStoredToken: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

// Mock des services
vi.mock('../../services/rapportService', () => ({
  getStatistiques: vi.fn(),
  getRapportStockBas: vi.fn()
}))

vi.mock('../../services/articleService', () => ({
  getArticles: vi.fn(),
  createArticle: vi.fn()
}))

vi.mock('../../services/categorieService', () => ({
  createCategorie: vi.fn()
}))

vi.mock('../../services/tagService', () => ({
  createTag: vi.fn()
}))

vi.mock('../../services/fournisseurService', () => ({
  createFournisseur: vi.fn()
}))

vi.mock('../../services/emplacementService', () => ({
  createEmplacement: vi.fn()
}))

// Mock SearchBar
vi.mock('../../components/common/SearchBar', () => ({
  default: ({ value, onChange, placeholder }) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}))

// Mock des formulaires complexes
vi.mock('../../components/articles/ArticleForm', () => ({
  default: () => <div data-testid="article-form">Article Form Mock</div>
}))

vi.mock('../../components/categories/CategorieForm', () => ({
  default: () => <div data-testid="categorie-form">Categorie Form Mock</div>
}))

vi.mock('../../components/tags/TagForm', () => ({
  default: () => <div data-testid="tag-form">Tag Form Mock</div>
}))

vi.mock('../../components/fournisseurs/FournisseurForm', () => ({
  default: () => <div data-testid="fournisseur-form">Fournisseur Form Mock</div>
}))

vi.mock('../../components/emplacements/EmplacementForm', () => ({
  default: () => <div data-testid="emplacement-form">Emplacement Form Mock</div>
}))

describe('Dashboard', () => {
  const mockStats = {
    total_articles: 150,
    valeur_totale_stock: 25000,
    nombre_categories: 12,
    nombre_articles_stock_bas: 5
  }

  const mockStockBas = {
    articles: [
      { id: 1, nom: 'Vis M6', quantite: 5, quantite_min: 10, categorie: { nom: 'Quincaillerie' } },
      { id: 2, nom: 'Rondelle', quantite: 2, quantite_min: 20, categorie: { nom: 'Quincaillerie' } }
    ],
    total: 2
  }

  beforeEach(() => {
    vi.clearAllMocks()
    rapportService.getStatistiques.mockResolvedValue(mockStats)
    rapportService.getRapportStockBas.mockResolvedValue(mockStockBas)
    articleService.getArticles.mockResolvedValue({ items: [], total: 0 })
  })

  it('affiche le titre Dashboard', async () => {
    renderWithProviders(<Dashboard />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it.skip('affiche les statistiques après chargement', async () => {
    renderWithProviders(<Dashboard />)

    // Attendre que les statistiques se chargent (avec timeout plus long)
    await waitFor(() => {
      expect(rapportService.getStatistiques).toHaveBeenCalled()
    }, { timeout: 5000 })

    // Attendre que les valeurs s'affichent
    await waitFor(() => {
      const statValues = screen.getAllByText('150')
      expect(statValues.length).toBeGreaterThan(0)
    }, { timeout: 5000 })

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText(/25 000,00/)).toBeInTheDocument()
  })

  it.skip('affiche les alertes de stock bas', async () => {
    renderWithProviders(<Dashboard />)

    // Attendre que les alertes se chargent
    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    expect(screen.getByText('Rondelle')).toBeInTheDocument()
    expect(screen.getByText(/2 article\(s\) en stock bas/)).toBeInTheDocument()
  })

  it('affiche la barre de recherche', () => {
    renderWithProviders(<Dashboard />)

    const searchBar = screen.getByTestId('search-bar')
    expect(searchBar).toBeInTheDocument()
    expect(searchBar).toHaveAttribute('placeholder', /Rechercher un article/)
  })

  it.skip('effectue une recherche après debounce', async () => {
    const user = userEvent.setup()

    const mockSearchResults = {
      items: [
        { id: 1, nom: 'Vis M6', sku: 'VIS-M6', quantite: 50, quantite_min: 10, tags: [] }
      ],
      total: 1
    }

    articleService.getArticles.mockResolvedValue(mockSearchResults)

    renderWithProviders(<Dashboard />)

    const searchBar = screen.getByTestId('search-bar')
    await user.type(searchBar, 'Vis M6')

    // Attendre le debounce (500ms) + chargement résultats
    await waitFor(() => {
      expect(screen.getByText(/Résultats de recherche/)).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText('Vis M6')).toBeInTheDocument()
    expect(articleService.getArticles).toHaveBeenCalledWith({ search: 'Vis M6' })
  })

  it.skip('efface les résultats de recherche', async () => {
    const user = userEvent.setup()

    const mockSearchResults = {
      items: [{ id: 1, nom: 'Test', sku: 'TEST', quantite: 10, quantite_min: 5, tags: [] }],
      total: 1
    }

    articleService.getArticles.mockResolvedValue(mockSearchResults)

    renderWithProviders(<Dashboard />)

    const searchBar = screen.getByTestId('search-bar')
    await user.type(searchBar, 'Test')

    // Attendre les résultats
    await waitFor(() => {
      expect(screen.getByText(/Résultats de recherche/)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Cliquer sur Effacer
    const clearButton = screen.getByRole('button', { name: 'Effacer' })
    await user.click(clearButton)

    // Vérifier que les résultats ont disparu
    await waitFor(() => {
      expect(screen.queryByText(/Résultats de recherche/)).not.toBeInTheDocument()
    })
  })

  it.skip('affiche les boutons de création rapide si permissions', async () => {
    renderWithProviders(<Dashboard />)

    // Attendre que le composant charge
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    // Vérifier présence des boutons (utilisateur admin par défaut dans testUtils)
    expect(screen.getByRole('button', { name: /Article/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Catégorie/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tag/ })).toBeInTheDocument()
  })
})
