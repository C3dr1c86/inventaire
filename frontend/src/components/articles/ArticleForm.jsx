/**
 * Formulaire de création/modification d'article.
 *
 * Gère la validation et la soumission des données article.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCategories, getCategoriesRacines, getSousCategories } from '../../services/categorieService'
import TagInput from '../tags/TagInput'
import PhotoUpload from './PhotoUpload'

function ArticleForm({ article, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    nom: '',
    sku: '',
    quantite: 0,
    quantite_min: 10,
    prix_unitaire: 0,
    categorie_id: '',
    description: '',
    tag_ids: []
  })

  const [errors, setErrors] = useState({})

  // NOUVEAU : États pour le double select
  const [categorieParenteId, setCategorieParenteId] = useState('')
  const [sousCategories, setSousCategories] = useState([])

  // Charger les catégories racines
  const { data: categoriesRacines } = useQuery({
    queryKey: ['categories-racines'],
    queryFn: getCategoriesRacines
  })

  // Charger toutes les catégories (pour pré-remplir en mode édition)
  const { data: toutesCategories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: getCategories
  })

  // Pré-remplir le formulaire si on modifie un article
  useEffect(() => {
    if (article && toutesCategories) {
      const categorieActuelle = toutesCategories.find(c => c.id === article.categorie_id)

      setFormData({
        nom: article.nom || '',
        sku: article.sku || '',
        quantite: article.quantite || 0,
        quantite_min: article.quantite_min || 10,
        prix_unitaire: article.prix_unitaire || 0,
        categorie_id: article.categorie_id || '',
        description: article.description || '',
        tag_ids: article.tags?.map(t => t.id) || []
      })

      if (categorieActuelle) {
        // Si la catégorie actuelle a un parent, sélectionner le parent
        if (categorieActuelle.parent_id) {
          setCategorieParenteId(categorieActuelle.parent_id)
          loadSousCategories(categorieActuelle.parent_id)
        } else {
          // C'est une catégorie racine
          setCategorieParenteId(categorieActuelle.id)
        }
      }
    }
  }, [article, toutesCategories])

  // Charger les sous-catégories quand le parent change
  const loadSousCategories = async (parentId) => {
    if (!parentId) {
      setSousCategories([])
      return
    }

    try {
      const data = await getSousCategories(parentId)
      setSousCategories(data)

      // Si aucune sous-catégorie, utiliser la catégorie parente comme categorie_id
      if (!data || data.length === 0) {
        setFormData(prev => ({ ...prev, categorie_id: parentId }))
      }
    } catch (error) {
      console.error('Erreur chargement sous-catégories:', error)
      setSousCategories([])
      // En cas d'erreur, utiliser la catégorie parente comme categorie_id
      setFormData(prev => ({ ...prev, categorie_id: parentId }))
    }
  }

  // Gérer changement de catégorie parente
  const handleCategorieParenteChange = (e) => {
    const parentId = e.target.value
    setCategorieParenteId(parentId)

    if (parentId) {
      // Charger les sous-catégories (la fonction gère automatiquement categorie_id)
      loadSousCategories(parentId)
    } else {
      setSousCategories([])
      setFormData(prev => ({ ...prev, categorie_id: '' }))
    }
  }

  // Gérer changement de sous-catégorie
  const handleSousCategorieChange = (e) => {
    const sousCatId = e.target.value

    // Si une sous-catégorie est choisie, utiliser son ID
    // Sinon, utiliser l'ID de la catégorie parente
    setFormData(prev => ({
      ...prev,
      categorie_id: sousCatId || categorieParenteId
    }))
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleTagsChange = (newTagIds) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: newTagIds
    }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'Le SKU est requis'
    }

    if (formData.quantite < 0) {
      newErrors.quantite = 'La quantité ne peut pas être négative'
    }

    if (formData.quantite_min < 0) {
      newErrors.quantite_min = 'Le stock minimum ne peut pas être négatif'
    }

    if (formData.prix_unitaire < 0) {
      newErrors.prix_unitaire = 'Le prix ne peut pas être négatif'
    }

    if (!formData.categorie_id) {
      newErrors.categorie_id = 'La catégorie est requise'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Convertir categorie_id en nombre
    const dataToSubmit = {
      ...formData,
      categorie_id: parseInt(formData.categorie_id)
    }

    // Debug: afficher ce qui est envoyé (seulement en mode debug)
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('📤 Données envoyées:', dataToSubmit)
      console.log('🏷️  Tags sélectionnés:', dataToSubmit.tag_ids)
    }

    onSubmit(dataToSubmit)
  }

  return (
    <form onSubmit={handleSubmit} className="article-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="nom">
            Nom de l'article <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            className={errors.nom ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.nom && <span className="error-message">{errors.nom}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="sku">
            Code SKU <span className="required">*</span>
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className={errors.sku ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.sku && <span className="error-message">{errors.sku}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="quantite">
            Quantité en stock <span className="required">*</span>
          </label>
          <input
            type="number"
            id="quantite"
            name="quantite"
            value={formData.quantite}
            onChange={handleChange}
            className={errors.quantite ? 'error' : ''}
            disabled={isSubmitting}
            min="0"
          />
          {errors.quantite && <span className="error-message">{errors.quantite}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="quantite_min">
            Stock minimum <span className="required">*</span>
          </label>
          <input
            type="number"
            id="quantite_min"
            name="quantite_min"
            value={formData.quantite_min}
            onChange={handleChange}
            className={errors.quantite_min ? 'error' : ''}
            disabled={isSubmitting}
            min="0"
          />
          {errors.quantite_min && <span className="error-message">{errors.quantite_min}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="prix_unitaire">
            Prix unitaire (€) <span className="required">*</span>
          </label>
          <input
            type="number"
            id="prix_unitaire"
            name="prix_unitaire"
            value={formData.prix_unitaire}
            onChange={handleChange}
            className={errors.prix_unitaire ? 'error' : ''}
            disabled={isSubmitting}
            step="0.01"
            min="0"
          />
          {errors.prix_unitaire && <span className="error-message">{errors.prix_unitaire}</span>}
        </div>
      </div>

      {/* DOUBLE SELECT CASCADÉ */}
      <div className="form-group">
        <label htmlFor="categorie_parente">
          Catégorie principale <span className="required">*</span>
        </label>
        <select
          id="categorie_parente"
          name="categorie_parente"
          value={categorieParenteId}
          onChange={handleCategorieParenteChange}
          className={errors.categorie_id ? 'error' : ''}
          disabled={isSubmitting}
        >
          <option value="">-- Sélectionner une catégorie --</option>
          {categoriesRacines?.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nom}
            </option>
          ))}
        </select>
        {categorieParenteId && sousCategories.length === 0 && (
          <small style={{fontSize: '0.75rem', color: '#28a745', display: 'block', marginTop: '0.25rem'}}>
            ✓ Cette catégorie sera utilisée (pas de sous-catégories disponibles)
          </small>
        )}
      </div>

      {/* Second select : Sous-catégories (affiché seulement si parent sélectionné) */}
      {categorieParenteId && sousCategories.length > 0 && (
        <div className="form-group">
          <label htmlFor="categorie_id">
            Sous-catégorie{' '}
            <span style={{fontSize: '0.875rem', color: '#6c757d', fontWeight: 'normal'}}>
              (optionnel)
            </span>
          </label>
          <select
            id="categorie_id"
            name="categorie_id"
            value={formData.categorie_id === categorieParenteId ? '' : formData.categorie_id}
            onChange={handleSousCategorieChange}
            disabled={isSubmitting}
          >
            <option value="">
              -- Aucune (utiliser {categoriesRacines?.find(c => c.id == categorieParenteId)?.nom}) --
            </option>
            {sousCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      {errors.categorie_id && <span className="error-message">{errors.categorie_id}</span>}

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label>Tags</label>
        <p className="help-text">
          Sélectionnez des tags pour organiser cet article (machine, univers, usage, etc.)
        </p>
        <TagInput
          selectedTags={formData.tag_ids}
          onChange={handleTagsChange}
          disabled={isSubmitting}
        />
      </div>

      {/* Photos - UNIQUEMENT en mode édition (article existant) */}
      {article?.id && (
        <PhotoUpload
          articleId={article.id}
          photos={article.photos || []}
        />
      )}

      {/* Message informatif en mode création */}
      {!article?.id && (
        <div className="info-message" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e7f3ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
          <span style={{ fontSize: '1rem' }}>ℹ️</span> <strong>Astuce :</strong> Vous pourrez ajouter des photos après avoir créé l'article.
        </div>
      )}

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
          {isSubmitting ? 'Enregistrement...' : (article ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

export default ArticleForm
