import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from '../../../components/common/Pagination'

describe('Pagination', () => {
  it('ne affiche rien quand il y a <= 1 page', () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <Pagination
        currentPage={1}
        totalItems={5}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('affiche tous les numéros de page quand totalPages <= 5', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={2}
        totalItems={40}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('affiche les ellipses quand totalPages > 5', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={5}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    const ellipses = screen.getAllByText('...')
    expect(ellipses.length).toBeGreaterThan(0)
  })

  it('désactive le bouton Précédent sur la première page', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={1}
        totalItems={40}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    const prevButton = screen.getByTitle('Page précédente')
    expect(prevButton).toBeDisabled()
  })

  it('désactive le bouton Suivant sur la dernière page', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={4}
        totalItems={40}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    const nextButton = screen.getByTitle('Page suivante')
    expect(nextButton).toBeDisabled()
  })

  it('appelle onPageChange avec le bon numéro quand on clique sur Suivant', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={2}
        totalItems={40}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    const nextButton = screen.getByTitle('Page suivante')
    await user.click(nextButton)

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('appelle onPageChange avec le bon numéro quand on clique sur Précédent', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={2}
        totalItems={40}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    const prevButton = screen.getByTitle('Page précédente')
    await user.click(prevButton)

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('appelle onPageChange quand on clique sur un numéro de page', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={1}
        totalItems={40}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    const page3Button = screen.getByText('3')
    await user.click(page3Button)

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('affiche les informations correctes sur la pagination', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={2}
        totalItems={35}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    expect(screen.getByText(/Page 2 sur 4/)).toBeInTheDocument()
    expect(screen.getByText(/35 résultats/)).toBeInTheDocument()
  })

  it('marque la page courante comme active', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        currentPage={2}
        totalItems={40}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    )

    const page2Button = screen.getByText('2')
    expect(page2Button).toHaveClass('active')

    const page1Button = screen.getByText('1')
    expect(page1Button).not.toHaveClass('active')
  })
})
