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
import { Plus, Search, Trash2, ChevronUp, ChevronDown, Barcode, Download } from 'lucide-react'
import Modal from '../components/common/Modal'
import ArticleForm from '../components/articles/ArticleForm'
import Pagination from '../components/common/Pagination'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function Articles() {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [scannerInput, setScannerInput] = useState('')
  const [showStockBas, setShowStockBas] = useState(searchParams.get('stock_bas') === 'true')
  const [selectedCategorie, setSelectedCategorie] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [sortBy, setSortBy] = useState(null)
  const [sortOrder, setSortOrder] = useState('asc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [barcodeArticle, setBarcodeArticle] = useState(null)
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
  }, [debouncedSearchTerm, showStockBas, selectedCategorie, selectedTag, sortBy, sortOrder])

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

  // Récupérer les articles
  const skip = (currentPage - 1) * itemsPerPage
  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', { search: debouncedSearchTerm, stock_bas: showStockBas, categorie_id: selectedCategorie, tag_id: selectedTag, sort_by: sortBy, order: sortOrder, skip, limit: itemsPerPage }],
    queryFn: () => getArticles({
      search: debouncedSearchTerm || undefined,
      stock_bas: showStockBas,
      categorie_id: selectedCategorie || undefined,
      tag_id: selectedTag || undefined,
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

  const handleDownloadBarcode = (article) => {
    const token = localStorage.getItem('token')
    const url = `${API_URL}/articles/${article.id}/barcode`

    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `barcode_${article.sku}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Code-barre téléchargé')
      })
      .catch(error => {
        toast.error('Erreur lors du téléchargement du code-barre')
        console.error(error)
      })
  }

  const handleScannerSubmit = (e) => {
    e.preventDefault()
    if (scannerInput.trim()) {
      // Lancer la recherche avec le SKU scanné
      setSearchTerm(scannerInput.trim())
      // Réinitialiser le champ et le refocus pour le prochain scan
      setScannerInput('')
      // Le champ se refocalisera automatiquement grâce à l'attribut autoFocus
      toast.info(`Recherche du SKU : ${scannerInput.trim()}`)
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
        <button className="btn btn-primary" onClick={handleCreateClick}>
          <Plus size={18} />
          Nouvel article
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="card">
        {/* Champ scanner de code-barre */}
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '2px dashed #007bff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Barcode size={20} style={{ color: '#007bff' }} />
            <strong style={{ color: '#007bff' }}>Scanner de codes-barres</strong>
          </div>
          <form onSubmit={handleScannerSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Scannez un code-barre ici (ou saisissez le SKU)..."
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                autoFocus
                style={{
                  paddingLeft: '2.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  borderColor: '#007bff'
                }}
              />
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#007bff'
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Rechercher
            </button>
          </form>
          <p style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.5rem', marginBottom: 0 }}>
            💡 Placez le curseur dans ce champ et scannez le code-barre de votre article
          </p>
        </div>

        {/* Filtres classiques */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d'
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td data-label="ID">{article.id}</td>
                  <td data-label="Nom">
                    <div>
                      <strong>{article.nom}</strong>
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
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditClick(article)}
                      >
                        Modifier
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteClick(article)}
                        aria-label="Supprimer l'article"
                      >
                        <Trash2 size={14} />
                      </button>
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
              display: 'inline-block',
              marginBottom: '1.5rem'
            }}>
              <img
                src={`${API_URL}/articles/${barcodeArticle.id}/barcode`}
                alt={`Code-barre ${barcodeArticle.sku}`}
                style={{ maxWidth: '100%', height: 'auto' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  toast.error('Erreur lors du chargement du code-barre')
                }}
              />
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
    </div>
  )
}

export default Articles
