/**
 * Composant de sélection et création de fournisseurs.
 *
 * Permet de sélectionner des fournisseurs existants et d'en créer de nouveaux.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFournisseurs, createFournisseur } from '../../services/fournisseurService'
import { Plus, X } from 'lucide-react'
import './FournisseurInput.css'

function FournisseurInput({ selectedFournisseurs = [], onChange, disabled = false }) {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newFournisseur, setNewFournisseur] = useState({
    nom: '',
    contact: '',
    email: '',
    telephone: ''
  })
  const [errors, setErrors] = useState({})

  // Charger tous les fournisseurs disponibles
  const { data: fournisseurs = [], isLoading } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: () => getFournisseurs()
  })

  // Mutation pour créer un nouveau fournisseur
  const createMutation = useMutation({
    mutationFn: createFournisseur,
    onSuccess: (createdFournisseur) => {
      // Invalider le cache pour recharger la liste des fournisseurs
      queryClient.invalidateQueries(['fournisseurs'])
      // Ajouter automatiquement le nouveau fournisseur à la sélection
      onChange([...selectedFournisseurs, createdFournisseur.id])
      // Réinitialiser le formulaire
      setNewFournisseur({ nom: '', contact: '', email: '', telephone: '' })
      setIsCreating(false)
      setErrors({})
    },
    onError: (error) => {
      setErrors({ submit: error.response?.data?.detail || 'Erreur lors de la création du fournisseur' })
    }
  })

  const handleToggleFournisseur = (fournisseurId) => {
    if (disabled) return

    if (selectedFournisseurs.includes(fournisseurId)) {
      // Retirer le fournisseur
      onChange(selectedFournisseurs.filter(id => id !== fournisseurId))
    } else {
      // Ajouter le fournisseur
      onChange([...selectedFournisseurs, fournisseurId])
    }
  }

  const handleCreateFournisseur = (e) => {
    e.preventDefault()

    // Validation
    const newErrors = {}
    if (!newFournisseur.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }
    if (newFournisseur.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFournisseur.email)) {
      newErrors.email = 'Email invalide'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Ne garder que les champs remplis
    const data = { nom: newFournisseur.nom.trim() }
    if (newFournisseur.contact.trim()) data.contact = newFournisseur.contact.trim()
    if (newFournisseur.email.trim()) data.email = newFournisseur.email.trim()
    if (newFournisseur.telephone.trim()) data.telephone = newFournisseur.telephone.trim()

    createMutation.mutate(data)
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewFournisseur({ nom: '', contact: '', email: '', telephone: '' })
    setErrors({})
  }

  if (isLoading) {
    return <div className="loader"></div>
  }

  return (
    <div className="fournisseur-input">
      <div className="fournisseurs-list">
        {fournisseurs.map(fournisseur => {
          const isSelected = selectedFournisseurs.includes(fournisseur.id)
          return (
            <button
              key={fournisseur.id}
              type="button"
              className={`fournisseur-badge ${isSelected ? 'selected' : ''}`}
              onClick={() => handleToggleFournisseur(fournisseur.id)}
              disabled={disabled}
              title={fournisseur.contact || fournisseur.nom}
            >
              <span>{fournisseur.nom}</span>
              {isSelected && <X size={14} className="fournisseur-remove-icon" />}
            </button>
          )
        })}

        {!isCreating && (
          <button
            type="button"
            className="fournisseur-badge create-new"
            onClick={() => setIsCreating(true)}
            disabled={disabled}
          >
            <Plus size={14} />
            <span>Créer un fournisseur</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="fournisseur-create-form">
          <form onSubmit={handleCreateFournisseur}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fournisseur-nom">
                  Nom <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="fournisseur-nom"
                  value={newFournisseur.nom}
                  onChange={(e) => {
                    setNewFournisseur({ ...newFournisseur, nom: e.target.value })
                    setErrors({ ...errors, nom: null })
                  }}
                  className={errors.nom ? 'error' : ''}
                  placeholder="ex: Acme Corp"
                  maxLength="100"
                  disabled={createMutation.isPending}
                />
                {errors.nom && <span className="error-message">{errors.nom}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fournisseur-email">Email</label>
                <input
                  type="email"
                  id="fournisseur-email"
                  value={newFournisseur.email}
                  onChange={(e) => {
                    setNewFournisseur({ ...newFournisseur, email: e.target.value })
                    setErrors({ ...errors, email: null })
                  }}
                  className={errors.email ? 'error' : ''}
                  placeholder="contact@fournisseur.com"
                  disabled={createMutation.isPending}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fournisseur-contact">Contact</label>
                <input
                  type="text"
                  id="fournisseur-contact"
                  value={newFournisseur.contact}
                  onChange={(e) => setNewFournisseur({ ...newFournisseur, contact: e.target.value })}
                  placeholder="Nom du contact"
                  maxLength="100"
                  disabled={createMutation.isPending}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fournisseur-telephone">Téléphone</label>
                <input
                  type="tel"
                  id="fournisseur-telephone"
                  value={newFournisseur.telephone}
                  onChange={(e) => setNewFournisseur({ ...newFournisseur, telephone: e.target.value })}
                  placeholder="01 23 45 67 89"
                  maxLength="20"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>

            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancelCreate}
                className="btn btn-secondary btn-sm"
                disabled={createMutation.isPending}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default FournisseurInput
