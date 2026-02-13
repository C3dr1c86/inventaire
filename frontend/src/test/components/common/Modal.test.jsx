import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '../../../components/common/Modal'

describe('Modal', () => {
  it('affiche la modale quand isOpen est true', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Contenu de test</p>
      </Modal>
    )

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Contenu de test')).toBeInTheDocument()
  })

  it('ne affiche pas la modale quand isOpen est false', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal isOpen={false} onClose={onClose} title="Test Modal">
        <p>Contenu de test</p>
      </Modal>
    )

    expect(container.firstChild).toBeNull()
  })

  it('appelle onClose quand on clique sur le bouton de fermeture', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Contenu</p>
      </Modal>
    )

    const closeButton = screen.getByLabelText('Fermer')
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('appelle onClose quand on clique sur l\'overlay', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Contenu</p>
      </Modal>
    )

    const overlay = screen.getByText('Test Modal').closest('.modal-overlay')
    await user.click(overlay)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('appelle onClose quand on appuie sur Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Contenu</p>
      </Modal>
    )

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('applique les classes de taille correctement', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <Modal isOpen={true} onClose={onClose} title="Test" size="small">
        <p>Contenu</p>
      </Modal>
    )

    let content = screen.getByText('Test').closest('.modal-content')
    expect(content).toHaveClass('modal-content-small')

    rerender(
      <Modal isOpen={true} onClose={onClose} title="Test" size="large">
        <p>Contenu</p>
      </Modal>
    )

    content = screen.getByText('Test').closest('.modal-content')
    expect(content).toHaveClass('modal-content-large')
  })
})
