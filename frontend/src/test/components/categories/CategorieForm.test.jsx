import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../utils/testUtils'
import CategorieForm from '../../../components/categories/CategorieForm'
import * as categorieService from '../../../services/categorieService'

// Mock du service
vi.mock('../../../services/categorieService', () => ({
  getCategoriesRacines: vi.fn()
}))

describe('CategorieForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    categorieService.getCategoriesRacines.mockResolvedValue([
      { id: 1, nom: 'Matériaux' },
      { id: 2, nom: 'Consommables' }
    ])
  })

  it('affiche le formulaire vide en mode création', async () => {
    renderWithProviders(
      <CategorieForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    expect(screen.getByLabelText(/Nom de la catégorie/)).toHaveValue('')
    expect(screen.getByLabelText(/Description/)).toHaveValue('')
    expect(screen.getByLabelText(/Catégorie parente/)).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument()
  })

  it('pré-remplit le formulaire en mode édition', async () => {
    const categorie = {
      id: 3,
      nom: 'Bois',
      description: 'Matériaux en bois',
      parent_id: 1
    }

    renderWithProviders(
      <CategorieForm
        categorie={categorie}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Attendre que les catégories racines soient chargées (React Query)
    await waitFor(() => {
      expect(screen.getByText('Matériaux')).toBeInTheDocument()
    })

    // Attendre que l'useEffect pré-remplisse le formulaire
    await waitFor(() => {
      expect(screen.getByLabelText(/Nom de la catégorie/)).toHaveValue('Bois')
      expect(screen.getByLabelText(/Description/)).toHaveValue('Matériaux en bois')
    })

    // Vérifier que parent_id est bien défini
    const parentSelect = screen.getByLabelText(/Catégorie parente/)
    await waitFor(() => {
      expect(parentSelect.value).toBe('1')
    })

    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
  })

  it('affiche une erreur si le nom est vide', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <CategorieForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Créer' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Le nom est requis')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('soumet les données correctes en mode création', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <CategorieForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    const nomInput = screen.getByLabelText(/Nom de la catégorie/)
    const descriptionInput = screen.getByLabelText(/Description/)
    const submitButton = screen.getByRole('button', { name: 'Créer' })

    await user.type(nomInput, 'Électricité')
    await user.type(descriptionInput, 'Matériel électrique')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        nom: 'Électricité',
        description: 'Matériel électrique',
        parent_id: null
      })
    })
  })

  it('soumet avec parent_id si une catégorie parente est sélectionnée', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <CategorieForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Attendre que les catégories racines se chargent
    await waitFor(() => {
      expect(screen.getByText('Matériaux')).toBeInTheDocument()
    })

    const nomInput = screen.getByLabelText(/Nom de la catégorie/)
    const parentSelect = screen.getByLabelText(/Catégorie parente/)
    const submitButton = screen.getByRole('button', { name: 'Créer' })

    await user.type(nomInput, 'Bois')
    await user.selectOptions(parentSelect, '1')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        nom: 'Bois',
        description: null,
        parent_id: 1
      })
    })
  })

  it('appelle onCancel quand on clique sur Annuler', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <CategorieForm
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
      <CategorieForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    )

    expect(screen.getByLabelText(/Nom de la catégorie/)).toBeDisabled()
    expect(screen.getByLabelText(/Description/)).toBeDisabled()
    expect(screen.getByLabelText(/Catégorie parente/)).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enregistrement...' })).toBeDisabled()
  })

  it('efface l\'erreur quand on commence à taper', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <CategorieForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    )

    // Déclencher l'erreur
    const submitButton = screen.getByRole('button', { name: 'Créer' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Le nom est requis')).toBeInTheDocument()
    })

    // Taper dans le champ nom
    const nomInput = screen.getByLabelText(/Nom de la catégorie/)
    await user.type(nomInput, 'Test')

    // L'erreur devrait disparaître
    await waitFor(() => {
      expect(screen.queryByText('Le nom est requis')).not.toBeInTheDocument()
    })
  })
})
