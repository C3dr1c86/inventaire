/**
 * Page de gestion des catégories.
 *
 * Permet de lister, créer, modifier et supprimer des catégories.
 */

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getCategoriesTree, deleteCategorie, createCategorie, updateCategorie } from '../services/categorieService'
import { Plus, Edit2, Trash2, Layers } from 'lucide-react'
import Modal from '../components/common/Modal'
import CategorieForm from '../components/categories/CategorieForm'
import { usePermissions } from '../hooks/usePermissions'

function Categories() {
  const queryClient = useQueryClient()
  const { canCreate, canUpdate, canDelete } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategorie, setSelectedCategorie] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Query pour récupérer l'arbre des catégories
  const { data: categoriesTree, isLoading } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: getCategoriesTree
  })

  // Mutation pour créer une catégorie
  const createMutation = useMutation({
    mutationFn: createCategorie,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
      queryClient.invalidateQueries(['categories-tree'])
      queryClient.invalidateQueries(['categories-racines'])
      queryClient.invalidateQueries(['statistiques'])
      setIsModalOpen(false)
      toast.success('Catégorie créée avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création')
    }
  })

  // Mutation pour modifier une catégorie
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCategorie(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
      queryClient.invalidateQueries(['categories-tree'])
      queryClient.invalidateQueries(['categories-racines'])
      queryClient.invalidateQueries(['statistiques'])
      setIsModalOpen(false)
      setSelectedCategorie(null)
      toast.success('Catégorie modifiée avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification')
    }
  })

  // Mutation pour supprimer une catégorie
  const deleteMutation = useMutation({
    mutationFn: deleteCategorie,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
      queryClient.invalidateQueries(['categories-tree'])
      queryClient.invalidateQueries(['categories-racines'])
      queryClient.invalidateQueries(['statistiques'])
      queryClient.invalidateQueries(['articles'])
      setDeleteConfirm(null)
      toast.success('Catégorie supprimée avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
      setDeleteConfirm(null)
    }
  })

  // Handlers
  const handleCreate = () => {
    setSelectedCategorie(null)
    setIsModalOpen(true)
  }

  const handleEdit = (categorie) => {
    setSelectedCategorie(categorie)
    setIsModalOpen(true)
  }

  const handleDelete = (categorie) => {
    setDeleteConfirm(categorie)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id)
    }
  }

  const handleSubmit = (data) => {
    if (selectedCategorie) {
      updateMutation.mutate({ id: selectedCategorie.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner-lg" />
        <span>Chargement des catégories...</span>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Layers size={28} />
            Catégories
          </h1>
          <p className="page-subtitle">
            Gérez les catégories pour organiser vos articles
          </p>
        </div>
        <div className="page-actions">
          {canCreate('categories') && (
            <button
              onClick={handleCreate}
              className="btn btn-primary"
              aria-label="Créer une nouvelle catégorie"
            >
              <Plus size={18} />
              Nouvelle catégorie
            </button>
          )}
        </div>
      </div>

      {/* Liste des catégories */}
      {categoriesTree && categoriesTree.length === 0 ? (
        <div className="empty-state">
          <Layers size={56} className="empty-state-icon" />
          <h2 className="empty-state-title">Aucune catégorie</h2>
          <p className="empty-state-description">
            Créez votre première catégorie pour commencer à organiser vos articles
          </p>
          {canCreate('categories') && (
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus size={18} />
              Créer une catégorie
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Créée le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesTree?.map((categorie) => (
                  <React.Fragment key={categorie.id}>
                    {/* Catégorie racine */}
                    <tr className="categorie-racine-row">
                      <td data-label="Nom">
                        📁 <strong>{categorie.nom}</strong>
                        {categorie.children?.length > 0 && (
                          <span className="categorie-count">
                            ({categorie.children.length} sous-catégorie{categorie.children.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </td>
                      <td data-label="Description">
                        {categorie.description || (
                          <span className="text-muted">Aucune description</span>
                        )}
                      </td>
                      <td data-label="Créée le">
                        {new Date(categorie.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          {canUpdate('categories') && (
                            <button
                              onClick={() => handleEdit(categorie)}
                              className="btn btn-sm btn-secondary"
                              title="Modifier la catégorie"
                              aria-label="Modifier la catégorie"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete('categories') && (
                            <button
                              onClick={() => handleDelete(categorie)}
                              className="btn btn-sm btn-danger"
                              title="Supprimer la catégorie"
                              aria-label="Supprimer la catégorie"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Sous-catégories (indentées) */}
                    {categorie.children?.map((sousCategorie) => (
                      <tr key={sousCategorie.id} className="categorie-enfant-row">
                        <td data-label="Nom" className="categorie-enfant-nom">
                          ↳ {sousCategorie.nom}
                        </td>
                        <td data-label="Description">
                          {sousCategorie.description || (
                            <span className="text-muted">Aucune description</span>
                          )}
                        </td>
                        <td data-label="Créée le">
                          {new Date(sousCategorie.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td data-label="Actions">
                          <div className="action-buttons">
                            {canUpdate('categories') && (
                              <button
                                onClick={() => handleEdit(sousCategorie)}
                                className="btn btn-sm btn-secondary"
                                title="Modifier la sous-catégorie"
                                aria-label="Modifier la sous-catégorie"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                            {canDelete('categories') && (
                              <button
                                onClick={() => handleDelete(sousCategorie)}
                                className="btn btn-sm btn-danger"
                                title="Supprimer la sous-catégorie"
                                aria-label="Supprimer la sous-catégorie"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
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
          setSelectedCategorie(null)
        }}
        title={selectedCategorie ? 'Modifier la catégorie' : 'Créer une catégorie'}
      >
        <CategorieForm
          initialData={selectedCategorie}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setSelectedCategorie(null)
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
            Êtes-vous sûr de vouloir supprimer la catégorie{' '}
            <strong>{deleteConfirm?.nom}</strong> ?
          </p>
          <div className="alert alert-warning" style={{ marginTop: 'var(--space-4)' }}>
            ⚠️ Attention : Les articles de cette catégorie seront reclassés en "Sans catégorie".
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

export default Categories
