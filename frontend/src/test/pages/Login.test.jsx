import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/testUtils'
import Login from '../../pages/Login'
import * as authService from '../../services/authService'

// Mock authService
vi.mock('../../services/authService', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  logout: vi.fn()
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null })
  }
})

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le formulaire de connexion', () => {
    renderWithProviders(<Login />)

    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nom d'utilisateur/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mot de passe/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('affiche le lien vers l\'inscription', () => {
    renderWithProviders(<Login />)

    expect(screen.getByText(/Pas encore de compte/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Créer un compte' })).toBeInTheDocument()
  })

  it('affiche une erreur si le username est vide', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Login />)

    const submitButton = screen.getByRole('button', { name: 'Se connecter' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Le nom d'utilisateur est requis/)).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le password est vide', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Login />)

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    await user.type(usernameInput, 'testuser')

    const submitButton = screen.getByRole('button', { name: 'Se connecter' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Le mot de passe est requis/)).toBeInTheDocument()
    })
  })

  it('efface l\'erreur quand on modifie le champ', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Login />)

    // Déclencher l'erreur
    const submitButton = screen.getByRole('button', { name: 'Se connecter' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Le nom d'utilisateur est requis/)).toBeInTheDocument()
    })

    // Modifier le champ
    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    await user.type(usernameInput, 'a')

    // L'erreur doit disparaître
    await waitFor(() => {
      expect(screen.queryByText(/Le nom d'utilisateur est requis/)).not.toBeInTheDocument()
    })
  })

  it('désactive les champs pendant la soumission', async () => {
    const user = userEvent.setup()

    // Mock login qui prend du temps
    authService.login.mockImplementation(() => new Promise(() => {}))

    renderWithProviders(<Login />)

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    const passwordInput = screen.getByLabelText(/Mot de passe/)
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')

    const submitButton = screen.getByRole('button', { name: 'Se connecter' })
    await user.click(submitButton)

    // Attendre que le bouton change
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Connexion...' })).toBeInTheDocument()
    })

    // Vérifier que les champs sont désactivés
    expect(usernameInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it.skip('soumet le formulaire avec des identifiants valides', async () => {
    const user = userEvent.setup()

    authService.login.mockResolvedValue({ access_token: 'fake-token' })
    authService.getCurrentUser.mockResolvedValue({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['*:*']
    })

    renderWithProviders(<Login />)

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    const passwordInput = screen.getByLabelText(/Mot de passe/)
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')

    const submitButton = screen.getByRole('button', { name: 'Se connecter' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      })
    })

    // Vérifier navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })
})
