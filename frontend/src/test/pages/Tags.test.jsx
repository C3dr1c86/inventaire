import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/testUtils'
import Tags from '../../pages/Tags'
import * as tagService from '../../services/tagService'

// Mock authService pour AuthProvider
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

// Mock des services
vi.mock('../../services/tagService', () => ({
  getTags: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn()
}))

// Mock TagForm
vi.mock('../../components/tags/TagForm', () => ({
  default: ({ tag, onSubmit }) => (
    <div data-testid="tag-form">
      <p>{tag ? `Éditer: ${tag.nom}` : 'Créer nouveau tag'}</p>
      <button onClick={() => onSubmit({ nom: 'Test Tag', couleur: '#ff0000' })}>
        Submit Form
      </button>
    </div>
  )
}))

describe.skip('Tags', () => {
  const mockTags = [
    {
      id: 1,
      nom: 'Important',
      couleur: '#ff0000',
      description: 'Articles importants'
    },
    {
      id: 2,
      nom: 'Fragile',
      couleur: '#ffa500',
      description: 'Articles fragiles'
    },
    {
      id: 3,
      nom: 'Urgent',
      couleur: '#ff6b6b',
      description: null
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    tagService.getTags.mockResolvedValue(mockTags)
    tagService.createTag.mockResolvedValue({ id: 4, nom: 'Test Tag' })
    tagService.updateTag.mockResolvedValue({})
    tagService.deleteTag.mockResolvedValue({})
  })

  it('affiche le titre Gestion des Tags', () => {
    renderWithProviders(<Tags />)

    expect(screen.getByText(/Gestion des Tags/)).toBeInTheDocument()
  })

  it('affiche le bouton Créer un tag si permissions', async () => {
    renderWithProviders(<Tags />)

    // Attendre le chargement
    await waitFor(() => {
      expect(screen.queryByText(/Chargement/)).not.toBeInTheDocument()
    })

    // Vérifier présence du bouton (user admin par défaut)
    expect(screen.getByRole('button', { name: /Créer un tag/ })).toBeInTheDocument()
  })

  it('affiche la liste des tags après chargement', async () => {
    renderWithProviders(<Tags />)

    // Attendre que les tags se chargent
    await waitFor(() => {
      expect(screen.getByText('Important')).toBeInTheDocument()
    })

    expect(screen.getByText('Fragile')).toBeInTheDocument()
    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })

  it('affiche les badges colorés des tags', async () => {
    renderWithProviders(<Tags />)

    await waitFor(() => {
      expect(screen.getByText('Important')).toBeInTheDocument()
    })

    // Vérifier que les badges ont le bon style (couleur de fond)
    const importantBadge = screen.getByText('Important').closest('.tag-badge')
    expect(importantBadge).toHaveStyle({ backgroundColor: '#ff0000' })
  })

  it('affiche les descriptions des tags', async () => {
    renderWithProviders(<Tags />)

    await waitFor(() => {
      expect(screen.getByText('Important')).toBeInTheDocument()
    })

    expect(screen.getByText('Articles importants')).toBeInTheDocument()
    expect(screen.getByText('Articles fragiles')).toBeInTheDocument()
  })

  it('ouvre la modale de création quand on clique sur Créer', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Tags />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.getByText('Important')).toBeInTheDocument()
    })

    // Cliquer sur le bouton Créer
    const createButton = screen.getByRole('button', { name: /Créer un tag/ })
    await user.click(createButton)

    // Vérifier que la modale est ouverte
    await waitFor(() => {
      expect(screen.getByTestId('tag-form')).toBeInTheDocument()
      expect(screen.getByText('Créer nouveau tag')).toBeInTheDocument()
    })
  })

  it('ouvre la modale d\'édition quand on clique sur Modifier', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Tags />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.getByText('Important')).toBeInTheDocument()
    })

    // Trouver le bouton Modifier pour Important
    const editButtons = screen.getAllByRole('button', { name: /Modifier/ })
    await user.click(editButtons[0])

    // Vérifier que la modale d'édition est ouverte
    await waitFor(() => {
      expect(screen.getByTestId('tag-form')).toBeInTheDocument()
      expect(screen.getByText(/Éditer: Important/)).toBeInTheDocument()
    })
  })

  it('affiche la confirmation de suppression', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Tags />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.getByText('Important')).toBeInTheDocument()
    })

    // Cliquer sur le bouton Supprimer
    const deleteButtons = screen.getAllByRole('button', { name: /Supprimer/ })
    await user.click(deleteButtons[0])

    // Vérifier que la confirmation est affichée
    await waitFor(() => {
      expect(screen.getByText(/Confirmer la suppression/)).toBeInTheDocument()
      expect(screen.getByText(/Important/)).toBeInTheDocument()
    })
  })

  it('affiche un loader pendant le chargement', () => {
    tagService.getTags.mockReturnValue(
      new Promise(() => {}) // Promise qui ne resolve jamais = loading
    )

    renderWithProviders(<Tags />)

    // Vérifier présence du loader
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })
})
