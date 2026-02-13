/**
 * Formulaire de création/modification d'emplacement physique.
 *
 * Gère la validation et la soumission des données pour les emplacements
 * (Zones, Étagères, Boîtes) avec hiérarchie à 3 niveaux maximum.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEmplacements } from '../../services/emplacementService'

function EmplacementForm({ emplacement, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    capacite_max: '',
    parent_id: ''
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

  // Pré-remplir le formulaire si on modifie un emplacement
  useEffect(() => {
    if (emplacement) {
      setFormData({
        code: emplacement.code || '',
        description: emplacement.description || '',
        capacite_max: emplacement.capacite_max || '',
        parent_id: emplacement.parent_id || ''
      })
    }
  }, [emplacement])

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

  const validate = () => {
    const newErrors = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Le code est requis'
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
          disabled={isSubmitting}
        >
          <option value="">-- Aucun (Zone principale) --</option>
          {parentsDisponibles?.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.niveau === 0 ? '🏢' : '📚'} {emp.code}
              {emp.niveau === 1 && ' (Étagère)'}
            </option>
          ))}
        </select>
        <small style={{fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '0.25rem'}}>
          Hiérarchie : Zone (racine) → Étagère → Boîte (3 niveaux maximum). Sélectionnez une Étagère pour créer une Boîte.
        </small>
      </div>

      {/* Code de l'emplacement */}
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
