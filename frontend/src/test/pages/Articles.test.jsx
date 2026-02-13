import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/testUtils'
import Articles from '../../pages/Articles'
import * as articleService from '../../services/articleService'
import * as categorieService from '../../services/categorieService'
import * as tagService from '../../services/tagService'
import * as fournisseurService from '../../services/fournisseurService'
import * as emplacementService from '../../services/emplacementService'

// Mock authService pour AuthProvider
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

// Mock des services
vi.mock('../../services/articleService', () => ({
  getArticles: vi.fn(),
  createArticle: vi.fn(),
  updateArticle: vi.fn(),
  deleteArticle: vi.fn()
}))

vi.mock('../../services/categorieService', () => ({
  getCategoriesTree: vi.fn()
}))

vi.mock('../../services/tagService', () => ({
  getTags: vi.fn()
}))

vi.mock('../../services/fournisseurService', () => ({
  getFournisseurs: vi.fn()
}))

vi.mock('../../services/emplacementService', () => ({
  getEmplacements: vi.fn()
}))

// Mock des composants complexes
vi.mock('../../components/articles/ArticleForm', () => ({
  default: () => <div data-testid="article-form">Article Form Mock</div>
}))

vi.mock('../../components/articles/ArticleDetailModal', () => ({
  default: () => <div data-testid="article-detail-modal">Article Detail Mock</div>
}))

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

describe.skip('Articles', () => {
  const mockArticles = {
    items: [
      {
        id: 1,
        nom: 'Vis M6',
        sku: 'VIS-M6',
        quantite: 50,
        quantite_min: 10,
        prix_unitaire: 1.5,
        categorie: { id: 1, nom: 'Quincaillerie' },
        tags: []
      },
      {
        id: 2,
        nom: 'Rondelle',
        sku: 'ROND-10',
        quantite: 100,
        quantite_min: 20,
        prix_unitaire: 0.5,
        categorie: { id: 1, nom: 'Quincaillerie' },
        tags: []
      }
    ],
    total: 2,
    skip: 0,
    limit: 10
  }

  const mockCategories = [
    { id: 1, nom: 'Quincaillerie', parent_id: null, children: [] }
  ]

  const mockTags = [
    { id: 1, nom: 'Important', couleur: '#ff0000' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    articleService.getArticles.mockResolvedValue(mockArticles)
    categorieService.getCategoriesTree.mockResolvedValue(mockCategories)
    tagService.getTags.mockResolvedValue(mockTags)
    fournisseurService.getFournisseurs.mockResolvedValue([])
    emplacementService.getEmplacements.mockResolvedValue([])
  })

  it('affiche le titre Articles', async () => {
    renderWithProviders(<Articles />)

    expect(screen.getByText(/Gestion des articles/)).toBeInTheDocument()
  })

  it('affiche la liste des articles après chargement', async () => {
    renderWithProviders(<Articles />)

    // Attendre que les articles se chargent
    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    expect(screen.getByText('Rondelle')).toBeInTheDocument()
    expect(screen.getByText('VIS-M6')).toBeInTheDocument()
    expect(screen.getByText('ROND-10')).toBeInTheDocument()
  })

  it('affiche la barre de recherche', () => {
    renderWithProviders(<Articles />)

    const searchBar = screen.getByTestId('search-bar')
    expect(searchBar).toBeInTheDocument()
    expect(searchBar).toHaveAttribute('placeholder', /Rechercher/)
  })

  it('effectue une recherche après debounce', async () => {
    const user = userEvent.setup()

    const mockSearchResults = {
      items: [mockArticles.items[0]],
      total: 1,
      skip: 0,
      limit: 10
    }

    articleService.getArticles.mockResolvedValueOnce(mockArticles) // Initial load
    articleService.getArticles.mockResolvedValueOnce(mockSearchResults) // Search

    renderWithProviders(<Articles />)

    // Attendre chargement initial
    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    const searchBar = screen.getByTestId('search-bar')
    await user.type(searchBar, 'Vis')

    // Attendre le debounce + recherche
    await waitFor(() => {
      expect(articleService.getArticles).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Vis' })
      )
    }, { timeout: 3000 })
  })

  it('filtre par catégorie', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Articles />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    // Sélectionner le filtre catégorie
    const categorieSelect = screen.getByLabelText(/Catégorie/)
    await user.selectOptions(categorieSelect, '1')

    // Vérifier que la requête est envoyée avec le filtre
    await waitFor(() => {
      expect(articleService.getArticles).toHaveBeenCalledWith(
        expect.objectContaining({ categorie_id: '1' })
      )
    })
  })

  it('affiche la pagination si plus de 10 articles', async () => {
    const mockManyArticles = {
      items: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        nom: `Article ${i + 1}`,
        sku: `SKU-${i + 1}`,
        quantite: 10,
        quantite_min: 5,
        prix_unitaire: 1,
        tags: []
      })),
      total: 25, // Plus de 10 articles
      skip: 0,
      limit: 10
    }

    articleService.getArticles.mockResolvedValue(mockManyArticles)

    renderWithProviders(<Articles />)

    // Attendre que les articles se chargent
    await waitFor(() => {
      expect(screen.getByText('Article 1')).toBeInTheDocument()
    })

    // Vérifier présence de la pagination
    expect(screen.getByText(/Page 1 sur 3/)).toBeInTheDocument()
    expect(screen.getByText(/25 résultats/)).toBeInTheDocument()
  })

  it('ouvre la modale de création quand on clique sur Créer', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Articles />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    // Cliquer sur le bouton Créer
    const createButton = screen.getByRole('button', { name: /Créer un article/ })
    await user.click(createButton)

    // Vérifier que la modale est ouverte
    await waitFor(() => {
      expect(screen.getByTestId('article-form')).toBeInTheDocument()
    })
  })

  it('affiche le filtre stock bas', async () => {
    renderWithProviders(<Articles />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    // Vérifier présence du checkbox stock bas
    const stockBasCheckbox = screen.getByLabelText(/Stock bas/)
    expect(stockBasCheckbox).toBeInTheDocument()
    expect(stockBasCheckbox).not.toBeChecked()
  })
})
