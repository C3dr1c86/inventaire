/**
 * Page Articles - Gestion des articles.
 *
 * Affiche la liste des articles avec fonctionnalités CRUD complètes.
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getArticles, createArticle, updateArticle, deleteArticle } from '../services/articleService'
import { getCategoriesTree } from '../services/categorieService'
import { getTags } from '../services/tagService'
import { getFournisseurs } from '../services/fournisseurService'
import { getEmplacements } from '../services/emplacementService'
import api from '../services/api'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Barcode,
  Download,
  Image as ImageIcon,
  Pencil,
  AlertTriangle,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import ArticleForm from '../components/articles/ArticleForm'
import ArticleDetailModal from '../components/articles/ArticleDetailModal'
import Pagination from '../components/common/Pagination'
import SearchBar from '../components/common/SearchBar'
import { usePermissions } from '../hooks/usePermissions'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function Articles() {
  const { canCreate, canUpdate, canDelete } = usePermissions()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [showStockBas, setShowStockBas] = useState(searchParams.get('stock_bas') === 'true')
  const [selectedCategorie, setSelectedCategorie] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedFournisseur, setSelectedFournisseur] = useState('')
  const [selectedEmplacement, setSelectedEmplacement] = useState(searchParams.get('emplacement_id') || '')
  const [showSansEmplacement, setShowSansEmplacement] = useState(false)
  const [sortBy, setSortBy] = useState(null)
  const [sortOrder, setSortOrder] = useState('asc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [articleDetail, setArticleDetail] = useState(null)
  const [barcodeArticle, setBarcodeArticle] = useState(null)
  const [barcodeUrl, setBarcodeUrl] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const queryClient = useQueryClient()

  // Debounce pour la recherche (attendre 500ms après la dernière frappe)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Réinitialiser la page à 1 quand les filtres ou le tri changent
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, showStockBas, selectedCategorie, selectedTag, selectedFournisseur, selectedEmplacement, showSansEmplacement, sortBy, sortOrder])

  // Charger le code-barre quand le modal s'ouvre
  useEffect(() => {
    if (barcodeArticle) {
      const loadBarcode = async () => {
        try {
          const response = await api.get(`/articles/${barcodeArticle.id}/barcode`, {
            responseType: 'blob'
          })
          const url = window.URL.createObjectURL(new Blob([response.data]))
          setBarcodeUrl(url)
        } catch (error) {
          console.error('Erreur lors du chargement du code-barre:', error)
          toast.error('Erreur lors du chargement du code-barre')
        }
      }
      loadBarcode()
    } else {
      if (barcodeUrl) {
        window.URL.revokeObjectURL(barcodeUrl)
        setBarcodeUrl(null)
      }
    }
  }, [barcodeArticle])

  // Récupérer les catégories hiérarchiques pour le filtre
  const { data: categoriesTree } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: getCategoriesTree
  })

  // Récupérer les tags pour le filtre
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags()
  })

  // Récupérer les fournisseurs pour le filtre
  const { data: fournisseurs } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: () => getFournisseurs()
  })

  // Récupérer les emplacements pour le filtre
  const { data: emplacements } = useQuery({
    queryKey: ['emplacements'],
    queryFn: () => getEmplacements()
  })

  // Récupérer les articles
  const skip = (currentPage - 1) * itemsPerPage
  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', { search: debouncedSearchTerm, stock_bas: showStockBas, categorie_id: selectedCategorie, tag_id: selectedTag, fournisseur_id: selectedFournisseur, emplacement_id: showSansEmplacement ? 'null' : selectedEmplacement, sort_by: sortBy, order: sortOrder, skip, limit: itemsPerPage }],
    queryFn: () => getArticles({
      search: debouncedSearchTerm || undefined,
      stock_bas: showStockBas,
      categorie_id: selectedCategorie || undefined,
      tag_id: selectedTag || undefined,
      fournisseur_id: selectedFournisseur || undefined,
      emplacement_id: showSansEmplacement ? 'null' : (selectedEmplacement || undefined),
      sort_by: sortBy || undefined,
      order: sortOrder,
      skip,
      limit: itemsPerPage
    })
  })

  // Mutation pour créer un article
  const createMutation = useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries(['articles'])
      setIsModalOpen(false)
      toast.success('Article créé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création de l\'article')
    }
  })

  // Mutation pour modifier un article
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['articles'])
      setIsModalOpen(false)
      setSelectedArticle(null)
      toast.success('Article modifié avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification de l\'article')
    }
  })

  // Mutation pour supprimer un article
  const deleteMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries(['articles'])
      setDeleteConfirm(null)
      toast.success('Article supprimé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression de l\'article')
      setDeleteConfirm(null)
    }
  })

  // Handlers
  const handleCreateClick = () => {
    setSelectedArticle(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (article) => {
    setSelectedArticle(article)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (article) => {
    setDeleteConfirm(article)
  }

  const handleFormSubmit = (formData) => {
    if (selectedArticle) {
      updateMutation.mutate({ id: selectedArticle.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedArticle(null)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const renderSortIcon = (column) => {
    if (sortBy !== column) return <ChevronsUpDown size={12} className="sort-icon-neutral" />
    return sortOrder === 'asc'
      ? <ChevronUp size={12} />
      : <ChevronDown size={12} />
  }

  const handleBarcodeClick = (article) => {
    setBarcodeArticle(article)
  }

  const handleDownloadBarcode = async (article) => {
    try {
      const response = await api.get(`/articles/${article.id}/barcode`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `barcode_${article.sku}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Code-barre téléchargé')
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Article non trouvé')
      } else if (error.response?.status === 400) {
        toast.error('Cet article n\'a pas de SKU')
      } else if (error.response?.data) {
        const errorText = await error.response.data.text()
        toast.error(`Erreur serveur : ${errorText}`)
      } else {
        toast.error(`Erreur lors du téléchargement : ${error.message}`)
      }
    }
  }

  // État de chargement
  if (isLoading) {
    return (
      <div className="loading-page">
        <span className="spinner spinner-lg" role="status" aria-label="Chargement des articles" />
        <span>Chargement des articles...</span>
      </div>
    )
  }

  // État d'erreur
  if (error) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-info">
            <h1 className="page-title">Articles</h1>
          </div>
        </div>
        <div className="alert alert-danger" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>Erreur lors du chargement des articles : {error.message}</span>
        </div>
      </div>
    )
  }

  const articles = data?.items || []

  return (
    <div>
      {/* En-tête de page */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Articles</h1>
          <p className="page-subtitle">
            {data?.total || 0} article{(data?.total || 0) > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="page-actions">
          {canCreate('articles') && (
            <button className="btn btn-primary" onClick={handleCreateClick}>
              <Plus size={16} aria-hidden="true" />
              Nouvel article
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-body">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un article ou scanner un code-barre..."
            autoFocus={true}
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-body">
          <div className="filters-bar">
            <div className="filter-item">
              <select
                className="form-control form-select"
                value={selectedCategorie}
                onChange={(e) => setSelectedCategorie(e.target.value)}
                aria-label="Filtrer par catégorie"
              >
                <option value="">Toutes les catégories</option>
                {categoriesTree?.map(cat => (
                  cat.children && cat.children.length > 0 ? (
                    <optgroup key={cat.id} label={`📁 ${cat.nom}`}>
                      <option value={cat.id}>{cat.nom} (toutes)</option>
                      {cat.children.map(sousCat => (
                        <option key={sousCat.id} value={sousCat.id}>↳ {sousCat.nom}</option>
                      ))}
                    </optgroup>
                  ) : (
                    <option key={cat.id} value={cat.id}>📁 {cat.nom}</option>
                  )
                ))}
              </select>
            </div>

            <div className="filter-item">
              <select
                className="form-control form-select"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                aria-label="Filtrer par tag"
              >
                <option value="">Tous les tags</option>
                {tags?.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.nom}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <select
                className="form-control form-select"
                value={selectedFournisseur}
                onChange={(e) => setSelectedFournisseur(e.target.value)}
                aria-label="Filtrer par fournisseur"
              >
                <option value="">Tous les fournisseurs</option>
                {fournisseurs?.map(fournisseur => (
                  <option key={fournisseur.id} value={fournisseur.id}>{fournisseur.nom}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <select
                className="form-control form-select"
                value={showSansEmplacement ? 'sans' : selectedEmplacement}
                onChange={(e) => {
                  if (e.target.value === 'sans') {
                    setShowSansEmplacement(true)
                    setSelectedEmplacement('')
                  } else {
                    setShowSansEmplacement(false)
                    setSelectedEmplacement(e.target.value)
                  }
                }}
                aria-label="Filtrer par emplacement"
              >
                <option value="">Tous les emplacements</option>
                <option value="sans">📍 Sans emplacement</option>
                {emplacements?.map(emplacement => (
                  <option key={emplacement.id} value={emplacement.id}>
                    {emplacement.code_complet || emplacement.code}
                  </option>
                ))}
              </select>
            </div>

            <label className="filter-check">
              <input
                type="checkbox"
                checked={showStockBas}
                onChange={(e) => setShowStockBas(e.target.checked)}
              />
              <span>Stock bas uniquement</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tableau des articles */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            Liste des articles ({data?.total || 0})
          </h2>
        </div>

        {articles.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <ImageIcon className="empty-state-icon" aria-hidden="true" />
              <p className="empty-state-title">Aucun article trouvé</p>
              <p className="empty-state-description">
                {searchTerm || showStockBas || selectedCategorie || selectedTag
                  ? 'Aucun article ne correspond à vos filtres.'
                  : 'Commencez par créer votre premier article.'}
              </p>
              {canCreate('articles') && !searchTerm && !showStockBas && (
                <button className="btn btn-primary" onClick={handleCreateClick}>
                  <Plus size={16} aria-hidden="true" />
                  Créer votre premier article
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Photo</th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('id')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('id')}
                      tabIndex={0}
                      aria-sort={sortBy === 'id' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span className="th-sort">ID {renderSortIcon('id')}</span>
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('nom')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('nom')}
                      tabIndex={0}
                      aria-sort={sortBy === 'nom' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span className="th-sort">Nom {renderSortIcon('nom')}</span>
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('sku')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('sku')}
                      tabIndex={0}
                      aria-sort={sortBy === 'sku' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span className="th-sort">SKU {renderSortIcon('sku')}</span>
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('quantite')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('quantite')}
                      tabIndex={0}
                      aria-sort={sortBy === 'quantite' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span className="th-sort">Quantité {renderSortIcon('quantite')}</span>
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('prix_unitaire')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('prix_unitaire')}
                      tabIndex={0}
                      aria-sort={sortBy === 'prix_unitaire' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span className="th-sort">Prix unit. {renderSortIcon('prix_unitaire')}</span>
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('categorie')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('categorie')}
                      tabIndex={0}
                      aria-sort={sortBy === 'categorie' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span className="th-sort">Catégorie {renderSortIcon('categorie')}</span>
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('valeur')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('valeur')}
                      tabIndex={0}
                      aria-sort={sortBy === 'valeur' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <span className="th-sort">Valeur {renderSortIcon('valeur')}</span>
                    </th>
                    <th>Tags</th>
                    <th>Fournisseurs</th>
                    <th>Emplacement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id}>
                      {/* Photo */}
                      <td data-label="Photo">
                        {article.photos && article.photos.length > 0 ? (
                          <img
                            className="article-thumb"
                            src={`${API_URL.replace('/api', '')}/uploads/${article.photos[0].thumbnail_path || article.photos[0].filepath}`}
                            alt={article.nom}
                          />
                        ) : (
                          <div className="article-thumb-placeholder" aria-hidden="true">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>

                      {/* ID */}
                      <td data-label="ID" className="text-muted">
                        {article.id}
                      </td>

                      {/* Nom */}
                      <td data-label="Nom">
                        <button
                          className="article-name-link"
                          onClick={() => setArticleDetail(article)}
                          title="Voir les détails"
                          type="button"
                        >
                          {article.nom}
                        </button>
                        {article.est_stock_bas && (
                          <span className="badge badge-danger badge-inline">Stock bas</span>
                        )}
                      </td>

                      {/* SKU */}
                      <td data-label="SKU">
                        {article.sku ? (
                          <div className="sku-cell">
                            <code className="sku-code">{article.sku}</code>
                            <button
                              onClick={() => handleBarcodeClick(article)}
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Voir le code-barre"
                              aria-label="Voir le code-barre"
                              type="button"
                            >
                              <Barcode size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Quantité */}
                      <td
                        data-label="Quantité"
                        className={
                          article.quantite === 0
                            ? 'cell-danger'
                            : article.est_stock_bas
                            ? 'cell-warning'
                            : ''
                        }
                      >
                        {article.quantite} / {article.quantite_min}
                      </td>

                      {/* Prix */}
                      <td data-label="Prix unitaire">
                        {article.prix_unitaire.toFixed(2)} €
                      </td>

                      {/* Catégorie */}
                      <td data-label="Catégorie">
                        <span className="badge badge-neutral">
                          {article.categorie?.nom || 'Sans catégorie'}
                        </span>
                      </td>

                      {/* Valeur */}
                      <td data-label="Valeur">
                        <strong>{article.valeur_stock.toFixed(2)} €</strong>
                      </td>

                      {/* Tags */}
                      <td data-label="Tags">
                        {article.tags && article.tags.length > 0 ? (
                          <div className="tag-pills">
                            {article.tags.map(tag => (
                              <span
                                key={tag.id}
                                className="tag-pill"
                                style={{ backgroundColor: tag.couleur || 'var(--color-primary-500)' }}
                              >
                                {tag.nom}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Fournisseurs */}
                      <td data-label="Fournisseurs">
                        {article.fournisseurs && article.fournisseurs.length > 0 ? (
                          <div className="tag-pills">
                            {article.fournisseurs.map(fournisseur => (
                              <span
                                key={fournisseur.id}
                                className="badge badge-neutral"
                                title={fournisseur.contact || fournisseur.nom}
                              >
                                🚚 {fournisseur.nom}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Emplacement */}
                      <td data-label="Emplacement">
                        {article.emplacement ? (
                          <span title={article.emplacement.code_complet}>
                            📍 {article.emplacement.code}
                          </span>
                        ) : (
                          <span className="text-muted">Non défini</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td data-label="Actions">
                        <div className="action-buttons">
                          {canUpdate('articles') && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleEditClick(article)}
                              title="Modifier"
                              aria-label="Modifier l'article"
                              type="button"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete('articles') && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleDeleteClick(article)}
                              title="Supprimer"
                              aria-label="Supprimer l'article"
                              type="button"
                            >
                              <Trash2 size={14} className="text-danger" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="card-footer">
              <Pagination
                currentPage={currentPage}
                totalItems={data?.total || 0}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal création / modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedArticle ? 'Modifier l\'article' : 'Nouvel article'}
        size="large"
      >
        <ArticleForm
          article={selectedArticle}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
        size="small"
      >
        <div className="confirm-delete-body">
          <AlertTriangle size={24} className="confirm-delete-icon" aria-hidden="true" />
          <div>
            <p>
              Êtes-vous sûr de vouloir supprimer l'article{' '}
              <strong>{deleteConfirm?.nom}</strong> ?
            </p>
            <p className="text-muted" style={{ marginTop: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
              Cette action est irréversible.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setDeleteConfirm(null)}
            disabled={deleteMutation.isPending}
            type="button"
          >
            Annuler
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDeleteConfirm}
            disabled={deleteMutation.isPending}
            type="button"
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </Modal>

      {/* Modal code-barre */}
      <Modal
        isOpen={!!barcodeArticle}
        onClose={() => setBarcodeArticle(null)}
        title={`Code-barre — ${barcodeArticle?.nom}`}
        size="medium"
      >
        {barcodeArticle && (
          <div className="barcode-modal">
            <p className="barcode-sku">
              SKU : <code>{barcodeArticle.sku}</code>
            </p>
            <div className="barcode-container">
              {barcodeUrl ? (
                <img
                  src={barcodeUrl}
                  alt={`Code-barre ${barcodeArticle.sku}`}
                  className="barcode-image"
                />
              ) : (
                <div className="loading-page" style={{ minHeight: '120px' }}>
                  <span className="spinner" role="status" aria-label="Chargement du code-barre" />
                  <span className="text-muted">Chargement...</span>
                </div>
              )}
            </div>
            <div className="barcode-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleDownloadBarcode(barcodeArticle)}
                type="button"
              >
                <Download size={16} aria-hidden="true" />
                Télécharger
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setBarcodeArticle(null)}
                type="button"
              >
                Fermer
              </button>
            </div>
            <p className="barcode-hint text-muted">
              Imprimez ce code-barre pour l'apposer sur votre article.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal détails article */}
      {articleDetail && (
        <ArticleDetailModal
          article={articleDetail}
          onClose={() => setArticleDetail(null)}
        />
      )}
    </div>
  )
}

export default Articles
