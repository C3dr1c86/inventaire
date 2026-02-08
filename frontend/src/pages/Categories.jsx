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
import Loader from '../components/common/Loader'

function Categories() {
  const queryClient = useQueryClient()
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
            <Layers size={32} />
            Catégories
          </h1>
          <p className="page-subtitle">
            Gérez les catégories pour organiser vos articles
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <Plus size={20} />
          Nouvelle catégorie
        </button>
      </div>

      {/* Liste des catégories */}
      {categoriesTree && categoriesTree.length === 0 ? (
        <div className="empty-state">
          <Layers size={64} />
          <h2>Aucune catégorie</h2>
          <p>Créez votre première catégorie pour commencer à organiser vos articles</p>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus size={20} />
            Créer une catégorie
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
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
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                      <td>
                        📁 {categorie.nom}
                        {categorie.children?.length > 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#6c757d', marginLeft: '0.5rem' }}>
                            ({categorie.children.length} sous-catégorie{categorie.children.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </td>
                      <td>
                        {categorie.description || (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Aucune description
                          </span>
                        )}
                      </td>
                      <td>
                        {new Date(categorie.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(categorie)}
                            className="btn btn-sm btn-secondary"
                            title="Modifier la catégorie"
                            aria-label="Modifier la catégorie"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(categorie)}
                            className="btn btn-sm btn-danger"
                            title="Supprimer la catégorie"
                            aria-label="Supprimer la catégorie"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Sous-catégories (indentées) */}
                    {categorie.children?.map((sousCategorie) => (
                      <tr key={sousCategorie.id} style={{ backgroundColor: '#fff' }}>
                        <td style={{ paddingLeft: '2rem' }}>
                          ↳ {sousCategorie.nom}
                        </td>
                        <td>
                          {sousCategorie.description || (
                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              Aucune description
                            </span>
                          )}
                        </td>
                        <td>
                          {new Date(sousCategorie.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(sousCategorie)}
                              className="btn btn-sm btn-secondary"
                              title="Modifier la sous-catégorie"
                              aria-label="Modifier la sous-catégorie"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(sousCategorie)}
                              className="btn btn-sm btn-danger"
                              title="Supprimer la sous-catégorie"
                              aria-label="Supprimer la sous-catégorie"
                            >
                              <Trash2 size={14} />
                            </button>
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
        <div style={{ padding: '1rem 0' }}>
          <p>
            Êtes-vous sûr de vouloir supprimer la catégorie{' '}
            <strong>{deleteConfirm?.nom}</strong> ?
          </p>
          <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>
            ⚠️ Attention : Les articles de cette catégorie seront reclassés en "Sans catégorie".
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

export default Categories
