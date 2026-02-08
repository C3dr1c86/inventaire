/**
 * Formulaire de création/modification de tag.
 *
 * Gère la validation et la soumission des données tag.
 */

import { useState, useEffect } from 'react'

function TagForm({ tag, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    nom: '',
    couleur: '#3498db',
    description: ''
  })

  const [errors, setErrors] = useState({})

  // Pré-remplir le formulaire si on modifie un tag
  useEffect(() => {
    if (tag) {
      setFormData({
        nom: tag.nom || '',
        couleur: tag.couleur || '#3498db',
        description: tag.description || ''
      })
    }
  }, [tag])

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

    if (formData.couleur && !/^#[0-9A-Fa-f]{6}$/.test(formData.couleur)) {
      newErrors.couleur = 'Couleur invalide (format: #RRGGBB)'
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
      couleur: formData.couleur,
      description: formData.description.trim() || null
    }

    onSubmit(dataToSubmit)
  }

  return (
    <form onSubmit={handleSubmit} className="tag-form">
      <div className="form-group">
        <label htmlFor="nom">
          Nom du tag <span className="required">*</span>
        </label>
        <input
          type="text"
          id="nom"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          className={errors.nom ? 'error' : ''}
          disabled={isSubmitting}
          placeholder="ex: machine1, univers1"
          maxLength="50"
        />
        {errors.nom && <span className="error-message">{errors.nom}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="couleur">Couleur</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="color"
            id="couleur"
            name="couleur"
            value={formData.couleur}
            onChange={handleChange}
            className={errors.couleur ? 'error' : ''}
            disabled={isSubmitting}
            style={{ width: '60px', height: '40px', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={formData.couleur}
            onChange={handleChange}
            name="couleur"
            placeholder="#3498db"
            maxLength="7"
            style={{ flex: 1 }}
            disabled={isSubmitting}
          />
        </div>
        {errors.couleur && <span className="error-message">{errors.couleur}</span>}
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
          placeholder="Description optionnelle du tag"
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
          {isSubmitting ? 'Enregistrement...' : (tag ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

export default TagForm
