/**
 * Formulaire de création/modification de fournisseur.
 *
 * Gère la validation et la soumission des données fournisseur.
 */

import { useState, useEffect } from 'react'

function FournisseurForm({ fournisseur, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    nom: '',
    contact: '',
    email: '',
    telephone: '',
    adresse: '',
    site_web: '',
    description: ''
  })

  const [errors, setErrors] = useState({})

  // Pré-remplir le formulaire si on modifie un fournisseur
  useEffect(() => {
    if (fournisseur) {
      setFormData({
        nom: fournisseur.nom || '',
        contact: fournisseur.contact || '',
        email: fournisseur.email || '',
        telephone: fournisseur.telephone || '',
        adresse: fournisseur.adresse || '',
        site_web: fournisseur.site_web || '',
        description: fournisseur.description || ''
      })
    }
  }, [fournisseur])

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

    // Validation email (si fourni)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    // Validation URL (si fournie)
    if (formData.site_web) {
      try {
        new URL(formData.site_web)
      } catch {
        newErrors.site_web = 'URL invalide (format: http://exemple.com)'
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
      nom: formData.nom.trim(),
      contact: formData.contact.trim() || null,
      email: formData.email.trim() || null,
      telephone: formData.telephone.trim() || null,
      adresse: formData.adresse.trim() || null,
      site_web: formData.site_web.trim() || null,
      description: formData.description.trim() || null
    }

    onSubmit(dataToSubmit)
  }

  return (
    <form onSubmit={handleSubmit} className="fournisseur-form">
      <div className="form-group">
        <label htmlFor="nom">
          Nom du fournisseur <span className="required">*</span>
        </label>
        <input
          type="text"
          id="nom"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          className={errors.nom ? 'error' : ''}
          disabled={isSubmitting}
          placeholder="ex: Acme Corp, Tech Solutions"
          maxLength="100"
        />
        {errors.nom && <span className="error-message">{errors.nom}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="contact">Nom du contact</label>
        <input
          type="text"
          id="contact"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="ex: Jean Dupont"
          maxLength="100"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
          disabled={isSubmitting}
          placeholder="contact@fournisseur.com"
          maxLength="100"
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="telephone">Téléphone</label>
        <input
          type="tel"
          id="telephone"
          name="telephone"
          value={formData.telephone}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="01 23 45 67 89"
          maxLength="20"
        />
      </div>

      <div className="form-group">
        <label htmlFor="adresse">Adresse</label>
        <textarea
          id="adresse"
          name="adresse"
          value={formData.adresse}
          onChange={handleChange}
          rows="2"
          disabled={isSubmitting}
          placeholder="Adresse complète du fournisseur"
          maxLength="500"
        />
      </div>

      <div className="form-group">
        <label htmlFor="site_web">Site web</label>
        <input
          type="url"
          id="site_web"
          name="site_web"
          value={formData.site_web}
          onChange={handleChange}
          className={errors.site_web ? 'error' : ''}
          disabled={isSubmitting}
          placeholder="https://www.exemple.com"
          maxLength="255"
        />
        {errors.site_web && <span className="error-message">{errors.site_web}</span>}
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
          placeholder="Description optionnelle du fournisseur, spécialités, notes..."
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
          {isSubmitting ? 'Enregistrement...' : (fournisseur ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  )
}

export default FournisseurForm
