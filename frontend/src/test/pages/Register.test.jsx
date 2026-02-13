import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/testUtils'
import Register from '../../pages/Register'
import * as authService from '../../services/authService'

// Mock authService
vi.mock('../../services/authService', () => ({
  register: vi.fn(),
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
    useNavigate: () => mockNavigate
  }
})

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le formulaire d\'inscription', () => {
    renderWithProviders(<Register />)

    expect(screen.getByText('Créer un compte')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nom d'utilisateur/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Mot de passe/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirmer le mot de passe/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer mon compte' })).toBeInTheDocument()
  })

  it('affiche le lien vers la connexion', () => {
    renderWithProviders(<Register />)

    expect(screen.getByText(/Déjà un compte/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('affiche une erreur si le username est trop court', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Register />)

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    await user.type(usernameInput, 'ab') // Seulement 2 caractères

    const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/au moins 3 caractères/)).toBeInTheDocument()
    })
  })

  it.skip('affiche une erreur si l\'email n\'est pas valide', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Register />)

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    const emailInput = screen.getByLabelText(/^Email/)
    const passwordInput = screen.getByLabelText(/^Mot de passe/)
    const confirmInput = screen.getByLabelText(/Confirmer le mot de passe/)

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')

    const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/L'email n'est pas valide/)).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le password est trop court', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Register />)

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    const emailInput = screen.getByLabelText(/^Email/)
    const passwordInput = screen.getByLabelText(/^Mot de passe/)
    const confirmInput = screen.getByLabelText(/Confirmer le mot de passe/)

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '1234567') // Seulement 7 caractères
    await user.type(confirmInput, '1234567') // Même chose pour confirmer

    const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/au moins 8 caractères/)).toBeInTheDocument()
    })
  })

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Register />)

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    const emailInput = screen.getByLabelText(/^Email/)
    const passwordInput = screen.getByLabelText(/^Mot de passe/)
    const confirmInput = screen.getByLabelText(/Confirmer le mot de passe/)

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password456') // Différent

    const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Les mots de passe ne correspondent pas/)).toBeInTheDocument()
    })
  })

  it('désactive les champs pendant la soumission', async () => {
    const user = userEvent.setup()

    // Mock register qui prend du temps
    authService.register.mockImplementation(() => new Promise(() => {}))

    renderWithProviders(<Register />)

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    const emailInput = screen.getByLabelText(/^Email/)
    const passwordInput = screen.getByLabelText(/^Mot de passe/)
    const confirmInput = screen.getByLabelText(/Confirmer le mot de passe/)

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')

    const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
    await user.click(submitButton)

    // Attendre que le bouton change
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Création du compte...' })).toBeInTheDocument()
    })

    // Vérifier que les champs sont désactivés
    expect(usernameInput).toBeDisabled()
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(confirmInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it.skip('soumet le formulaire avec des données valides', async () => {
    const user = userEvent.setup()

    authService.register.mockResolvedValue({ id: 1, username: 'testuser' })
    authService.login.mockResolvedValue({ access_token: 'fake-token' })
    authService.getCurrentUser.mockResolvedValue({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['*:*']
    })

    renderWithProviders(<Register />)

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/)
    const emailInput = screen.getByLabelText(/^Email/)
    const passwordInput = screen.getByLabelText(/^Mot de passe/)
    const confirmInput = screen.getByLabelText(/Confirmer le mot de passe/)

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')

    const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Vérifier auto-login
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      })
    })

    // Vérifier navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
})
