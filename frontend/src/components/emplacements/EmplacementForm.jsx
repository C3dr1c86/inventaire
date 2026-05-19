/**
 * Formulaire de création/modification d'emplacement physique.
 *
 * Gère la validation et la soumission des données pour les emplacements
 * (Zones, Étagères, Boîtes) avec hiérarchie à 3 niveaux maximum.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEmplacements } from '../../services/emplacementService'

function EmplacementForm({
  emplacement,
  onSubmit,
  onCancel,
  isSubmitting,
  initialParentId = '',
  creationType = 'emplacement'
}) {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    capacite_max: '',
    parent_id: initialParentId || ''
  })

  const [bulkBoxes, setBulkBoxes] = useState({
    enabled: creationType === 'boites',
    prefix: '',
    start: '1',
    count: '6'
  })

  const [errors, setErrors] = useState({})

  // Charger TOUS les emplacements pour le select parent
  // Filtrer ceux de niveau 0 et 1 (Zones et Étagères) pour permettre 3 niveaux
  const { data: tousEmplacements } = useQuery({
    queryKey: ['emplacements'],
    queryFn: getEmplacements
  })

  // Filtrer les emplacements qui peuvent être parents (niveau 0 et 1 seulement)
  const parentsDisponibles = tousEmplacements?.filter(emp => emp.niveau <= 1) || []
  const selectedParent = parentsDisponibles.find(emp => emp.id === parseInt(formData.parent_id))
  const canCreateBulkBoxes = selectedParent?.niveau === 1

  // Pré-remplir le formulaire si on modifie un emplacement
  useEffect(() => {
    if (emplacement) {
      setFormData({
        code: emplacement.code || '',
        description: emplacement.description || '',
        capacite_max: emplacement.capacite_max || '',
        parent_id: emplacement.parent_id || ''
      })
      setBulkBoxes(prev => ({ ...prev, enabled: false }))
    } else {
      setFormData(prev => ({
        ...prev,
        parent_id: initialParentId || ''
      }))
      setBulkBoxes(prev => ({
        ...prev,
        enabled: creationType === 'boites'
      }))
    }
  }, [emplacement, initialParentId, creationType])

  useEffect(() => {
    if (bulkBoxes.enabled && selectedParent && !canCreateBulkBoxes) {
      setBulkBoxes(prev => ({ ...prev, enabled: false }))
    }
  }, [bulkBoxes.enabled, selectedParent, canCreateBulkBoxes])

  useEffect(() => {
    if (!emplacement && creationType === 'boites' && selectedParent && !bulkBoxes.prefix) {
      setBulkBoxes(prev => ({ ...prev, prefix: `${selectedParent.code}-B` }))
    }
  }, [emplacement, creationType, selectedParent, bulkBoxes.prefix])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleBulkBoxesChange = (e) => {
    const { name, value, type, checked } = e.target
    setBulkBoxes(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!bulkBoxes.enabled && !formData.code.trim()) {
      newErrors.code = 'Le code est requis'
    }

    if (!emplacement && bulkBoxes.enabled) {
      if (!formData.parent_id || !canCreateBulkBoxes) {
        newErrors.parent_id = 'Sélectionnez une étagère pour créer des boîtes'
      }

      if (!bulkBoxes.prefix.trim()) {
        newErrors.prefix = 'Le préfixe est requis'
      }

      const start = parseInt(bulkBoxes.start)
      if (isNaN(start) || start < 1) {
        newErrors.start = 'Le numéro de départ doit être positif'
      }

      const count = parseInt(bulkBoxes.count)
      if (isNaN(count) || count < 1 || count > 99) {
        newErrors.count = 'Le nombre de boîtes doit être compris entre 1 et 99'
      }
    }

    // Validation capacité maximale (doit être un entier positif si renseigné)
    if (formData.capacite_max && formData.capacite_max.trim()) {
      const capacite = parseInt(formData.capacite_max)
      if (isNaN(capacite) || capacite <= 0) {
        newErrors.capacite_max = 'La capacité doit être un nombre positif'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Nettoyer les données avant soumission (null au lieu de chaîne vide)
    if (!emplacement && bulkBoxes.enabled) {
      onSubmit({
        mode: 'bulk_boxes',
        parent_id: parseInt(formData.parent_id),
        prefix: bulkBoxes.prefix.trim(),
        start: parseInt(bulkBoxes.start),
        count: parseInt(bulkBoxes.count),
        capacite_max: formData.capacite_max ? parseInt(formData.capacite_max) : null,
        description: formData.description.trim() || null
      })
      return
    }

    const dataToSubmit = {
      code: formData.code.trim(),
      description: formData.description.trim() || null,
      capacite_max: formData.capacite_max ? parseInt(formData.capacite_max) : null,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null
    }

    onSubmit(dataToSubmit)
  }

  return (
    <form onSubmit={handleSubmit} className="emplacement-form">
      {/* Select emplacement parent */}
      <div className="form-group">
        <label htmlFor="parent_id">
          Emplacement parent{' '}
          <span style={{fontSize: '0.875rem', color: '#6c757d', fontWeight: 'normal'}}>
            (optionnel - laisser vide pour créer une Zone)
          </span>
        </label>
        <select
          id="parent_id"
          name="parent_id"
          value={formData.parent_id}
          onChange={handleChange}
          disabled={isSubmitting || !!initialParentId}
          className={errors.parent_id ? 'error' : ''}
        >
          <option value="">-- Aucun (Zone principale) --</option>
          {parentsDisponibles?.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.niveau === 0 ? '🏢' : '📚'} {emp.code}
              {emp.niveau === 1 && ' (Étagère)'}
            </option>
          ))}
        </select>
        {errors.parent_id && <span className="error-message">{errors.parent_id}</span>}
        <small style={{fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '0.25rem'}}>
          Hiérarchie : Zone (racine) → Étagère → Boîte (3 niveaux maximum). Sélectionnez une Étagère pour créer une Boîte.
        </small>
      </div>

      {!emplacement && formData.parent_id && canCreateBulkBoxes && (
        <div className="form-group">
          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              name="enabled"
              checked={bulkBoxes.enabled}
              onChange={handleBulkBoxesChange}
              disabled={isSubmitting}
            />
            Créer plusieurs boîtes
          </label>
          <small style={{fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '0.25rem'}}>
            Pratique pour générer une série comme B01, B02, B03 sous la même étagère.
          </small>
        </div>
      )}

      {!emplacement && bulkBoxes.enabled && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="prefix">
              Préfixe des boîtes <span className="required">*</span>
            </label>
            <input
              type="text"
              id="prefix"
              name="prefix"
              value={bulkBoxes.prefix}
              onChange={handleBulkBoxesChange}
              className={errors.prefix ? 'error' : ''}
              disabled={isSubmitting}
              placeholder="ex: B"
            />
            {errors.prefix && <span className="error-message">{errors.prefix}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="start">Départ</label>
            <input
              type="number"
              id="start"
              name="start"
              value={bulkBoxes.start}
              onChange={handleBulkBoxesChange}
              className={errors.start ? 'error' : ''}
              disabled={isSubmitting}
              min="1"
            />
            {errors.start && <span className="error-message">{errors.start}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="count">Nombre</label>
            <input
              type="number"
              id="count"
              name="count"
              value={bulkBoxes.count}
              onChange={handleBulkBoxesChange}
              className={errors.count ? 'error' : ''}
              disabled={isSubmitting}
              min="1"
              max="99"
            />
            {errors.count && <span className="error-message">{errors.count}</span>}
          </div>
        </div>
      )}

      {/* Code de l'emplacement */}
      {!bulkBoxes.enabled && (
      <div className="form-group">
        <label htmlFor="code">
          Code de l'emplacement <span className="required">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          className={errors.code ? 'error' : ''}
          disabled={isSubmitting}
          placeholder="ex: ATELIER-A1, ZONE-BOIS, ETAGERE-3"
        />
        {errors.code && <span className="error-message">{errors.code}</span>}
        <small style={{fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '0.25rem'}}>
          Code unique pour identifier l'emplacement (alphanumérique, tirets acceptés)
        </small>
      </div>
      )}

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          disabled={isSubmitting}
          placeholder="Description optionnelle de l'emplacement"
        />
      </div>

      {/* Capacité maximale */}
      <div className="form-group">
        <label htmlFor="capacite_max">
          Capacité maximale{' '}
          <span style={{fontSize: '0.875rem', color: '#6c757d', fontWeight: 'normal'}}>
            (optionnel - laisser vide pour capacité illimitée)
          </span>
        </label>
        <input
          type="number"
          id="capacite_max"
          name="capacite_max"
          value={formData.capacite_max}
          onChange={handleChange}
          min="1"
          className={errors.capacite_max ? 'error' : ''}
          disabled={isSubmitting}
          placeholder="ex: 100"
        />
        {errors.capacite_max && <span className="error-message">{errors.capacite_max}</span>}
        <small style={{fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '0.25rem'}}>
          Nombre maximum d'articles pouvant être stockés dans cet emplacement
        </small>
      </div>

      {/* Boutons d'action */}
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
          {isSubmitting ? 'Enregistrement...' : (emplacement ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

export default EmplacementForm
