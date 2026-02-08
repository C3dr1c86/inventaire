# Instructions pour terminer l'implémentation

## Phase 5 : Double Select Cascadé dans ArticleForm

### Code à ajouter dans `frontend/src/components/articles/ArticleForm.jsx`

Remplacer les imports et le début du composant par :

```javascript
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCategories, getCategoriesRacines, getSousCategories } from '../../services/categorieService'
import TagInput from '../tags/TagInput'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function ArticleForm({ article, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    nom: '',
    sku: '',
    quantite: 0,
    quantite_min: 10,
    prix_unitaire: 0,
    categorie_id: '',
    description: '',
    tag_ids: []
  })

  // NOUVEAU : États pour le double select
  const [categorieParenteId, setCategorieParenteId] = useState('')
  const [sousCategories, setSousCategories] = useState([])

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

  // Pré-remplir le formulaire en mode édition
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
        description: article.description || '',
        tag_ids: article.tags?.map(t => t.id) || []
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

  // Charger les sous-catégories quand le parent change
  const loadSousCategories = async (parentId) => {
    if (!parentId) {
      setSousCategories([])
      return
    }

    try {
      const data = await getSousCategories(parentId)
      setSousCategories(data)
    } catch (error) {
      console.error('Erreur chargement sous-catégories:', error)
      setSousCategories([])
    }
  }

  // Gérer changement de catégorie parente
  const handleCategorieParenteChange = (e) => {
    const parentId = e.target.value
    setCategorieParenteId(parentId)

    if (parentId) {
      loadSousCategories(parentId)
      // Réinitialiser la sous-catégorie sélectionnée
      setFormData(prev => ({ ...prev, categorie_id: '' }))
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

  // ... reste du code existant (handleChange, validate, handleSubmit) ...
}
```

### Dans le return du formulaire, remplacer le select catégorie par :

```jsx
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
```

---

## Phase 6 : Affichage Arbre Hiérarchique dans Categories.jsx

### Modifier la query et l'affichage :

```javascript
// Remplacer le useQuery actuel par :
const { data: categoriesTree, isLoading, error } = useQuery({
  queryKey: ['categories-tree'],
  queryFn: getCategoriesTree
})

// Dans le JSX du tableau, remplacer par :
<tbody>
  {categoriesTree?.map(categorie => (
    <React.Fragment key={categorie.id}>
      {/* Catégorie racine */}
      <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
        <td data-label="Nom">
          📁 {categorie.nom}
          {categorie.children?.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#6c757d', marginLeft: '0.5rem' }}>
              ({categorie.children.length} sous-catégorie{categorie.children.length > 1 ? 's' : ''})
            </span>
          )}
        </td>
        <td data-label="Description">{categorie.description || '-'}</td>
        <td data-label="Actions">
          <button onClick={() => handleEdit(categorie)} className="btn btn-sm btn-secondary">
            Modifier
          </button>
          <button onClick={() => handleDelete(categorie.id)} className="btn btn-sm btn-danger" style={{ marginLeft: '0.5rem' }}>
            Supprimer
          </button>
        </td>
      </tr>

      {/* Sous-catégories (indentées) */}
      {categorie.children?.map(sousCategorie => (
        <tr key={sousCategorie.id} style={{ backgroundColor: '#fff' }}>
          <td data-label="Nom" style={{ paddingLeft: '2rem' }}>
            ↳ {sousCategorie.nom}
          </td>
          <td data-label="Description">{sousCategorie.description || '-'}</td>
          <td data-label="Actions">
            <button onClick={() => handleEdit(sousCategorie)} className="btn btn-sm btn-secondary">
              Modifier
            </button>
            <button onClick={() => handleDelete(sousCategorie.id)} className="btn btn-sm btn-danger" style={{ marginLeft: '0.5rem' }}>
              Supprimer
            </button>
          </td>
        </tr>
      ))}
    </React.Fragment>
  ))}
</tbody>
```

Pensez aussi à importer `React` et `getCategoriesTree` :

```javascript
import React from 'react'
import { getCategoriesTree } from '../services/categorieService'
```

---

## Test Complet

1. **Supprimer la DB et redémarrer** :
   ```bash
   rm backend/database/inventaire.db
   cd backend && uvicorn app.main:app --reload
   ```

2. **Créer la structure hiérarchique** :
   - Catégorie racine : "Matériaux"
   - Sous-catégories : "Bois", "Métal", "Plastique", "Autres"
   - Catégorie racine : "Consommables"
   - Sous-catégories : "Quincaillerie", "Électricité", etc.

3. **Créer un article** avec le double select

4. **Vérifier les validations** :
   - Essayer de supprimer "Matériaux" (doit échouer si a des enfants)
   - Essayer de créer une sous-sous-catégorie (doit échouer - max 2 niveaux)

Bon courage pour terminer l'implémentation ! 🚀
