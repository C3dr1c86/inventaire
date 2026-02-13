import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/testUtils'
import Categories from '../../pages/Categories'
import * as categorieService from '../../services/categorieService'

// Mock authService pour AuthProvider
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

// Mock des services
vi.mock('../../services/categorieService', () => ({
  getCategoriesTree: vi.fn(),
  createCategorie: vi.fn(),
  updateCategorie: vi.fn(),
  deleteCategorie: vi.fn()
}))

// Mock CategorieForm
vi.mock('../../components/categories/CategorieForm', () => ({
  default: ({ categorie, onSubmit }) => (
    <div data-testid="categorie-form">
      <p>{categorie ? `Éditer: ${categorie.nom}` : 'Créer nouvelle catégorie'}</p>
      <button onClick={() => onSubmit({ nom: 'Test', description: null, parent_id: null })}>
        Submit Form
      </button>
    </div>
  )
}))

describe.skip('Categories', () => {
  const mockCategoriesTree = [
    {
      id: 1,
      nom: 'Matériaux',
      description: 'Matériaux de construction',
      parent_id: null,
      children: [
        { id: 2, nom: 'Bois', description: null, parent_id: 1, children: [] },
        { id: 3, nom: 'Métal', description: null, parent_id: 1, children: [] }
      ]
    },
    {
      id: 4,
      nom: 'Consommables',
      description: null,
      parent_id: null,
      children: []
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    categorieService.getCategoriesTree.mockResolvedValue(mockCategoriesTree)
    categorieService.createCategorie.mockResolvedValue({ id: 5, nom: 'Test' })
    categorieService.updateCategorie.mockResolvedValue({})
    categorieService.deleteCategorie.mockResolvedValue({})
  })

  it('affiche le titre Catégories', async () => {
    renderWithProviders(<Categories />)

    expect(screen.getByText(/Gestion des catégories/)).toBeInTheDocument()
  })

  it('affiche la liste des catégories après chargement', async () => {
    renderWithProviders(<Categories />)

    // Attendre que les catégories se chargent
    await waitFor(() => {
      expect(screen.getByText('Matériaux')).toBeInTheDocument()
    })

    expect(screen.getByText('Consommables')).toBeInTheDocument()
    expect(screen.getByText('Matériaux de construction')).toBeInTheDocument()
  })

  it('affiche les sous-catégories sous leur parent', async () => {
    renderWithProviders(<Categories />)

    // Attendre que les catégories se chargent
    await waitFor(() => {
      expect(screen.getByText('Matériaux')).toBeInTheDocument()
    })

    // Vérifier présence des sous-catégories
    expect(screen.getByText('Bois')).toBeInTheDocument()
    expect(screen.getByText('Métal')).toBeInTheDocument()
    expect(screen.getByText(/2 sous-catégories/)).toBeInTheDocument()
  })

  it('ouvre la modale de création quand on clique sur Créer', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Categories />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.getByText('Matériaux')).toBeInTheDocument()
    })

    // Cliquer sur le bouton Créer
    const createButton = screen.getByRole('button', { name: /Créer une catégorie/ })
    await user.click(createButton)

    // Vérifier que la modale est ouverte
    await waitFor(() => {
      expect(screen.getByTestId('categorie-form')).toBeInTheDocument()
      expect(screen.getByText('Créer nouvelle catégorie')).toBeInTheDocument()
    })
  })

  it('ouvre la modale d\'édition quand on clique sur Modifier', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Categories />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.getByText('Matériaux')).toBeInTheDocument()
    })

    // Trouver le bouton Modifier pour Matériaux
    const editButtons = screen.getAllByRole('button', { name: /Modifier/ })
    await user.click(editButtons[0])

    // Vérifier que la modale d'édition est ouverte
    await waitFor(() => {
      expect(screen.getByTestId('categorie-form')).toBeInTheDocument()
      expect(screen.getByText(/Éditer: Matériaux/)).toBeInTheDocument()
    })
  })

  it('affiche la confirmation de suppression', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Categories />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.getByText('Matériaux')).toBeInTheDocument()
    })

    // Cliquer sur le bouton Supprimer
    const deleteButtons = screen.getAllByRole('button', { name: /Supprimer/ })
    await user.click(deleteButtons[deleteButtons.length - 1]) // Dernier = Consommables (sans enfants)

    // Vérifier que la confirmation est affichée
    await waitFor(() => {
      expect(screen.getByText(/Confirmer la suppression/)).toBeInTheDocument()
      expect(screen.getByText(/Consommables/)).toBeInTheDocument()
    })

    // Trouver et cliquer sur le bouton de confirmation
    const confirmButtons = screen.getAllByRole('button', { name: /Supprimer/ })
    const confirmButton = confirmButtons.find(btn => btn.closest('.modal'))

    if (confirmButton) {
      await user.click(confirmButton)

      // Vérifier que deleteCategorie est appelé
      await waitFor(() => {
        expect(categorieService.deleteCategorie).toHaveBeenCalledWith(4)
      })
    }
  })

  it('affiche un loader pendant le chargement', () => {
    categorieService.getCategoriesTree.mockReturnValue(
      new Promise(() => {}) // Promise qui ne resolve jamais = loading
    )

    renderWithProviders(<Categories />)

    // Vérifier présence du loader
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })
})
