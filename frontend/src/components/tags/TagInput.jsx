/**
 * Composant de sélection de tags.
 *
 * Permet uniquement de sélectionner des tags existants.
 * La création de tags se fait sur la page dédiée /tags.
 */

import { useQuery } from '@tanstack/react-query'
import { getTags } from '../../services/tagService'
import { X } from 'lucide-react'
import './TagInput.css'

function TagInput({ selectedTags = [], onChange, disabled = false }) {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags()
  })

  const handleToggleTag = (tagId) => {
    if (disabled) return
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId))
    } else {
      onChange([...selectedTags, tagId])
    }
  }

  if (isLoading) {
    return <div className="loader"></div>
  }

  if (tags.length === 0) {
    return (
      <p className="help-text">
        Aucun tag disponible — créez-en sur la page <a href="/tags">Tags</a>.
      </p>
    )
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
      </div>
    </div>
  )
}

export default TagInput
