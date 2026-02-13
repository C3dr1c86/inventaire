/**
 * Page Mouvements - Gestion des mouvements de stock.
 *
 * Permet d'enregistrer des entrées/sorties et de consulter l'historique.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getMouvements, createMouvement } from '../services/mouvementService'
import { ArrowUp, ArrowDown, Plus } from 'lucide-react'
import { format } from 'date-fns'
import Modal from '../components/common/Modal'
import MouvementForm from '../components/mouvements/MouvementForm'
import Pagination from '../components/common/Pagination'
import { usePermissions } from '../hooks/usePermissions'

function Mouvements() {
  const { canCreate } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const handleCreateClick = () => {
    setIsModalOpen(true)
  }

  const handleFormSubmit = (formData) => {
    createMutation.mutate(formData)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
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
    </div>
  )
}

export default Mouvements
