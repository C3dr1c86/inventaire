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
import Loader from '../components/common/Loader'

function Tags() {
  const queryClient = useQueryClient()
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
            <Tag size={32} />
            Tags
          </h1>
          <p className="page-subtitle">
            Gérez les tags pour identifier et classer vos articles
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <Plus size={20} />
          Nouveau tag
        </button>
      </div>

      {/* Liste des tags */}
      {tags && tags.length === 0 ? (
        <div className="empty-state">
          <Tag size={64} />
          <h2>Aucun tag</h2>
          <p>Créez votre premier tag pour identifier et classer vos articles</p>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus size={20} />
            Créer un tag
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
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
                    <td>{tag.id}</td>
                    <td>
                      <strong>{tag.nom}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.875rem' }}>{tag.couleur}</code>
                    </td>
                    <td>
                      <span
                        className="tag-badge"
                        style={{ backgroundColor: tag.couleur }}
                      >
                        {tag.nom}
                      </span>
                    </td>
                    <td>
                      {tag.description || (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          Aucune description
                        </span>
                      )}
                    </td>
                    <td>
                      {new Date(tag.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(tag)}
                          className="btn btn-sm btn-secondary"
                          title="Modifier le tag"
                          aria-label="Modifier le tag"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(tag)}
                          className="btn btn-sm btn-danger"
                          title="Supprimer le tag"
                          aria-label="Supprimer le tag"
                        >
                          <Trash2 size={14} />
                        </button>
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
        <div style={{ padding: '1rem 0' }}>
          <p>
            Êtes-vous sûr de vouloir supprimer le tag{' '}
            <span className="tag-badge" style={{ backgroundColor: deleteConfirm?.couleur }}>
              {deleteConfirm?.nom}
            </span>{' '}
            ?
          </p>
          <p style={{ color: 'var(--warning)', marginTop: '1rem' }}>
            ⚠️ Ce tag sera retiré de tous les articles associés.
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

export default Tags
