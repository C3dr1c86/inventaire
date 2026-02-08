/**
 * Composant de sélection et création de tags.
 *
 * Permet de sélectionner des tags existants et d'en créer de nouveaux.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTags, createTag } from '../../services/tagService'
import { Plus, X } from 'lucide-react'
import './TagInput.css'

function TagInput({ selectedTags = [], onChange, disabled = false }) {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newTag, setNewTag] = useState({
    nom: '',
    couleur: '#3498db',
    description: ''
  })
  const [errors, setErrors] = useState({})

  // Charger tous les tags disponibles
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags()
  })

  // Mutation pour créer un nouveau tag
  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: (createdTag) => {
      // Invalider le cache pour recharger la liste des tags
      queryClient.invalidateQueries(['tags'])
      // Ajouter automatiquement le nouveau tag à la sélection
      onChange([...selectedTags, createdTag.id])
      // Réinitialiser le formulaire
      setNewTag({ nom: '', couleur: '#3498db', description: '' })
      setIsCreating(false)
      setErrors({})
    },
    onError: (error) => {
      setErrors({ submit: error.response?.data?.detail || 'Erreur lors de la création du tag' })
    }
  })

  const handleToggleTag = (tagId) => {
    if (disabled) return

    if (selectedTags.includes(tagId)) {
      // Retirer le tag
      onChange(selectedTags.filter(id => id !== tagId))
    } else {
      // Ajouter le tag
      onChange([...selectedTags, tagId])
    }
  }

  const handleCreateTag = (e) => {
    e.preventDefault()

    // Validation
    const newErrors = {}
    if (!newTag.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }
    if (newTag.couleur && !/^#[0-9A-Fa-f]{6}$/.test(newTag.couleur)) {
      newErrors.couleur = 'Couleur invalide (format: #RRGGBB)'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createMutation.mutate(newTag)
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewTag({ nom: '', couleur: '#3498db', description: '' })
    setErrors({})
  }

  if (isLoading) {
    return <div className="loader"></div>
  }

  return (
    <div className="tag-input">
      <div className="tags-list">
        {tags.map(tag => {
          const isSelected = selectedTags.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              className={`tag-badge ${isSelected ? 'selected' : ''}`}
              style={{
                backgroundColor: isSelected ? (tag.couleur || '#3498db') : '#e0e0e0',
                color: isSelected ? '#fff' : '#666',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handleToggleTag(tag.id)}
              disabled={disabled}
              title={tag.description || tag.nom}
            >
              <span>{tag.nom}</span>
              {isSelected && <X size={14} className="tag-remove-icon" />}
            </button>
          )
        })}

        {!isCreating && (
          <button
            type="button"
            className="tag-badge create-new"
            onClick={() => setIsCreating(true)}
            disabled={disabled}
          >
            <Plus size={14} />
            <span>Créer un tag</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="tag-create-form">
          <form onSubmit={handleCreateTag}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tag-nom">
                  Nom <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="tag-nom"
                  value={newTag.nom}
                  onChange={(e) => {
                    setNewTag({ ...newTag, nom: e.target.value })
                    setErrors({ ...errors, nom: null })
                  }}
                  className={errors.nom ? 'error' : ''}
                  placeholder="ex: machine1, univers1"
                  maxLength="50"
                  disabled={createMutation.isPending}
                />
                {errors.nom && <span className="error-message">{errors.nom}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="tag-couleur">Couleur</label>
                <input
                  type="color"
                  id="tag-couleur"
                  value={newTag.couleur}
                  onChange={(e) => {
                    setNewTag({ ...newTag, couleur: e.target.value })
                    setErrors({ ...errors, couleur: null })
                  }}
                  className={errors.couleur ? 'error' : ''}
                  disabled={createMutation.isPending}
                />
                {errors.couleur && <span className="error-message">{errors.couleur}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tag-description">Description</label>
              <input
                type="text"
                id="tag-description"
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                placeholder="Description optionnelle"
                disabled={createMutation.isPending}
              />
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

export default TagInput
