/**
 * Formulaire de création/modification d'article.
 *
 * Gère la validation et la soumission des données article.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCategories, getCategoriesRacines, getSousCategories } from '../../services/categorieService'
import { getEmplacementsRacines, getSousEmplacements, getSuggestionsByCategory } from '../../services/emplacementService'
import TagInput from '../tags/TagInput'
import FournisseurInput from '../fournisseurs/FournisseurInput'
import PhotoUpload from './PhotoUpload'
import { toast } from 'react-toastify'

function ArticleForm({ article, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    nom: '',
    sku: '',
    quantite: 0,
    quantite_min: 10,
    prix_unitaire: 0,
    categorie_id: '',
    emplacement_id: '',
    description: '',
    tag_ids: [],
    fournisseur_ids: [],
    prix_fournisseur: '',
    ref_fournisseur: '',
    delai_livraison: ''
  })

  const [errors, setErrors] = useState({})

  // NOUVEAU : États pour le double select
  const [categorieParenteId, setCategorieParenteId] = useState('')
  const [sousCategories, setSousCategories] = useState([])

  // États pour le triple select emplacements
  const [zoneId, setZoneId] = useState('')          // Zone sélectionnée (niveau 0)
  const [etagereId, setEtagereId] = useState('')    // Étagère sélectionnée (niveau 1)
  const [etageres, setEtageres] = useState([])      // Liste des étagères de la zone
  const [boites, setBoites] = useState([])          // Liste des boîtes de l'étagère

  // États pour les suggestions d'emplacements
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

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

  // Charger les emplacements racines (Zones)
  const { data: zones } = useQuery({
    queryKey: ['emplacements-racines'],
    queryFn: getEmplacementsRacines
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
        emplacement_id: article.emplacement_id || '',
        description: article.description || '',
        tag_ids: article.tags?.map(t => t.id) || [],
        fournisseur_ids: article.fournisseurs?.map(f => f.id) || [],
        prix_fournisseur: article.prix_fournisseur || '',
        ref_fournisseur: article.ref_fournisseur || '',
        delai_livraison: article.delai_livraison || ''
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

  // Pré-remplir la hiérarchie des emplacements en mode édition
  useEffect(() => {
    const loadEmplacementHierarchie = async () => {
      if (article && article.emplacement_id && article.emplacement) {
        const emplacement = article.emplacement

        if (emplacement.niveau === 0) {
          // Zone
          setZoneId(emplacement.id.toString())
        } else if (emplacement.niveau === 1) {
          // Étagère
          const parentId = emplacement.parent_id.toString()
          setZoneId(parentId)
          await loadEtageres(parentId)
          setEtagereId(emplacement.id.toString())
        } else if (emplacement.niveau === 2) {
          // Boîte - Remonter toute la hiérarchie
          // On a besoin de charger parent.parent_id (zone)
          try {
            await getSousEmplacements(emplacement.parent_id)
            // Trouver l'étagère dans la réponse pour obtenir son parent_id
            // Mais on peut aussi utiliser article.emplacement.parent qui devrait être chargé
            if (article.emplacement.parent && article.emplacement.parent.parent_id) {
              const zoneId = article.emplacement.parent.parent_id.toString()
              setZoneId(zoneId)
              await loadEtageres(zoneId)

              const etagereId = emplacement.parent_id.toString()
              setEtagereId(etagereId)
              await loadBoites(etagereId)
            }
          } catch (error) {
            console.error('Erreur chargement hiérarchie boîte:', error)
          }
        }
      }
    }

    loadEmplacementHierarchie()
  }, [article])

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

  // === TRIPLE SELECT EMPLACEMENTS ===

  // Charger les étagères d'une zone
  const loadEtageres = async (zoneId) => {
    if (!zoneId) {
      setEtageres([])
      return
    }

    try {
      const data = await getSousEmplacements(zoneId)
      setEtageres(data)

      // Si aucune étagère, utiliser la zone comme emplacement
      if (!data || data.length === 0) {
        setFormData(prev => ({ ...prev, emplacement_id: parseInt(zoneId) }))
      }
    } catch (error) {
      console.error('Erreur chargement étagères:', error)
      setEtageres([])
      setFormData(prev => ({ ...prev, emplacement_id: parseInt(zoneId) }))
    }
  }

  // Charger les boîtes d'une étagère
  const loadBoites = async (etagereId) => {
    if (!etagereId) {
      setBoites([])
      return
    }

    try {
      const data = await getSousEmplacements(etagereId)
      setBoites(data)

      // Si aucune boîte, utiliser l'étagère comme emplacement
      if (!data || data.length === 0) {
        setFormData(prev => ({ ...prev, emplacement_id: parseInt(etagereId) }))
      }
    } catch (error) {
      console.error('Erreur chargement boîtes:', error)
      setBoites([])
      setFormData(prev => ({ ...prev, emplacement_id: parseInt(etagereId) }))
    }
  }

  // Gérer changement de zone
  const handleZoneChange = (e) => {
    const selectedZoneId = e.target.value
    setZoneId(selectedZoneId)
    setEtagereId('')
    setBoites([])

    if (selectedZoneId) {
      loadEtageres(selectedZoneId)
    } else {
      setEtageres([])
      setFormData(prev => ({ ...prev, emplacement_id: null }))
    }
  }

  // Gérer changement d'étagère
  const handleEtagereChange = (e) => {
    const selectedEtagereId = e.target.value
    setEtagereId(selectedEtagereId)

    if (selectedEtagereId) {
      loadBoites(selectedEtagereId)
    } else {
      setBoites([])
      // Revenir à la zone si aucune étagère choisie
      setFormData(prev => ({ ...prev, emplacement_id: zoneId ? parseInt(zoneId) : null }))
    }
  }

  // Gérer changement de boîte
  const handleBoiteChange = (e) => {
    const selectedBoiteId = e.target.value
    // Si boîte choisie, c'est l'emplacement final
    // Sinon, utiliser l'étagère (ou la zone si pas d'étagère)
    setFormData(prev => ({
      ...prev,
      emplacement_id: selectedBoiteId ? parseInt(selectedBoiteId) :
                      etagereId ? parseInt(etagereId) :
                      zoneId ? parseInt(zoneId) : null
    }))
  }

  // === SUGGESTIONS D'EMPLACEMENTS ===

  // Charger les suggestions d'emplacements basées sur la catégorie
  const loadSuggestions = async () => {
    if (!formData.categorie_id) {
      toast.warning('Veuillez d\'abord sélectionner une catégorie')
      return
    }

    setLoadingSuggestions(true)
    try {
      const data = await getSuggestionsByCategory(formData.categorie_id, 5)
      setSuggestions(data)
      setShowSuggestions(true)

      if (data.length === 0) {
        toast.info('Aucune suggestion disponible pour cette catégorie (aucun article n\'est encore rangé)')
      }
    } catch (error) {
      console.error('Erreur chargement suggestions:', error)
      toast.error('Erreur lors du chargement des suggestions')
      setSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Appliquer une suggestion (sélectionner automatiquement l'emplacement suggéré)
  const applySuggestion = async (emplacement) => {
    try {
      // Remonter la hiérarchie pour sélectionner zone → étagère → boîte
      if (emplacement.niveau === 0) {
        // C'est une Zone
        setZoneId(emplacement.id.toString())
        await loadEtageres(emplacement.id)
        setFormData(prev => ({ ...prev, emplacement_id: emplacement.id }))
      } else if (emplacement.niveau === 1) {
        // C'est une Étagère
        const parentZone = zones?.find(z => z.id === emplacement.parent_id)
        if (parentZone) {
          setZoneId(parentZone.id.toString())
          await loadEtageres(parentZone.id)
          setEtagereId(emplacement.id.toString())
          await loadBoites(emplacement.id)
          setFormData(prev => ({ ...prev, emplacement_id: emplacement.id }))
        }
      } else if (emplacement.niveau === 2) {
        // C'est une Boîte
        // Il faut remonter jusqu'à la zone
        const parentEtagere = emplacement.parent
        if (parentEtagere && parentEtagere.parent_id) {
          setZoneId(parentEtagere.parent_id.toString())
          await loadEtageres(parentEtagere.parent_id)
          setEtagereId(parentEtagere.id.toString())
          await loadBoites(parentEtagere.id)
          setFormData(prev => ({ ...prev, emplacement_id: emplacement.id }))
        }
      }

      setShowSuggestions(false)
      toast.success(`Emplacement "${emplacement.code_complet || emplacement.code}" sélectionné`)
    } catch (error) {
      console.error('Erreur application suggestion:', error)
      toast.error('Erreur lors de l\'application de la suggestion')
    }
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

  const handleFournisseursChange = (newFournisseurIds) => {
    setFormData(prev => ({
      ...prev,
      fournisseur_ids: newFournisseurIds
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

    if (formData.prix_fournisseur && parseFloat(formData.prix_fournisseur) < 0) {
      newErrors.prix_fournisseur = 'Le prix fournisseur ne peut pas être négatif'
    }

    if (formData.delai_livraison && parseInt(formData.delai_livraison) < 0) {
      newErrors.delai_livraison = 'Le délai de livraison ne peut pas être négatif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Convertir et nettoyer les données
    const dataToSubmit = {
      ...formData,
      categorie_id: parseInt(formData.categorie_id),
      prix_fournisseur: formData.prix_fournisseur ? parseFloat(formData.prix_fournisseur) : null,
      ref_fournisseur: formData.ref_fournisseur.trim() || null,
      delai_livraison: formData.delai_livraison ? parseInt(formData.delai_livraison) : null
    }

    // Debug: afficher ce qui est envoyé (seulement en mode debug)
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('📤 Données envoyées:', dataToSubmit)
      console.log('🏷️  Tags sélectionnés:', dataToSubmit.tag_ids)
      console.log('🚚 Fournisseurs sélectionnés:', dataToSubmit.fournisseur_ids)
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

      {/* === TRIPLE SELECT EMPLACEMENTS PHYSIQUES === */}
      <div className="form-group">
        <label htmlFor="zone_id">
          Emplacement physique{' '}
          <span style={{fontSize: '0.875rem', color: '#6c757d', fontWeight: 'normal'}}>
            (optionnel)
          </span>
        </label>

        {/* Select 1 : Zone */}
        <select
          id="zone_id"
          name="zone_id"
          value={zoneId}
          onChange={handleZoneChange}
          className="form-control"
          disabled={isSubmitting}
        >
          <option value="">-- Aucun emplacement --</option>
          {zones?.map(zone => (
            <option key={zone.id} value={zone.id}>
              🏢 {zone.code}
            </option>
          ))}
        </select>

        {/* Message si zone sans étagères */}
        {zoneId && etageres.length === 0 && (
          <small style={{ color: '#28a745', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
            ✓ Zone "{zones?.find(z => z.id === parseInt(zoneId))?.code}" sera utilisée comme emplacement
          </small>
        )}

        {/* Select 2 : Étagère (affiché si zone sélectionnée ET a des étagères) */}
        {zoneId && etageres.length > 0 && (
          <>
            <select
              id="etagere_id"
              name="etagere_id"
              value={etagereId}
              onChange={handleEtagereChange}
              className="form-control"
              style={{ marginTop: '0.5rem' }}
              disabled={isSubmitting}
            >
              <option value="">-- Aucune étagère (utiliser zone) --</option>
              {etageres.map(etagere => (
                <option key={etagere.id} value={etagere.id}>
                  📚 {etagere.code}
                </option>
              ))}
            </select>

            {/* Message si étagère sans boîtes */}
            {etagereId && boites.length === 0 && (
              <small style={{ color: '#28a745', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                ✓ Étagère "{etageres.find(e => e.id === parseInt(etagereId))?.code}" sera utilisée comme emplacement
              </small>
            )}
          </>
        )}

        {/* Select 3 : Boîte (affiché si étagère sélectionnée ET a des boîtes) */}
        {etagereId && boites.length > 0 && (
          <select
            id="boite_id"
            name="boite_id"
            value={formData.emplacement_id === parseInt(etagereId) ? '' : formData.emplacement_id || ''}
            onChange={handleBoiteChange}
            className="form-control"
            style={{ marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            <option value="">-- Aucune boîte (utiliser étagère) --</option>
            {boites.map(boite => (
              <option key={boite.id} value={boite.id}>
                📦 {boite.code}
              </option>
            ))}
          </select>
        )}

        <small style={{fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '0.25rem'}}>
          Hiérarchie : Zone → Étagère → Boîte (3 niveaux maximum)
        </small>

        {/* Bouton suggestions */}
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadSuggestions}
            disabled={!formData.categorie_id || loadingSuggestions || isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <path d="M12 17h.01"></path>
            </svg>
            {loadingSuggestions ? 'Chargement...' : 'Suggérer un emplacement'}
          </button>
          {!formData.categorie_id && (
            <small style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
              💡 Sélectionnez d'abord une catégorie pour voir les suggestions
            </small>
          )}
        </div>

        {/* Liste des suggestions */}
        {showSuggestions && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 'bold', color: '#495057' }}>
                💡 Emplacements suggérés
              </h4>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: '#6c757d'
                }}
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {suggestions.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: 0 }}>
                Aucune suggestion disponible. Aucun article de cette catégorie n'est encore rangé.
              </p>
            ) : (
              <>
                <p style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.75rem' }}>
                  Basé sur les {suggestions.reduce((sum, s) => sum + s.count, 0)} article(s) de cette catégorie déjà rangés :
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {suggestions.map((suggestion, index) => {
                    const emp = suggestion.emplacement
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applySuggestion(emp)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'white',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#667eea'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#dee2e6'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {emp.niveau === 0 && '🏢'}
                            {emp.niveau === 1 && '📚'}
                            {emp.niveau === 2 && '📦'}
                            <span>{emp.code}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                            {emp.code_complet && emp.code_complet !== emp.code && (
                              <div>{emp.code_complet}</div>
                            )}
                            <div style={{ fontStyle: 'italic' }}>{suggestion.raison}</div>
                          </div>
                        </div>
                        <div style={{
                          background: '#667eea',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          #{index + 1}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

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

      <div className="form-group">
        <label>Fournisseurs</label>
        <p className="help-text">
          Sélectionnez les fournisseurs qui proposent cet article
        </p>
        <FournisseurInput
          selectedFournisseurs={formData.fournisseur_ids}
          onChange={handleFournisseursChange}
          disabled={isSubmitting}
        />
      </div>

      {/* Champs conditionnels fournisseur (affichés si au moins un fournisseur sélectionné) */}
      {formData.fournisseur_ids.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', color: '#495057' }}>
            Informations fournisseur
          </h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prix_fournisseur">Prix d'achat fournisseur (€)</label>
              <input
                type="number"
                id="prix_fournisseur"
                name="prix_fournisseur"
                value={formData.prix_fournisseur}
                onChange={handleChange}
                className={errors.prix_fournisseur ? 'error' : ''}
                disabled={isSubmitting}
                step="0.01"
                min="0"
                placeholder="Prix d'achat"
              />
              {errors.prix_fournisseur && <span className="error-message">{errors.prix_fournisseur}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="ref_fournisseur">Référence fournisseur</label>
              <input
                type="text"
                id="ref_fournisseur"
                name="ref_fournisseur"
                value={formData.ref_fournisseur}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="REF-123"
                maxLength="50"
              />
            </div>

            <div className="form-group">
              <label htmlFor="delai_livraison">Délai de livraison (jours)</label>
              <input
                type="number"
                id="delai_livraison"
                name="delai_livraison"
                value={formData.delai_livraison}
                onChange={handleChange}
                className={errors.delai_livraison ? 'error' : ''}
                disabled={isSubmitting}
                min="0"
                placeholder="7"
              />
              {errors.delai_livraison && <span className="error-message">{errors.delai_livraison}</span>}
            </div>
          </div>
        </div>
      )}

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
