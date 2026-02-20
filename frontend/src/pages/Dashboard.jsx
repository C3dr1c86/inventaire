/**
 * Page Dashboard - Vue d'ensemble de l'inventaire.
 *
 * Affiche les statistiques clés et les alertes de stock bas.
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getStatistiques, getRapportStockBas } from '../services/rapportService'
import { createArticle, getArticles } from '../services/articleService'
import { createCategorie } from '../services/categorieService'
import { createTag } from '../services/tagService'
import { createFournisseur } from '../services/fournisseurService'
import { createEmplacement } from '../services/emplacementService'
import {
  AlertTriangle,
  Package,
  Layers,
  ArrowRightLeft,
  FileText,
  Tag,
  Truck,
  MapPin,
  X,
  TrendingDown,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import ArticleForm from '../components/articles/ArticleForm'
import CategorieForm from '../components/categories/CategorieForm'
import TagForm from '../components/tags/TagForm'
import FournisseurForm from '../components/fournisseurs/FournisseurForm'
import EmplacementForm from '../components/emplacements/EmplacementForm'
import SearchBar from '../components/common/SearchBar'
import { usePermissions } from '../hooks/usePermissions'

function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canCreate } = usePermissions()
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false)
  const [isCategorieModalOpen, setIsCategorieModalOpen] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isFournisseurModalOpen, setIsFournisseurModalOpen] = useState(false)
  const [isEmplacementModalOpen, setIsEmplacementModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)

  // Debounce pour la recherche (attendre 500ms après la dernière frappe)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Lancer la recherche automatiquement quand debouncedSearchQuery change
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      handleSearch()
    } else {
      setSearchResults(null)
    }
  }, [debouncedSearchQuery])

  // Récupérer les statistiques
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['statistiques'],
    queryFn: getStatistiques
  })

  // Récupérer les articles en stock bas
  const { data: stockBas, isLoading: stockBasLoading } = useQuery({
    queryKey: ['stock-bas'],
    queryFn: getRapportStockBas
  })

  // Query de recherche (manuelle avec enabled: false)
  const { refetch: searchRefetch, isLoading: searchLoading } = useQuery({
    queryKey: ['search-articles', debouncedSearchQuery],
    queryFn: () => getArticles({ search: debouncedSearchQuery }),
    enabled: false
  })

  // Handlers de recherche (appelé automatiquement par useEffect)
  const handleSearch = async () => {
    if (debouncedSearchQuery.trim()) {
      const result = await searchRefetch()
      if (result.error) {
        toast.error('Erreur lors de la recherche')
        return
      }
      if (result.data) {
        setSearchResults(result.data)
      }
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
  }

  // Mutation pour créer un article
  const createArticleMutation = useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries(['statistiques'])
      queryClient.invalidateQueries(['articles'])
      queryClient.invalidateQueries(['search-articles'])
      queryClient.invalidateQueries(['stock-bas'])
      setIsArticleModalOpen(false)
      toast.success('Article créé avec succès')
      if (searchResults) {
        searchRefetch()
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création de l\'article')
    }
  })

  // Mutation pour créer une catégorie
  const createCategorieMutation = useMutation({
    mutationFn: createCategorie,
    onSuccess: () => {
      queryClient.invalidateQueries(['statistiques'])
      queryClient.invalidateQueries(['categories'])
      setIsCategorieModalOpen(false)
      toast.success('Catégorie créée avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création de la catégorie')
    }
  })

  // Mutation pour créer un tag
  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries(['tags'])
      setIsTagModalOpen(false)
      toast.success('Tag créé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création du tag')
    }
  })

  // Mutation pour créer un fournisseur
  const createFournisseurMutation = useMutation({
    mutationFn: createFournisseur,
    onSuccess: () => {
      queryClient.invalidateQueries(['fournisseurs'])
      setIsFournisseurModalOpen(false)
      toast.success('Fournisseur créé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création du fournisseur')
    }
  })

  // Mutation pour créer un emplacement
  const createEmplacementMutation = useMutation({
    mutationFn: createEmplacement,
    onSuccess: () => {
      queryClient.invalidateQueries(['emplacements'])
      queryClient.invalidateQueries(['emplacements-racines'])
      queryClient.invalidateQueries(['emplacements-tree'])
      setIsEmplacementModalOpen(false)
      toast.success('Emplacement créé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création de l\'emplacement')
    }
  })

  // État de chargement
  if (statsLoading || stockBasLoading) {
    return (
      <div className="loading-page">
        <span className="spinner spinner-lg" role="status" aria-label="Chargement du tableau de bord" />
        <span>Chargement du tableau de bord...</span>
      </div>
    )
  }

  const alertesCount = stats?.nombre_articles_stock_bas || 0

  return (
    <div>
      {/* En-tête de page */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble de votre inventaire</p>
        </div>
      </div>

      {/* Barre de recherche globale */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body">
          <div className="search-bar">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article par nom, SKU ou description..."
              autoFocus={false}
            />
            {searchResults && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={clearSearch}
                aria-label="Effacer la recherche"
              >
                <X size={16} />
                Effacer
              </button>
            )}
            {searchLoading && (
              <span className="spinner spinner-sm" role="status" aria-label="Recherche en cours" />
            )}
          </div>
        </div>

        {/* Résultats de recherche */}
        {searchResults && (
          <>
            <div className="card-header">
              <h2 className="card-title">
                Résultats ({searchResults.total || 0} article{searchResults.total > 1 ? 's' : ''})
              </h2>
            </div>
            {searchResults.items && searchResults.items.length === 0 ? (
              <div className="card-body">
                <div className="empty-state">
                  <Package className="empty-state-icon" aria-hidden="true" />
                  <p className="empty-state-title">Aucun résultat</p>
                  <p className="empty-state-description">
                    Aucun article trouvé pour &laquo;&nbsp;{searchQuery}&nbsp;&raquo;
                  </p>
                </div>
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>SKU</th>
                      <th>Quantité</th>
                      <th>Catégorie</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items?.map((article) => (
                      <tr key={article.id}>
                        <td data-label="Nom">
                          <div>
                            <strong>{article.nom}</strong>
                            {article.tags && article.tags.length > 0 && (
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
                            )}
                          </div>
                        </td>
                        <td data-label="SKU">
                          <code className="text-muted">{article.sku || '—'}</code>
                        </td>
                        <td data-label="Quantité">
                          <span className={article.quantite <= article.quantite_min ? (article.quantite === 0 ? 'text-danger' : 'text-warning') : 'text-success'}>
                            {article.quantite}
                          </span>
                          <span className="text-muted"> / {article.quantite_min}</span>
                        </td>
                        <td data-label="Catégorie">
                          <span className="badge badge-neutral">
                            {article.categorie?.nom || 'Sans catégorie'}
                          </span>
                        </td>
                        <td data-label="Actions">
                          <a
                            href={`/articles?highlight=${article.id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Voir
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        <div
          className="stat-card"
          onClick={() => navigate('/articles')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/articles')}
          aria-label={`${stats?.nombre_articles || 0} articles au total`}
        >
          <div className="stat-card-icon primary" aria-hidden="true">
            <Package size={22} />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">Articles au total</div>
            <div className="stat-card-value">{stats?.nombre_articles || 0}</div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate('/categories')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/categories')}
          aria-label={`${stats?.nombre_categories || 0} catégories`}
        >
          <div className="stat-card-icon success" aria-hidden="true">
            <Layers size={22} />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">Catégories</div>
            <div className="stat-card-value">{stats?.nombre_categories || 0}</div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate('/articles?stock_bas=true')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/articles?stock_bas=true')}
          aria-label={`${alertesCount} alertes stock bas`}
        >
          <div className={`stat-card-icon ${alertesCount > 0 ? 'danger' : 'success'}`} aria-hidden="true">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-label">Alertes stock bas</div>
            <div className="stat-card-value">{alertesCount}</div>
            {alertesCount > 0 && (
              <div className="stat-card-trend down">
                <TrendingDown size={12} aria-hidden="true" />
                Action requise
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerte de stock bas */}
      {stockBas && stockBas.articles && stockBas.articles.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
          <AlertTriangle size={18} aria-hidden="true" />
          <div>
            <strong>{stockBas.total} article(s) en stock bas</strong>
            <ul className="stock-alert-list">
              {stockBas.articles.slice(0, 5).map(article => (
                <li key={article.id}>
                  <strong>{article.nom}</strong>
                  {' — '}stock actuel&nbsp;: {article.quantite}, minimum&nbsp;: {article.quantite_min}
                </li>
              ))}
            </ul>
            {stockBas.total > 5 && (
              <p className="text-muted" style={{ marginTop: 'var(--space-2)', fontStyle: 'italic' }}>
                … et {stockBas.total - 5} autre(s)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h2 className="card-title">Actions rapides</h2>
        </div>
        <div className="card-body">
          {/* Boutons de création */}
          <div className="page-actions" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
            {canCreate('articles') && (
              <button
                className="btn btn-primary"
                onClick={() => setIsArticleModalOpen(true)}
              >
                <Package size={16} aria-hidden="true" />
                Créer un article
              </button>
            )}
            {canCreate('categories') && (
              <button
                className="btn btn-success"
                onClick={() => setIsCategorieModalOpen(true)}
              >
                <Layers size={16} aria-hidden="true" />
                Créer une catégorie
              </button>
            )}
            {canCreate('tags') && (
              <button
                className="btn btn-warning"
                onClick={() => setIsTagModalOpen(true)}
              >
                <Tag size={16} aria-hidden="true" />
                Créer un tag
              </button>
            )}
            {canCreate('fournisseurs') && (
              <button
                className="btn btn-purple"
                onClick={() => setIsFournisseurModalOpen(true)}
              >
                <Truck size={16} aria-hidden="true" />
                Créer un fournisseur
              </button>
            )}
            {canCreate('emplacements') && (
              <button
                className="btn btn-info"
                onClick={() => setIsEmplacementModalOpen(true)}
              >
                <MapPin size={16} aria-hidden="true" />
                Créer un emplacement
              </button>
            )}
          </div>

          <hr className="divider" />

          {/* Liens de navigation */}
          <div className="page-actions" style={{ flexWrap: 'wrap' }}>
            <a href="/articles" className="btn btn-ghost">
              <Package size={16} aria-hidden="true" />
              Gérer les articles
            </a>
            <a href="/mouvements" className="btn btn-ghost">
              <ArrowRightLeft size={16} aria-hidden="true" />
              Enregistrer un mouvement
            </a>
            <a href="/rapports" className="btn btn-ghost">
              <FileText size={16} aria-hidden="true" />
              Voir les rapports
            </a>
          </div>
        </div>
      </div>

      {/* Message de bienvenue si inventaire vide */}
      {stats && stats.nombre_articles === 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Bienvenue !</h2>
          </div>
          <div className="card-body">
            <p>Votre inventaire est vide pour le moment. Commencez par :</p>
            <ol className="welcome-list">
              <li>Créer des catégories pour organiser vos articles</li>
              <li>Ajouter vos premiers articles</li>
              <li>Enregistrer des mouvements de stock (entrées / sorties)</li>
              <li>Consulter les rapports et exporter vos données</li>
            </ol>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        title="Créer un article"
        size="large"
      >
        <ArticleForm
          article={null}
          onSubmit={(data) => createArticleMutation.mutate(data)}
          onCancel={() => setIsArticleModalOpen(false)}
          isSubmitting={createArticleMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={isCategorieModalOpen}
        onClose={() => setIsCategorieModalOpen(false)}
        title="Créer une catégorie"
        size="medium"
      >
        <CategorieForm
          categorie={null}
          onSubmit={(data) => createCategorieMutation.mutate(data)}
          onCancel={() => setIsCategorieModalOpen(false)}
          isSubmitting={createCategorieMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title="Créer un tag"
        size="medium"
      >
        <TagForm
          tag={null}
          onSubmit={(data) => createTagMutation.mutate(data)}
          onCancel={() => setIsTagModalOpen(false)}
          isSubmitting={createTagMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={isFournisseurModalOpen}
        onClose={() => setIsFournisseurModalOpen(false)}
        title="Créer un fournisseur"
        size="medium"
      >
        <FournisseurForm
          fournisseur={null}
          onSubmit={(data) => createFournisseurMutation.mutate(data)}
          onCancel={() => setIsFournisseurModalOpen(false)}
          isSubmitting={createFournisseurMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={isEmplacementModalOpen}
        onClose={() => setIsEmplacementModalOpen(false)}
        title="Créer un emplacement"
        size="medium"
      >
        <EmplacementForm
          emplacement={null}
          onSubmit={(data) => createEmplacementMutation.mutate(data)}
          onCancel={() => setIsEmplacementModalOpen(false)}
          isSubmitting={createEmplacementMutation.isPending}
        />
      </Modal>
    </div>
  )
}

export default Dashboard
