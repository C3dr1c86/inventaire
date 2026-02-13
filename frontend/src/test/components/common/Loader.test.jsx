import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Loader from '../../../components/common/Loader'

describe('Loader', () => {
  it('affiche le texte de chargement par défaut', () => {
    render(<Loader />)

    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('affiche un texte personnalisé', () => {
    render(<Loader text="Veuillez patienter..." />)

    expect(screen.getByText('Veuillez patienter...')).toBeInTheDocument()
    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument()
  })

  it('n\'affiche pas de texte quand text est vide', () => {
    render(<Loader text="" />)

    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument()
  })

  it('applique la bonne taille au spinner', () => {
    const { container, rerender } = render(<Loader size="small" />)

    let spinner = container.querySelector('.spinner')
    expect(spinner).toHaveStyle({ width: '24px', height: '24px' })

    rerender(<Loader size="large" />)
    spinner = container.querySelector('.spinner')
    expect(spinner).toHaveStyle({ width: '60px', height: '60px' })

    rerender(<Loader size="medium" />)
    spinner = container.querySelector('.spinner')
    expect(spinner).toHaveStyle({ width: '40px', height: '40px' })
  })
})
