import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../utils/testUtils'
import ArticleForm from '../../../components/articles/ArticleForm'
import * as categorieService from '../../../services/categorieService'
import * as emplacementService from '../../../services/emplacementService'

// Mock des services
vi.mock('../../../services/categorieService', () => ({
  getCategories: vi.fn(),
  getCategoriesRacines: vi.fn(),
  getSousCategories: vi.fn()
}))

vi.mock('../../../services/emplacementService', () => ({
  getEmplacementsRacines: vi.fn(),
  getSousEmplacements: vi.fn(),
  getSuggestionsByCategory: vi.fn()
}))

// Mock des composants complexes
vi.mock('../../../components/tags/TagInput', () => ({
  default: () => (
    <div data-testid="tag-input">TagInput Mock</div>
  )
}))

vi.mock('../../../components/fournisseurs/FournisseurInput', () => ({
  default: () => (
    <div data-testid="fournisseur-input">FournisseurInput Mock</div>
  )
}))

vi.mock('../../../components/articles/PhotoUpload', () => ({
  default: () => (
    <div data-testid="photo-upload">PhotoUpload Mock</div>
  )
}))

describe('ArticleForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  const mockCategories = [
    { id: 1, nom: 'Matériaux', parent_id: null },
    { id: 2, nom: 'Bois', parent_id: 1 }
  ]

  const mockZones = [
    { id: 1, nom: 'Zone A', niveau: 0 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    categorieService.getCategories.mockResolvedValue(mockCategories)
    categorieService.getCategoriesRacines.mockResolvedValue([mockCategories[0]])
    categorieService.getSousCategories.mockResolvedValue([mockCategories[1]])
    emplacementService.getEmplacementsRacines.mockResolvedValue(mockZones)
    emplacementService.getSousEmplacements.mockResolvedValue([])
    emplacementService.getSuggestionsByCategory.mockResolvedValue([])
  })

  it('affiche le formulaire vide en mode création', async () => {
    renderWithProviders(
      <ArticleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Champs de base
    expect(screen.getByLabelText(/Nom de l'article/)).toHaveValue('')
    expect(screen.getByLabelText(/Code SKU/)).toHaveValue('')
    expect(screen.getByLabelText(/Quantité en stock/)).toHaveValue(0)
    expect(screen.getByLabelText(/Stock minimum/)).toHaveValue(10)
    expect(screen.getByLabelText(/Prix unitaire \(€\)/)).toHaveValue(0)

    // Bouton
    expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument()
  })

  it('pré-remplit le formulaire en mode édition', async () => {
    const article = {
      id: 1,
      nom: 'Vis M6',
      sku: 'VIS-M6',
      quantite: 50,
      quantite_min: 10,
      prix_unitaire: 1.5,
      categorie_id: 2,
      emplacement_id: null,
      description: 'Vis métal',
      tags: [],
      fournisseurs: []
    }

    renderWithProviders(
      <ArticleForm
        article={article}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Nom de l'article/)).toHaveValue('Vis M6')
    })

    expect(screen.getByLabelText(/Code SKU/)).toHaveValue('VIS-M6')
    expect(screen.getByLabelText(/Quantité en stock/)).toHaveValue(50)
    expect(screen.getByLabelText(/Stock minimum/)).toHaveValue(10)
    expect(screen.getByLabelText(/Prix unitaire \(€\)/)).toHaveValue(1.5)
    expect(screen.getByLabelText(/Description/)).toHaveValue('Vis métal')
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
  })

  it('affiche une erreur si le nom est vide', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <ArticleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Créer' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Le nom est requis/)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('affiche une erreur si la quantité est négative', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <ArticleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Remplir tous les champs obligatoires
    await waitFor(() => {
      expect(screen.getByLabelText(/Nom de l'article/)).toBeInTheDocument()
    })

    const nomInput = screen.getByLabelText(/Nom de l'article/)
    await user.type(nomInput, 'Test Article')

    const skuInput = screen.getByLabelText(/Code SKU/)
    await user.type(skuInput, 'TEST-001')

    // Entrer une quantité négative
    const quantiteInput = screen.getByLabelText(/Quantité en stock/)
    await user.clear(quantiteInput)
    await user.type(quantiteInput, '-5')

    const submitButton = screen.getByRole('button', { name: 'Créer' })
    await user.click(submitButton)

    // Vérifier que le formulaire n'est pas soumis (validation échoue)
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('affiche une erreur si le prix est négatif', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <ArticleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Remplir tous les champs obligatoires
    await waitFor(() => {
      expect(screen.getByLabelText(/Nom de l'article/)).toBeInTheDocument()
    })

    const nomInput = screen.getByLabelText(/Nom de l'article/)
    await user.type(nomInput, 'Test Article')

    const skuInput = screen.getByLabelText(/Code SKU/)
    await user.type(skuInput, 'TEST-002')

    // Entrer un prix négatif
    const prixInput = screen.getByLabelText(/Prix unitaire \(€\)/)
    await user.clear(prixInput)
    await user.type(prixInput, '-10')

    const submitButton = screen.getByRole('button', { name: 'Créer' })
    await user.click(submitButton)

    // Vérifier que le formulaire n'est pas soumis (validation échoue)
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('appelle onCancel quand on clique sur Annuler', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <ArticleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Annuler' })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('désactive les champs quand isSubmitting est true', () => {
    renderWithProviders(
      <ArticleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    )

    expect(screen.getByLabelText(/Nom de l'article/)).toBeDisabled()
    expect(screen.getByLabelText(/Code SKU/)).toBeDisabled()
    expect(screen.getByLabelText(/Quantité en stock/)).toBeDisabled()
    expect(screen.getByLabelText(/Prix unitaire \(€\)/)).toBeDisabled()
    expect(screen.getByRole('button', { name: /Enregistrement.../ })).toBeDisabled()
  })

  it('charge et affiche les composants complexes mockés', async () => {
    renderWithProviders(
      <ArticleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('tag-input')).toBeInTheDocument()
      expect(screen.getByTestId('fournisseur-input')).toBeInTheDocument()
    })
  })
})
