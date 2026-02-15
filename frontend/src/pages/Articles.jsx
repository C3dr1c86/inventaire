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
import { Plus, Trash2, ChevronUp, ChevronDown, Barcode, Download, Image as ImageIcon } from 'lucide-react'
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
      // Nettoyer l'URL du blob quand le modal se ferme
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
      // Si on clique sur la même colonne, inverser l'ordre
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Nouvelle colonne, trier en ordre croissant
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const renderSortIcon = (column) => {
    if (sortBy !== column) {
      return null
    }
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  const handleBarcodeClick = (article) => {
    setBarcodeArticle(article)
  }

  const handleDownloadBarcode = async (article) => {
    try {
      console.log('Téléchargement barcode pour article:', article.id, 'SKU:', article.sku)

      const response = await api.get(`/articles/${article.id}/barcode`, {
        responseType: 'blob'
      })

      console.log('Blob reçu, taille:', response.data.size, 'type:', response.data.type)

      // Créer un lien de téléchargement
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
      console.error('Erreur lors du téléchargement du code-barre:', error)
      console.error('Détails erreur:', error.response)

      if (error.response?.status === 404) {
        toast.error('Article non trouvé')
      } else if (error.response?.status === 400) {
        toast.error('Cet article n\'a pas de SKU')
      } else if (error.response?.data) {
        // Essayer de lire le message d'erreur du blob
        const errorBlob = error.response.data
        const errorText = await errorBlob.text()
        console.error('Message erreur serveur:', errorText)
        toast.error(`Erreur serveur: ${errorText}`)
      } else {
        toast.error(`Erreur lors du téléchargement: ${error.message}`)
      }
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Articles</h1>
        <div className="loader"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Articles</h1>
        <div className="alert alert-danger">
          Erreur lors du chargement des articles : {error.message}
        </div>
      </div>
    )
  }

  const articles = data?.items || []

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Articles</h1>
        {canCreate('articles') && (
          <button className="btn btn-primary" onClick={handleCreateClick}>
            <Plus size={18} />
            Nouvel article
          </button>
        )}
      </div>

      {/* Barre de recherche */}
      <SearchBar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Rechercher un article ou scanner un code-barre..."
        autoFocus={true}
      />

      {/* Filtres */}
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-control"
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {categoriesTree?.map(cat => (
                cat.children && cat.children.length > 0 ? (
                  // Catégorie avec sous-catégories : utiliser optgroup
                  <optgroup key={cat.id} label={`📁 ${cat.nom}`}>
                    <option value={cat.id}>
                      {cat.nom} (toutes)
                    </option>
                    {cat.children.map(sousCat => (
                      <option key={sousCat.id} value={sousCat.id}>
                        ↳ {sousCat.nom}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  // Catégorie racine sans sous-catégories
                  <option key={cat.id} value={cat.id}>
                    📁 {cat.nom}
                  </option>
                )
              ))}
            </select>
          </div>
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-control"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">Tous les tags</option>
              {tags?.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.nom}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-control"
              value={selectedFournisseur}
              onChange={(e) => setSelectedFournisseur(e.target.value)}
            >
              <option value="">Tous les fournisseurs</option>
              {fournisseurs?.map(fournisseur => (
                <option key={fournisseur.id} value={fournisseur.id}>
                  {fournisseur.nom}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-control"
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={showStockBas}
              onChange={(e) => setShowStockBas(e.target.checked)}
            />
            <span>Stock bas uniquement</span>
          </label>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="card">
        <h2 className="card-header">
          Liste des articles ({data?.total || 0})
        </h2>

        {articles.length === 0 ? (
          <div className="card-body text-center">
            <p>Aucun article trouvé.</p>
            <button className="btn btn-primary mt-2" onClick={handleCreateClick}>
              <Plus size={18} />
              Créer votre premier article
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Photo</th>
                <th
                  onClick={() => handleSort('id')}
                  onKeyPress={(e) => e.key === 'Enter' && handleSort('id')}
                  tabIndex={0}
                  role="button"
                  aria-label="Trier par ID"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ID {renderSortIcon('id')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('nom')}
                  onKeyPress={(e) => e.key === 'Enter' && handleSort('nom')}
                  tabIndex={0}
                  role="button"
                  aria-label="Trier par nom"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Nom {renderSortIcon('nom')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sku')}
                  onKeyPress={(e) => e.key === 'Enter' && handleSort('sku')}
                  tabIndex={0}
                  role="button"
                  aria-label="Trier par SKU"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    SKU {renderSortIcon('sku')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantite')}
                  onKeyPress={(e) => e.key === 'Enter' && handleSort('quantite')}
                  tabIndex={0}
                  role="button"
                  aria-label="Trier par quantité"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Quantité {renderSortIcon('quantite')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('prix_unitaire')}
                  onKeyPress={(e) => e.key === 'Enter' && handleSort('prix_unitaire')}
                  tabIndex={0}
                  role="button"
                  aria-label="Trier par prix unitaire"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Prix unitaire {renderSortIcon('prix_unitaire')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('categorie')}
                  onKeyPress={(e) => e.key === 'Enter' && handleSort('categorie')}
                  tabIndex={0}
                  role="button"
                  aria-label="Trier par catégorie"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Catégorie {renderSortIcon('categorie')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valeur')}
                  onKeyPress={(e) => e.key === 'Enter' && handleSort('valeur')}
                  tabIndex={0}
                  role="button"
                  aria-label="Trier par valeur"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Valeur {renderSortIcon('valeur')}
                  </div>
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
                  <td data-label="Photo">
                    {article.photos && article.photos.length > 0 ? (
                      <img
                        src={`${API_URL.replace('/api', '')}/uploads/${article.photos[0].thumbnail_path || article.photos[0].filepath}`}
                        alt={article.nom}
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #dee2e6'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px',
                          border: '1px solid #dee2e6',
                          color: '#6c757d'
                        }}
                      >
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td data-label="ID">{article.id}</td>
                  <td data-label="Nom">
                    <div>
                      <strong
                        onClick={() => setArticleDetail(article)}
                        style={{
                          cursor: 'pointer',
                          color: 'var(--primary)',
                          textDecoration: 'underline',
                          textDecorationStyle: 'dotted'
                        }}
                        title="Cliquez pour voir les détails"
                      >
                        {article.nom}
                      </strong>
                      {article.est_stock_bas && (
                        <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>
                          Stock bas
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="SKU">
                    {article.sku ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ fontSize: '0.875rem' }}>{article.sku}</code>
                        <button
                          onClick={() => handleBarcodeClick(article)}
                          className="btn btn-sm"
                          style={{ padding: '0.25rem', minWidth: 'auto' }}
                          title="Voir le code-barre"
                          aria-label="Voir le code-barre"
                        >
                          <Barcode size={16} />
                        </button>
                      </div>
                    ) : '-'}
                  </td>
                  <td data-label="Quantité">
                    {article.quantite} / {article.quantite_min}
                  </td>
                  <td data-label="Prix unitaire">{article.prix_unitaire.toFixed(2)} €</td>
                  <td data-label="Catégorie">{article.categorie?.nom || 'Sans catégorie'}</td>
                  <td data-label="Valeur"><strong>{article.valeur_stock.toFixed(2)} €</strong></td>
                  <td data-label="Tags">
                    {article.tags && article.tags.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {article.tags.map(tag => (
                          <span
                            key={tag.id}
                            style={{
                              display: 'inline-block',
                              padding: '0.125rem 0.5rem',
                              fontSize: '0.75rem',
                              borderRadius: '0.75rem',
                              backgroundColor: tag.couleur || '#3498db',
                              color: '#fff',
                              fontWeight: 500
                            }}
                          >
                            {tag.nom}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>-</span>
                    )}
                  </td>
                  <td data-label="Fournisseurs">
                    {article.fournisseurs && article.fournisseurs.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {article.fournisseurs.map(fournisseur => (
                          <span
                            key={fournisseur.id}
                            style={{
                              display: 'inline-block',
                              padding: '0.125rem 0.5rem',
                              fontSize: '0.75rem',
                              borderRadius: '0.75rem',
                              backgroundColor: '#6c757d',
                              color: '#fff',
                              fontWeight: 500
                            }}
                            title={fournisseur.contact || fournisseur.nom}
                          >
                            🚚 {fournisseur.nom}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>-</span>
                    )}
                  </td>
                  <td data-label="Emplacement">
                    {article.emplacement ? (
                      <span title={article.emplacement.code_complet}>
                        📍 {article.emplacement.code}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>Non défini</span>
                    )}
                  </td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {canUpdate('articles') && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditClick(article)}
                        >
                          Modifier
                        </button>
                      )}
                      {canDelete('articles') && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteClick(article)}
                          aria-label="Supprimer l'article"
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
        )}

        {/* Pagination */}
        {articles.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={data?.total || 0}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Modal de création/modification */}
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

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
        size="small"
      >
        <div>
          <p>
            Êtes-vous sûr de vouloir supprimer l'article <strong>{deleteConfirm?.nom}</strong> ?
          </p>
          <p style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Cette action est irréversible.
          </p>
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
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
      </Modal>

      {/* Modal affichage code-barre */}
      <Modal
        isOpen={!!barcodeArticle}
        onClose={() => setBarcodeArticle(null)}
        title={`Code-barre - ${barcodeArticle?.nom}`}
        size="medium"
      >
        {barcodeArticle && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                SKU : <code style={{ fontSize: '1rem', fontWeight: 'bold' }}>{barcodeArticle.sku}</code>
              </p>
            </div>

            <div style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              minWidth: '400px',
              minHeight: '200px'
            }}>
              {barcodeUrl ? (
                <img
                  src={barcodeUrl}
                  alt={`Code-barre ${barcodeArticle.sku}`}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Chargement du code-barre...</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => handleDownloadBarcode(barcodeArticle)}
                className="btn btn-primary"
                style={{ gap: '0.5rem' }}
              >
                <Download size={18} />
                Télécharger
              </button>
              <button
                onClick={() => setBarcodeArticle(null)}
                className="btn btn-secondary"
              >
                Fermer
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
              💡 Imprimez ce code-barre pour l'apposer sur votre article
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
