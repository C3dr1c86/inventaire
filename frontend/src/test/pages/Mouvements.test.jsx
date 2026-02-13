import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/testUtils'
import Mouvements from '../../pages/Mouvements'
import * as mouvementService from '../../services/mouvementService'

// Mock authService pour AuthProvider
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

// Mock des services
vi.mock('../../services/mouvementService', () => ({
  getMouvements: vi.fn(),
  createMouvement: vi.fn()
}))

// Mock MouvementForm
vi.mock('../../components/mouvements/MouvementForm', () => ({
  default: ({ onSubmit }) => (
    <div data-testid="mouvement-form">
      <button onClick={() => onSubmit({ article_id: 1, type: 'ENTREE', quantite: 10 })}>
        Submit Form
      </button>
    </div>
  )
}))

describe.skip('Mouvements', () => {
  const mockMouvements = {
    items: [
      {
        id: 1,
        article: { id: 1, nom: 'Vis M6' },
        type: 'ENTREE',
        quantite: 50,
        quantite_avant: 100,
        quantite_apres: 150,
        motif: 'Réapprovisionnement',
        created_at: '2024-01-15T10:30:00',
        created_by: 'admin'
      },
      {
        id: 2,
        article: { id: 2, nom: 'Rondelle' },
        type: 'SORTIE',
        quantite: 20,
        quantite_avant: 100,
        quantite_apres: 80,
        motif: 'Utilisation atelier',
        created_at: '2024-01-15T14:00:00',
        created_by: 'technicien'
      }
    ],
    total: 2,
    skip: 0,
    limit: 10
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mouvementService.getMouvements.mockResolvedValue(mockMouvements)
    mouvementService.createMouvement.mockResolvedValue({ id: 3 })
  })

  it('affiche le titre Mouvements de Stock', () => {
    renderWithProviders(<Mouvements />)

    expect(screen.getByText(/Mouvements de Stock/)).toBeInTheDocument()
  })

  it('affiche le bouton Nouveau mouvement si permissions', async () => {
    renderWithProviders(<Mouvements />)

    // Attendre le chargement
    await waitFor(() => {
      expect(screen.queryByText(/Chargement/)).not.toBeInTheDocument()
    })

    // Vérifier présence du bouton (user admin par défaut dans testUtils)
    expect(screen.getByRole('button', { name: /Nouveau mouvement/ })).toBeInTheDocument()
  })

  it('affiche la liste des mouvements après chargement', async () => {
    renderWithProviders(<Mouvements />)

    // Attendre que les mouvements se chargent
    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    expect(screen.getByText('Rondelle')).toBeInTheDocument()
    expect(screen.getByText('ENTREE')).toBeInTheDocument()
    expect(screen.getByText('SORTIE')).toBeInTheDocument()
  })

  it('affiche les détails des mouvements', async () => {
    renderWithProviders(<Mouvements />)

    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    // Vérifier quantités
    expect(screen.getByText(/50/)).toBeInTheDocument() // Quantité ENTREE
    expect(screen.getByText(/20/)).toBeInTheDocument() // Quantité SORTIE

    // Vérifier motifs
    expect(screen.getByText('Réapprovisionnement')).toBeInTheDocument()
    expect(screen.getByText('Utilisation atelier')).toBeInTheDocument()
  })

  it('ouvre la modale de création quand on clique sur Nouveau mouvement', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Mouvements />)

    // Attendre chargement
    await waitFor(() => {
      expect(screen.queryByText(/Chargement/)).not.toBeInTheDocument()
    })

    // Cliquer sur le bouton
    const createButton = screen.getByRole('button', { name: /Nouveau mouvement/ })
    await user.click(createButton)

    // Vérifier que la modale est ouverte
    await waitFor(() => {
      expect(screen.getByTestId('mouvement-form')).toBeInTheDocument()
    })
  })

  it('affiche la pagination si plus de 10 mouvements', async () => {
    const mockManyMouvements = {
      items: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        article: { id: i + 1, nom: `Article ${i + 1}` },
        type: 'ENTREE',
        quantite: 10,
        quantite_avant: 0,
        quantite_apres: 10,
        motif: 'Test',
        created_at: '2024-01-15T10:00:00'
      })),
      total: 25,
      skip: 0,
      limit: 10
    }

    mouvementService.getMouvements.mockResolvedValue(mockManyMouvements)

    renderWithProviders(<Mouvements />)

    await waitFor(() => {
      expect(screen.getByText('Article 1')).toBeInTheDocument()
    })

    // Vérifier présence de la pagination
    expect(screen.getByText(/Page 1 sur 3/)).toBeInTheDocument()
  })

  it('affiche un loader pendant le chargement', () => {
    mouvementService.getMouvements.mockReturnValue(
      new Promise(() => {}) // Promise qui ne resolve jamais
    )

    renderWithProviders(<Mouvements />)

    expect(screen.getByText(/Chargement/)).toBeInTheDocument()
  })
})
