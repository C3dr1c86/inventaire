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
import { AlertTriangle, Package, Layers, ArrowRightLeft, FileText, Plus, Tag, Truck, MapPin } from 'lucide-react'
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
      // Rafraîchir les résultats de recherche si une recherche est active
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

  if (statsLoading || stockBasLoading) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dashboard</h1>
        <div className="loader"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dashboard</h1>

      {/* Barre de recherche globale */}
      <div style={{ position: 'relative' }}>
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un article par nom, SKU ou description..."
          autoFocus={false}
        />
        {searchResults && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearSearch}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              zIndex: 10
            }}
          >
            Effacer
          </button>
        )}
        {searchLoading && (
          <div style={{
            position: 'absolute',
            top: '1.5rem',
            right: searchResults ? '8rem' : '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#007bff',
            fontWeight: 500,
            zIndex: 10
          }}>
            <div className="spinner-border spinner-border-sm" role="status"></div>
            Recherche...
          </div>
        )}
      </div>

      {/* Résultats de recherche */}
      {searchResults && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 className="card-header">
            Résultats de recherche ({searchResults.total || 0} article{searchResults.total > 1 ? 's' : ''})
          </h2>
          {searchResults.items && searchResults.items.length === 0 ? (
            <div className="card-body text-center">
              <p>Aucun article trouvé pour "{searchQuery}"</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>SKU</th>
                  <th>Quantité</th>
                  <th>Catégorie</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.items?.map((article) => (
                  <tr key={article.id}>
                    <td data-label="Nom">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <strong>{article.nom}</strong>
                        {article.tags && article.tags.length > 0 && (
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
                        )}
                      </div>
                    </td>
                    <td data-label="SKU">{article.sku || '-'}</td>
                    <td data-label="Quantité">{article.quantite} / {article.quantite_min}</td>
                    <td data-label="Catégorie">{article.categorie?.nom || 'Sans catégorie'}</td>
                    <td data-label="Actions">
                      <a
                        href={`/articles?highlight=${article.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        Voir détails
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Cartes de statistiques */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div
          className="stat-card"
          style={{ background: 'linear-gradient(135deg, #007bff, #0056b3)', cursor: 'pointer' }}
          onClick={() => navigate('/articles')}
        >
          <div className="stat-value">{stats?.nombre_articles || 0}</div>
          <div className="stat-label">
            <Package size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Articles au total
          </div>
        </div>

        <div
          className="stat-card"
          style={{ background: 'linear-gradient(135deg, #28a745, #1e7e34)', cursor: 'pointer' }}
          onClick={() => navigate('/categories')}
        >
          <div className="stat-value">{stats?.nombre_categories || 0}</div>
          <div className="stat-label">
            <Layers size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Catégories
          </div>
        </div>

        <div
          className="stat-card"
          style={{ background: 'linear-gradient(135deg, #dc3545, #bd2130)', cursor: 'pointer' }}
          onClick={() => navigate('/articles?stock_bas=true')}
        >
          <div className="stat-value">{stats?.nombre_articles_stock_bas || 0}</div>
          <div className="stat-label">
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Alertes stock bas
          </div>
        </div>
      </div>

      {/* Alerte de stock bas */}
      {stockBas && stockBas.articles && stockBas.articles.length > 0 && (
        <div className="alert alert-warning">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} />
            Attention : {stockBas.total} article(s) en stock bas
          </h3>
          <ul style={{ marginLeft: '1.5rem' }}>
            {stockBas.articles.slice(0, 5).map(article => (
              <li key={article.id}>
                <strong>{article.nom}</strong> - Stock actuel: {article.quantite}, Minimum: {article.quantite_min}
              </li>
            ))}
          </ul>
          {stockBas.total > 5 && (
            <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
              ... et {stockBas.total - 5} autre(s) article(s)
            </p>
          )}
        </div>
      )}

      {/* Liens rapides */}
      <div className="card">
        <h2 className="card-header">Actions rapides</h2>
        <div className="card-body">
          {/* Boutons de création rapide */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {canCreate('articles') && (
              <button
                className="btn"
                onClick={() => setIsArticleModalOpen(true)}
                style={{ backgroundColor: '#007bff', color: '#fff', border: 'none' }}
              >
                <Package size={18} />
                Créer un article
              </button>
            )}
            {canCreate('categories') && (
              <button
                className="btn"
                onClick={() => setIsCategorieModalOpen(true)}
                style={{ backgroundColor: '#28a745', color: '#fff', border: 'none' }}
              >
                <Layers size={18} />
                Créer une catégorie
              </button>
            )}
            {canCreate('tags') && (
              <button
                className="btn"
                onClick={() => setIsTagModalOpen(true)}
                style={{ backgroundColor: '#fd7e14', color: '#fff', border: 'none' }}
              >
                <Tag size={18} />
                Créer un tag
              </button>
            )}
            {canCreate('fournisseurs') && (
              <button
                className="btn"
                onClick={() => setIsFournisseurModalOpen(true)}
                style={{ backgroundColor: '#6f42c1', color: '#fff', border: 'none' }}
              >
                <Truck size={18} />
                Créer un fournisseur
              </button>
            )}
            {canCreate('emplacements') && (
              <button
                className="btn"
                onClick={() => setIsEmplacementModalOpen(true)}
                style={{ backgroundColor: '#17a2b8', color: '#fff', border: 'none' }}
              >
                <MapPin size={18} />
                Créer un emplacement
              </button>
            )}
          </div>

          {/* Séparateur */}
          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #dee2e6' }} />

          {/* Liens vers les pages */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="/articles" className="btn btn-secondary">
              <Package size={18} />
              Gérer les articles
            </a>
            <a href="/mouvements" className="btn btn-secondary">
              <ArrowRightLeft size={18} />
              Enregistrer un mouvement
            </a>
            <a href="/rapports" className="btn btn-secondary">
              <FileText size={18} />
              Voir les rapports
            </a>
          </div>
        </div>
      </div>

      {/* Message de bienvenue si pas de données */}
      {stats && stats.nombre_articles === 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 className="card-header">Bienvenue !</h2>
          <div className="card-body">
            <p>Votre inventaire est vide pour le moment. Commencez par :</p>
            <ol style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
              <li>Créer des catégories pour organiser vos articles</li>
              <li>Ajouter vos premiers articles</li>
              <li>Enregistrer des mouvements de stock (entrées/sorties)</li>
              <li>Consulter les rapports et exporter vos données</li>
            </ol>
          </div>
        </div>
      )}

      {/* Modal de création d'article */}
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

      {/* Modal de création de catégorie */}
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

      {/* Modal de création de tag */}
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

      {/* Modal de création de fournisseur */}
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

      {/* Modal de création d'emplacement */}
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
