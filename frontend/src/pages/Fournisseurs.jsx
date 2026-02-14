/**
 * Page de gestion des fournisseurs.
 *
 * Permet de lister, créer, modifier et supprimer des fournisseurs.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getFournisseurs, deleteFournisseur, createFournisseur, updateFournisseur } from '../services/fournisseurService'
import { Plus, Edit2, Trash2, Truck } from 'lucide-react'
import Modal from '../components/common/Modal'
import FournisseurForm from '../components/fournisseurs/FournisseurForm'
import Loader from '../components/common/Loader'
import { usePermissions } from '../hooks/usePermissions'

function Fournisseurs() {
  const queryClient = useQueryClient()
  const { canCreate, canUpdate, canDelete } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFournisseur, setSelectedFournisseur] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Query pour récupérer les fournisseurs
  const { data: fournisseurs, isLoading } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: () => getFournisseurs()
  })

  // Mutation pour créer un fournisseur
  const createMutation = useMutation({
    mutationFn: createFournisseur,
    onSuccess: () => {
      queryClient.invalidateQueries(['fournisseurs'])
      queryClient.invalidateQueries(['articles'])
      setIsModalOpen(false)
      toast.success('Fournisseur créé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création')
    }
  })

  // Mutation pour modifier un fournisseur
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateFournisseur(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fournisseurs'])
      queryClient.invalidateQueries(['articles'])
      setIsModalOpen(false)
      setSelectedFournisseur(null)
      toast.success('Fournisseur modifié avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification')
    }
  })

  // Mutation pour supprimer un fournisseur
  const deleteMutation = useMutation({
    mutationFn: deleteFournisseur,
    onSuccess: () => {
      queryClient.invalidateQueries(['fournisseurs'])
      queryClient.invalidateQueries(['articles'])
      setDeleteConfirm(null)
      toast.success('Fournisseur supprimé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
      setDeleteConfirm(null)
    }
  })

  // Handlers
  const handleCreate = () => {
    setSelectedFournisseur(null)
    setIsModalOpen(true)
  }

  const handleEdit = (fournisseur) => {
    setSelectedFournisseur(fournisseur)
    setIsModalOpen(true)
  }

  const handleDelete = (fournisseur) => {
    setDeleteConfirm(fournisseur)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id)
    }
  }

  const handleSubmit = (data) => {
    if (selectedFournisseur) {
      updateMutation.mutate({ id: selectedFournisseur.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <Loader />
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck size={32} />
            Fournisseurs
          </h1>
          <p className="page-subtitle">
            Gérez vos fournisseurs et leurs coordonnées
          </p>
        </div>
        {canCreate('fournisseurs') && (
          <button
            onClick={handleCreate}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Plus size={20} />
            Nouveau fournisseur
          </button>
        )}
      </div>

      {/* Liste des fournisseurs */}
      {fournisseurs && fournisseurs.length === 0 ? (
        <div className="empty-state">
          <Truck size={64} />
          <h2>Aucun fournisseur</h2>
          <p>Créez votre premier fournisseur pour commencer à gérer vos relations commerciales</p>
          {canCreate('fournisseurs') && (
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus size={20} />
              Créer un fournisseur
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fournisseurs?.map((fournisseur) => (
                  <tr key={fournisseur.id}>
                    <td style={{ fontWeight: '500' }}>{fournisseur.nom}</td>
                    <td>
                      {fournisseur.contact || (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          -
                        </span>
                      )}
                    </td>
                    <td>
                      {fournisseur.email ? (
                        <a href={`mailto:${fournisseur.email}`} className="link">
                          {fournisseur.email}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          -
                        </span>
                      )}
                    </td>
                    <td>
                      {fournisseur.telephone ? (
                        <a href={`tel:${fournisseur.telephone}`} className="link">
                          {fournisseur.telephone}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          -
                        </span>
                      )}
                    </td>
                    <td>
                      {new Date(fournisseur.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {canUpdate('fournisseurs') && (
                          <button
                            onClick={() => handleEdit(fournisseur)}
                            className="btn btn-sm btn-secondary"
                            title="Modifier le fournisseur"
                            aria-label="Modifier le fournisseur"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete('fournisseurs') && (
                          <button
                            onClick={() => handleDelete(fournisseur)}
                            className="btn btn-sm btn-danger"
                            title="Supprimer le fournisseur"
                            aria-label="Supprimer le fournisseur"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedFournisseur(null)
        }}
        title={selectedFournisseur ? 'Modifier le fournisseur' : 'Créer un fournisseur'}
      >
        <FournisseurForm
          fournisseur={selectedFournisseur}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setSelectedFournisseur(null)
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
      >
        <div style={{ padding: '1rem 0' }}>
          <p>
            Êtes-vous sûr de vouloir supprimer le fournisseur{' '}
            <strong>{deleteConfirm?.nom}</strong> ?
          </p>
          <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>
            ⚠️ Cette action échouera si le fournisseur est associé à des articles.
          </p>
          <div className="modal-actions" style={{ marginTop: '2rem' }}>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn btn-secondary"
              disabled={deleteMutation.isPending}
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              className="btn btn-danger"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Fournisseurs
