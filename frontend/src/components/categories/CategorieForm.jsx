/**
 * Formulaire de création/modification de catégorie.
 *
 * Gère la validation et la soumission des données catégorie.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCategoriesRacines } from '../../services/categorieService'

function CategorieForm({ categorie, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    parent_id: ''  // NOUVEAU : Champ parent
  })

  const [errors, setErrors] = useState({})

  // Charger les catégories racines pour le select parent
  const { data: categoriesRacines } = useQuery({
    queryKey: ['categories-racines'],
    queryFn: getCategoriesRacines
  })

  // Pré-remplir le formulaire si on modifie une catégorie
  useEffect(() => {
    if (categorie) {
      setFormData({
        nom: categorie.nom || '',
        description: categorie.description || '',
        parent_id: categorie.parent_id || ''  // NOUVEAU
      })
    }
  }, [categorie])

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

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
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
      nom: formData.nom.trim(),
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      description: formData.description.trim() || null
    }

    onSubmit(dataToSubmit)
  }

  return (
    <form onSubmit={handleSubmit} className="categorie-form">
      {/* NOUVEAU : Select catégorie parente */}
      <div className="form-group">
        <label htmlFor="parent_id">
          Catégorie parente{' '}
          <span style={{fontSize: '0.875rem', color: '#6c757d', fontWeight: 'normal'}}>
            (optionnel - laisser vide pour créer une catégorie principale)
          </span>
        </label>
        <select
          id="parent_id"
          name="parent_id"
          value={formData.parent_id}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          <option value="">-- Aucune (Catégorie principale) --</option>
          {categoriesRacines?.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nom}
            </option>
          ))}
        </select>
        <small style={{fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '0.25rem'}}>
          Si vous sélectionnez une catégorie parente, ceci deviendra une sous-catégorie.
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="nom">
          Nom de la catégorie <span className="required">*</span>
        </label>
        <input
          type="text"
          id="nom"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          className={errors.nom ? 'error' : ''}
          disabled={isSubmitting}
          placeholder="ex: Électricité, Mécanique, Informatique"
        />
        {errors.nom && <span className="error-message">{errors.nom}</span>}
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
          placeholder="Description optionnelle de la catégorie"
        />
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
          {isSubmitting ? 'Enregistrement...' : (categorie ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

export default CategorieForm
