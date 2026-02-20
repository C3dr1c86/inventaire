/**
 * Page de gestion des tags.
 *
 * Permet de lister, créer, modifier et supprimer des tags.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getTags, deleteTag, createTag, updateTag } from '../services/tagService'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
import Modal from '../components/common/Modal'
import TagForm from '../components/tags/TagForm'
import { usePermissions } from '../hooks/usePermissions'

function Tags() {
  const queryClient = useQueryClient()
  const { canCreate, canUpdate, canDelete } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Query pour récupérer les tags
  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags()
  })

  // Mutation pour créer un tag
  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries(['tags'])
      setIsModalOpen(false)
      toast.success('Tag créé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création')
    }
  })

  // Mutation pour modifier un tag
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tags'])
      queryClient.invalidateQueries(['articles'])
      setIsModalOpen(false)
      setSelectedTag(null)
      toast.success('Tag modifié avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification')
    }
  })

  // Mutation pour supprimer un tag
  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries(['tags'])
      queryClient.invalidateQueries(['articles'])
      setDeleteConfirm(null)
      toast.success('Tag supprimé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
      setDeleteConfirm(null)
    }
  })

  // Handlers
  const handleCreate = () => {
    setSelectedTag(null)
    setIsModalOpen(true)
  }

  const handleEdit = (tag) => {
    setSelectedTag(tag)
    setIsModalOpen(true)
  }

  const handleDelete = (tag) => {
    setDeleteConfirm(tag)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id)
    }
  }

  const handleSubmit = (data) => {
    if (selectedTag) {
      updateMutation.mutate({ id: selectedTag.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner-lg" />
        <span>Chargement des tags...</span>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Tag size={28} />
            Tags
          </h1>
          <p className="page-subtitle">
            Gérez les tags pour identifier et classer vos articles
          </p>
        </div>
        <div className="page-actions">
          {canCreate('tags') && (
            <button
              onClick={handleCreate}
              className="btn btn-primary"
              aria-label="Créer un nouveau tag"
            >
              <Plus size={18} />
              Nouveau tag
            </button>
          )}
        </div>
      </div>

      {/* Liste des tags */}
      {tags && tags.length === 0 ? (
        <div className="empty-state">
          <Tag size={56} className="empty-state-icon" />
          <h2 className="empty-state-title">Aucun tag</h2>
          <p className="empty-state-description">
            Créez votre premier tag pour identifier et classer vos articles
          </p>
          {canCreate('tags') && (
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus size={18} />
              Créer un tag
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Couleur</th>
                  <th>Aperçu</th>
                  <th>Description</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags?.map((tag) => (
                  <tr key={tag.id}>
                    <td data-label="ID">{tag.id}</td>
                    <td data-label="Nom">
                      <strong>{tag.nom}</strong>
                    </td>
                    <td data-label="Couleur">
                      <code className="sku-code">{tag.couleur}</code>
                    </td>
                    <td data-label="Aperçu">
                      <span
                        className="tag-pill"
                        style={{ backgroundColor: tag.couleur }}
                      >
                        {tag.nom}
                      </span>
                    </td>
                    <td data-label="Description">
                      {tag.description || (
                        <span className="text-muted">Aucune description</span>
                      )}
                    </td>
                    <td data-label="Créé le">
                      {new Date(tag.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        {canUpdate('tags') && (
                          <button
                            onClick={() => handleEdit(tag)}
                            className="btn btn-sm btn-secondary"
                            title="Modifier le tag"
                            aria-label="Modifier le tag"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete('tags') && (
                          <button
                            onClick={() => handleDelete(tag)}
                            className="btn btn-sm btn-danger"
                            title="Supprimer le tag"
                            aria-label="Supprimer le tag"
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
          setSelectedTag(null)
        }}
        title={selectedTag ? 'Modifier le tag' : 'Créer un tag'}
      >
        <TagForm
          tag={selectedTag}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setSelectedTag(null)
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
        <div className="modal-body">
          <p>
            Êtes-vous sûr de vouloir supprimer le tag{' '}
            <span className="tag-pill" style={{ backgroundColor: deleteConfirm?.couleur }}>
              {deleteConfirm?.nom}
            </span>{' '}
            ?
          </p>
          <div className="alert alert-warning" style={{ marginTop: 'var(--space-4)' }}>
            ⚠️ Ce tag sera retiré de tous les articles associés.
          </div>
        </div>
        <div className="modal-footer">
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
      </Modal>
    </div>
  )
}

export default Tags
