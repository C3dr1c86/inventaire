/**
 * Composant de sélection de fournisseurs.
 *
 * Permet uniquement de sélectionner des fournisseurs existants.
 * La création de fournisseurs se fait sur la page dédiée /fournisseurs.
 */

import { useQuery } from '@tanstack/react-query'
import { getFournisseurs } from '../../services/fournisseurService'
import { X } from 'lucide-react'
import './FournisseurInput.css'

function FournisseurInput({ selectedFournisseurs = [], onChange, disabled = false }) {
  const { data: fournisseurs = [], isLoading } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: () => getFournisseurs()
  })

  const handleToggleFournisseur = (fournisseurId) => {
    if (disabled) return
    if (selectedFournisseurs.includes(fournisseurId)) {
      onChange(selectedFournisseurs.filter(id => id !== fournisseurId))
    } else {
      onChange([...selectedFournisseurs, fournisseurId])
    }
  }

  if (isLoading) {
    return <div className="loader"></div>
  }

  if (fournisseurs.length === 0) {
    return (
      <p className="help-text">
        Aucun fournisseur disponible — créez-en sur la page <a href="/fournisseurs">Fournisseurs</a>.
      </p>
    )
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
      </div>
    </div>
  )
}

export default FournisseurInput
