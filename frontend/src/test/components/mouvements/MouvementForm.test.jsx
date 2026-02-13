import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../utils/testUtils'
import MouvementForm from '../../../components/mouvements/MouvementForm'
import * as articleService from '../../../services/articleService'

// Mock du service
vi.mock('../../../services/articleService', () => ({
  getArticles: vi.fn()
}))

describe('MouvementForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  const mockArticles = {
    items: [
      { id: 1, nom: 'Vis M6', quantite: 50, sku: 'VIS-M6' },
      { id: 2, nom: 'Écrou M6', quantite: 10, sku: 'ECR-M6' },
      { id: 3, nom: 'Rondelle', quantite: 0, sku: 'RON-001' }
    ],
    total: 3
  }

  beforeEach(() => {
    vi.clearAllMocks()
    articleService.getArticles.mockResolvedValue(mockArticles)
  })

  it('affiche le formulaire avec ENTREE sélectionné par défaut', () => {
    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const entreeRadio = screen.getByLabelText(/Entrée de stock/)
    expect(entreeRadio).toBeChecked()

    const sortieRadio = screen.getByLabelText(/Sortie de stock/)
    expect(sortieRadio).not.toBeChecked()
  })

  it('permet de changer le type de mouvement', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const sortieRadio = screen.getByLabelText(/Sortie de stock/)
    await user.click(sortieRadio)

    expect(sortieRadio).toBeChecked()
    expect(screen.getByLabelText(/Entrée de stock/)).not.toBeChecked()
  })

  it('affiche les articles dans la dropdown quand on recherche', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const searchInput = screen.getByPlaceholderText('Rechercher un article...')
    await user.click(searchInput)
    await user.type(searchInput, 'Vis')

    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
      expect(screen.getByText(/Stock actuel: 50/)).toBeInTheDocument()
    })
  })

  it('sélectionne un article et affiche le stock actuel', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const searchInput = screen.getByPlaceholderText('Rechercher un article...')
    await user.click(searchInput)

    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    const visOption = screen.getByText('Vis M6')
    await user.click(visOption)

    // Vérifier que l'aperçu de l'article s'affiche
    await waitFor(() => {
      expect(screen.getByText(/Stock actuel:/)).toBeInTheDocument()
      expect(screen.getByText('50', { selector: '.value strong' })).toBeInTheDocument()
    })
  })

  it('calcule correctement le nouveau stock pour une ENTREE', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Sélectionner un article
    const searchInput = screen.getByPlaceholderText('Rechercher un article...')
    await user.click(searchInput)

    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Vis M6'))

    // Entrer une quantité
    const quantiteInput = screen.getByLabelText(/Quantité/)
    await user.clear(quantiteInput)
    await user.type(quantiteInput, '10')

    // Vérifier le calcul (50 + 10 = 60)
    await waitFor(() => {
      const stockApres = screen.getByText(/Stock après mouvement:/).nextElementSibling
      expect(stockApres).toHaveTextContent('60')
    })
  })

  it('calcule correctement le nouveau stock pour une SORTIE', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Sélectionner SORTIE
    await user.click(screen.getByLabelText(/Sortie de stock/))

    // Sélectionner un article
    const searchInput = screen.getByPlaceholderText('Rechercher un article...')
    await user.click(searchInput)

    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Vis M6'))

    // Entrer une quantité
    const quantiteInput = screen.getByLabelText(/Quantité/)
    await user.clear(quantiteInput)
    await user.type(quantiteInput, '5')

    // Vérifier le calcul (50 - 5 = 45)
    await waitFor(() => {
      const stockApres = screen.getByText(/Stock après mouvement:/).nextElementSibling
      expect(stockApres).toHaveTextContent('45')
    })
  })

  it('affiche une erreur si stock insuffisant pour SORTIE', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Sélectionner SORTIE
    await user.click(screen.getByLabelText(/Sortie de stock/))

    // Sélectionner article avec stock = 10
    const searchInput = screen.getByPlaceholderText('Rechercher un article...')
    await user.click(searchInput)

    await waitFor(() => {
      expect(screen.getByText('Écrou M6')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Écrou M6'))

    // Entrer une quantité supérieure au stock
    const quantiteInput = screen.getByLabelText(/Quantité/)
    await user.clear(quantiteInput)
    await user.type(quantiteInput, '15')

    const motifInput = screen.getByLabelText(/Motif/)
    await user.type(motifInput, 'Test sortie')

    // Soumettre
    const submitButton = screen.getByRole('button', { name: /Enregistrer le mouvement/ })
    await user.click(submitButton)

    // Vérifier l'erreur
    await waitFor(() => {
      expect(screen.getByText(/Stock insuffisant \(disponible: 10\)/)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('affiche une erreur si aucun article sélectionné', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const submitButton = screen.getByRole('button', { name: /Enregistrer le mouvement/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Veuillez sélectionner un article')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('affiche une erreur si le motif est vide', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Sélectionner un article
    const searchInput = screen.getByPlaceholderText('Rechercher un article...')
    await user.click(searchInput)

    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Vis M6'))

    // Ne pas remplir le motif
    const submitButton = screen.getByRole('button', { name: /Enregistrer le mouvement/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Le motif est requis')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('soumet les données correctes pour une ENTREE', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Sélectionner un article
    const searchInput = screen.getByPlaceholderText('Rechercher un article...')
    await user.click(searchInput)

    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Vis M6'))

    // Remplir quantité et motif
    const quantiteInput = screen.getByLabelText(/Quantité/)
    await user.clear(quantiteInput)
    await user.type(quantiteInput, '20')

    const motifInput = screen.getByLabelText(/Motif/)
    await user.type(motifInput, 'Livraison fournisseur')

    // Soumettre
    const submitButton = screen.getByRole('button', { name: /Enregistrer le mouvement/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        article_id: 1,
        type: 'ENTREE',
        quantite: 20,
        motif: 'Livraison fournisseur'
      })
    })
  })

  it('appelle onCancel quand on clique sur Annuler', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <MouvementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Annuler' })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })
})
