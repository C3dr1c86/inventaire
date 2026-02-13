import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/testUtils'
import Rapports from '../../pages/Rapports'
import * as rapportService from '../../services/rapportService'

// Mock authService pour AuthProvider
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

// Mock des services
vi.mock('../../services/rapportService', () => ({
  getRapportStockBas: vi.fn(),
  getRapportValeurTotale: vi.fn(),
  exportCSV: vi.fn(),
  exportPDF: vi.fn(),
  exportBarcodesPDF: vi.fn(),
  exportEmplacementsQRCodesPDF: vi.fn(),
  exportFournisseurs: vi.fn(),
  exportTags: vi.fn(),
  exportEmplacementsData: vi.fn()
}))

vi.mock('../../services/articleService', () => ({
  getArticles: vi.fn()
}))

vi.mock('../../services/emplacementService', () => ({
  getEmplacements: vi.fn()
}))

describe.skip('Rapports', () => {
  const mockStockBas = {
    articles: [
      { id: 1, nom: 'Vis M6', quantite: 5, quantite_min: 10, categorie: { nom: 'Quincaillerie' } },
      { id: 2, nom: 'Rondelle', quantite: 2, quantite_min: 20, categorie: { nom: 'Quincaillerie' } }
    ],
    total: 2
  }

  const mockValeurTotale = {
    valeur_totale: 25000,
    details: [
      { categorie: 'Quincaillerie', nombre: 50, valeur: 5000 },
      { categorie: 'Matériaux', nombre: 30, valeur: 20000 }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    rapportService.getRapportStockBas.mockResolvedValue(mockStockBas)
    rapportService.getRapportValeurTotale.mockResolvedValue(mockValeurTotale)
    rapportService.exportCSV.mockResolvedValue()
    rapportService.exportPDF.mockResolvedValue()
  })

  it('affiche le titre Rapports', () => {
    renderWithProviders(<Rapports />)

    expect(screen.getByText(/Rapports/)).toBeInTheDocument()
  })

  it('affiche le rapport de stock bas', async () => {
    renderWithProviders(<Rapports />)

    await waitFor(() => {
      expect(screen.getByText('Vis M6')).toBeInTheDocument()
    })

    expect(screen.getByText('Rondelle')).toBeInTheDocument()
    expect(screen.getByText(/2 article\(s\) en stock bas/)).toBeInTheDocument()
  })

  it('affiche le rapport de valeur totale', async () => {
    renderWithProviders(<Rapports />)

    await waitFor(() => {
      expect(screen.getByText(/25 000,00/)).toBeInTheDocument()
    })

    expect(screen.getByText('Quincaillerie')).toBeInTheDocument()
    expect(screen.getByText('Matériaux')).toBeInTheDocument()
  })

  it('affiche les boutons d\'export', async () => {
    renderWithProviders(<Rapports />)

    // Attendre le chargement
    await waitFor(() => {
      expect(screen.queryByText(/Chargement/)).not.toBeInTheDocument()
    })

    // Vérifier présence des boutons d'export
    const exportButtons = screen.getAllByRole('button', { name: /CSV|PDF/i })
    expect(exportButtons.length).toBeGreaterThan(0)
  })

  it('exporte en CSV quand on clique sur le bouton', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Rapports />)

    await waitFor(() => {
      expect(screen.queryByText(/Chargement/)).not.toBeInTheDocument()
    })

    // Trouver et cliquer sur un bouton CSV
    const csvButtons = screen.getAllByRole('button', { name: /CSV/i })
    await user.click(csvButtons[0])

    // Vérifier que l'export est appelé
    await waitFor(() => {
      expect(rapportService.exportCSV).toHaveBeenCalled()
    })
  })

  it('exporte en PDF quand on clique sur le bouton', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Rapports />)

    await waitFor(() => {
      expect(screen.queryByText(/Chargement/)).not.toBeInTheDocument()
    })

    // Trouver et cliquer sur un bouton PDF
    const pdfButtons = screen.getAllByRole('button', { name: /PDF/i })
    await user.click(pdfButtons[0])

    // Vérifier que l'export est appelé
    await waitFor(() => {
      expect(rapportService.exportPDF).toHaveBeenCalled()
    })
  })
})
