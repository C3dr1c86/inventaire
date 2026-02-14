/**
 * Formulaire de création de mouvement de stock.
 *
 * Gère la saisie d'entrées/sorties avec validation du stock disponible.
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getArticles } from '../../services/articleService'
import { ArrowUp, ArrowDown, Search } from 'lucide-react'

function MouvementForm({ onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    article_id: '',
    type: 'ENTREE',
    quantite: 1,
    motif: ''
  })

  const [errors, setErrors] = useState({})
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Charger les articles avec recherche
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['articles-search', searchQuery],
    queryFn: () => getArticles({ search: searchQuery, limit: 20 }),
    enabled: showDropdown || searchQuery.length > 0
  })

  const articles = articlesData?.items || []

  // Mettre à jour l'article sélectionné quand on change la sélection
  useEffect(() => {
    if (formData.article_id && articles.length > 0) {
      const article = articles.find(a => a.id === parseInt(formData.article_id))
      setSelectedArticle(article)
    } else {
      setSelectedArticle(null)
    }
  }, [formData.article_id, articles])

  // Fermer la dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setShowDropdown(true)
  }

  const handleSelectArticle = (article) => {
    setFormData(prev => ({ ...prev, article_id: article.id.toString() }))
    setSelectedArticle(article)
    setSearchQuery(article.nom)
    setShowDropdown(false)
    // Effacer l'erreur
    if (errors.article_id) {
      setErrors(prev => ({ ...prev, article_id: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.article_id) {
      newErrors.article_id = 'Veuillez sélectionner un article'
    }

    if (formData.quantite <= 0) {
      newErrors.quantite = 'La quantité doit être supérieure à 0'
    }

    // Vérifier le stock disponible pour les sorties
    if (formData.type === 'SORTIE' && selectedArticle) {
      if (formData.quantite > selectedArticle.quantite) {
        newErrors.quantite = `Stock insuffisant (disponible: ${selectedArticle.quantite})`
      }
    }

    if (!formData.motif.trim()) {
      newErrors.motif = 'Le motif est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Convertir article_id en nombre
    const dataToSubmit = {
      ...formData,
      article_id: parseInt(formData.article_id)
    }

    onSubmit(dataToSubmit)
  }

  // Note: On ne bloque plus le formulaire si articles.length === 0
  // car les articles sont chargés à la demande via la recherche

  const getStockColor = () => {
    if (!selectedArticle) return 'inherit'
    if (formData.type === 'SORTIE' && formData.quantite > selectedArticle.quantite) {
      return 'var(--danger)'
    }
    return 'var(--success)'
  }

  const getNewQuantity = () => {
    if (!selectedArticle) return '-'
    if (formData.type === 'ENTREE') {
      return selectedArticle.quantite + formData.quantite
    } else {
      return selectedArticle.quantite - formData.quantite
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mouvement-form">
      {/* Type de mouvement */}
      <div className="form-group">
        <label>Type de mouvement <span className="required">*</span></label>
        <div className="movement-type-selector">
          <label className={`movement-type-option ${formData.type === 'ENTREE' ? 'active' : ''}`}>
            <input
              type="radio"
              name="type"
              value="ENTREE"
              checked={formData.type === 'ENTREE'}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <div className="movement-type-content">
              <ArrowUp size={24} />
              <span>Entrée de stock</span>
            </div>
          </label>
          <label className={`movement-type-option ${formData.type === 'SORTIE' ? 'active' : ''}`}>
            <input
              type="radio"
              name="type"
              value="SORTIE"
              checked={formData.type === 'SORTIE'}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <div className="movement-type-content">
              <ArrowDown size={24} />
              <span>Sortie de stock</span>
            </div>
          </label>
        </div>
      </div>

      {/* Sélection de l'article avec recherche */}
      <div className="form-group" ref={dropdownRef}>
        <label htmlFor="article_search">
          Article <span className="required">*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              id="article_search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="Rechercher un article..."
              className={errors.article_id ? 'error' : ''}
              disabled={isSubmitting}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6c757d'
              }}
            />
          </div>

          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                maxHeight: '250px',
                overflowY: 'auto',
                zIndex: 1000,
                marginTop: '0.25rem'
              }}
            >
              {articlesLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                  Chargement...
                </div>
              ) : articles.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                  {searchQuery ? 'Aucun article trouvé' : 'Commencez à taper pour rechercher'}
                </div>
              ) : (
                articles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => handleSelectArticle(article)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div style={{ fontWeight: '500' }}>{article.nom}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.25rem' }}>
                      Stock actuel: {article.quantite}
                      {article.sku && ` • SKU: ${article.sku}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {errors.article_id && <span className="error-message">{errors.article_id}</span>}
      </div>

      {/* Aperçu de l'article sélectionné */}
      {selectedArticle && (
        <div className="article-preview">
          <div className="article-preview-row">
            <span className="label">Stock actuel:</span>
            <span className="value"><strong>{selectedArticle.quantite}</strong></span>
          </div>
          <div className="article-preview-row">
            <span className="label">Stock après mouvement:</span>
            <span className="value" style={{ color: getStockColor(), fontWeight: 'bold' }}>
              {getNewQuantity()}
            </span>
          </div>
          {selectedArticle.est_stock_bas && (
            <div className="article-preview-warning">
              Attention : Cet article est déjà en stock bas
            </div>
          )}
        </div>
      )}

      {/* Quantité */}
      <div className="form-group">
        <label htmlFor="quantite">
          Quantité <span className="required">*</span>
        </label>
        <input
          type="number"
          id="quantite"
          name="quantite"
          value={formData.quantite}
          onChange={handleChange}
          className={errors.quantite ? 'error' : ''}
          disabled={isSubmitting}
          min="1"
        />
        {errors.quantite && <span className="error-message">{errors.quantite}</span>}
      </div>

      {/* Motif */}
      <div className="form-group">
        <label htmlFor="motif">
          Motif <span className="required">*</span>
        </label>
        <textarea
          id="motif"
          name="motif"
          value={formData.motif}
          onChange={handleChange}
          rows="3"
          className={errors.motif ? 'error' : ''}
          disabled={isSubmitting}
          placeholder="Ex: Livraison fournisseur, Vente client, Inventaire, Retour..."
        />
        {errors.motif && <span className="error-message">{errors.motif}</span>}
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer le mouvement'}
        </button>
      </div>
    </form>
  )
}

export default MouvementForm
