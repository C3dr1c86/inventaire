/**
 * Page Mouvements - Gestion des mouvements de stock.
 *
 * Permet d'enregistrer des entrées/sorties et de consulter l'historique.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getMouvements, createMouvement, deleteMouvement } from '../services/mouvementService'
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import Modal from '../components/common/Modal'
import MouvementForm from '../components/mouvements/MouvementForm'
import Pagination from '../components/common/Pagination'
import { usePermissions } from '../hooks/usePermissions'

function Mouvements() {
  const { canCreate, canDelete } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const queryClient = useQueryClient()

  // Récupérer les mouvements
  const skip = (currentPage - 1) * itemsPerPage
  const { data, isLoading, error } = useQuery({
    queryKey: ['mouvements', { skip, limit: itemsPerPage }],
    queryFn: () => getMouvements({ skip, limit: itemsPerPage })
  })

  // Mutation pour créer un mouvement
  const createMutation = useMutation({
    mutationFn: createMouvement,
    onSuccess: () => {
      queryClient.invalidateQueries(['mouvements'])
      queryClient.invalidateQueries(['articles'])
      queryClient.invalidateQueries(['statistiques'])
      queryClient.invalidateQueries(['stock-bas'])
      setIsModalOpen(false)
      toast.success('Mouvement enregistré avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement du mouvement')
    }
  })

  // Mutation pour supprimer un mouvement
  const deleteMutation = useMutation({
    mutationFn: deleteMouvement,
    onSuccess: () => {
      queryClient.invalidateQueries(['mouvements'])
      queryClient.invalidateQueries(['articles'])
      queryClient.invalidateQueries(['statistiques'])
      queryClient.invalidateQueries(['stock-bas'])
      setDeleteConfirm(null)
      toast.success('Mouvement supprimé — vérifiez le stock de l\'article si nécessaire')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression du mouvement')
      setDeleteConfirm(null)
    }
  })

  const handleCreateClick = () => {
    setIsModalOpen(true)
  }

  const handleFormSubmit = (formData) => {
    createMutation.mutate(formData)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleDeleteClick = (mouvement) => {
    setDeleteConfirm(mouvement)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mouvements de Stock</h1>
        <div className="loader"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mouvements de Stock</h1>
        <div className="alert alert-danger">
          Erreur lors du chargement des mouvements : {error.message}
        </div>
      </div>
    )
  }

  const mouvements = data?.items || []

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Mouvements de Stock</h1>
        {canCreate('mouvements') && (
          <button className="btn btn-primary" onClick={handleCreateClick}>
            <Plus size={18} />
            Nouveau mouvement
          </button>
        )}
      </div>



      {/* Historique des mouvements */}
      <div className="card">
        <h2 className="card-header">
          Historique des mouvements ({data?.total || 0})
        </h2>

        {mouvements.length === 0 ? (
          <div className="card-body text-center">
            <p>Aucun mouvement enregistré.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Article</th>
                <th>Quantité</th>
                <th>Avant</th>
                <th>Après</th>
                <th>Motif</th>
                {canDelete('mouvements') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {mouvements.map((mouvement) => (
                <tr key={mouvement.id}>
                  <td data-label="Date">
                    {format(new Date(mouvement.created_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td data-label="Type">
                    {mouvement.type === 'ENTREE' ? (
                      <span className="badge badge-success">
                        <ArrowUp size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Entrée
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        <ArrowDown size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Sortie
                      </span>
                    )}
                  </td>
                  <td data-label="Article">
                    <strong>{mouvement.article?.nom || 'N/A'}</strong>
                  </td>
                  <td data-label="Quantité"><strong>{mouvement.quantite}</strong></td>
                  <td data-label="Avant">{mouvement.quantite_avant}</td>
                  <td data-label="Après">{mouvement.quantite_apres}</td>
                  <td data-label="Motif">{mouvement.motif || '-'}</td>
                  {canDelete('mouvements') && (
                    <td data-label="Actions">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteClick(mouvement)}
                        title="Supprimer ce mouvement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {mouvements.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={data?.total || 0}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Modal de création de mouvement */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title="Nouveau mouvement de stock"
        size="medium"
      >
        <MouvementForm
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
        size="small"
      >
        {deleteConfirm && (
          <div>
            <p>
              Supprimer le mouvement{' '}
              <strong>
                {deleteConfirm.type === 'ENTREE' ? 'Entrée' : 'Sortie'} de {deleteConfirm.quantite} unité(s)
              </strong>{' '}
              pour <strong>{deleteConfirm.article?.nom || 'N/A'}</strong> ?
            </p>
            <div
              style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                marginTop: '1rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: '#856404'
              }}
            >
              ⚠️ Le stock de l&apos;article ne sera <strong>PAS</strong> mis à jour.
              Vérifiez et corrigez le stock manuellement si nécessaire.
            </div>
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteMutation.isPending}
              >
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Mouvements
