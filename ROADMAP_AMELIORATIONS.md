# 🗺️ ROADMAP D'AMÉLIORATION - Application Gestion d'Inventaire

Document créé le : 2026-02-07
Basé sur l'analyse complète du code backend et frontend

---

## 📊 Vue d'ensemble

| Catégorie | Problèmes | Critiques 🔴 | Importants ⚠️ | Nice to have 💡 |
|-----------|-----------|--------------|---------------|-----------------|
| **Backend** | 12 | 3 | 3 | 6 |
| **Frontend** | 35 | 1 | 9 | 25 |
| **TOTAL** | **47** | **4** | **12** | **31** |

---

## 🔴 CRITIQUES - À CORRIGER IMMÉDIATEMENT (Sprint 1)

### Backend (3 problèmes)

#### 1. SECRET_KEY en clair 🔒
**Fichier** : `backend/app/auth.py` ligne 20
**Problème** : La clé secrète JWT est hardcodée dans le code
**Impact** : Compromission des tokens JWT en production
**Solution** :
```python
# Dans auth.py
from os import getenv
SECRET_KEY = getenv("SECRET_KEY", "dev-key-change-in-production")

# Dans .env
SECRET_KEY=votre-cle-secrete-generee-avec-openssl-rand-hex-32
```
**Temps estimé** : 15 minutes
**Assigné à** : Backend dev

---

#### 2. Requêtes N+1 dans `get_valeur_totale_stock()` ⚡
**Fichier** : `backend/app/crud.py` lignes 574-622
**Problème** : Une requête par catégorie au lieu d'une seule
**Impact** : Performance exponentielle (avec 100 catégories = 102 requêtes au lieu de 1)
**Solution** :
```python
# Ligne 585 : Ajouter joinedload
from sqlalchemy.orm import joinedload

articles = db.query(models.Article)\
    .options(joinedload(models.Article.categorie))\
    .options(joinedload(models.Article.tags))\
    .all()

# Lignes 589-595 : Utiliser group_by au lieu de boucler
from sqlalchemy import func

resultats = db.query(
    models.Categorie.nom,
    func.sum(models.Article.quantite * models.Article.prix_unitaire).label('valeur')
)\
.join(models.Article)\
.group_by(models.Categorie.id)\
.all()
```
**Temps estimé** : 1 heure
**Assigné à** : Backend dev

---

#### 3. Requête N+1 dans `get_statistiques()` ⚡
**Fichier** : `backend/app/crud.py` lignes 625-647
**Problème** : Appelle `get_valeur_totale_stock()` qui contient des N+1
**Impact** : Dashboard lent
**Solution** : Corriger le problème #2 ci-dessus résoudra automatiquement celui-ci
**Temps estimé** : Inclus dans #2
**Assigné à** : Backend dev

---

### Frontend (1 problème)

#### 4. TagInput utilise `isLoading` au lieu de `isPending` 🐛
**Fichier** : `frontend/src/components/tags/TagInput.jsx` ligne 146
**Problème** : React Query v5 utilise `isPending` pas `isLoading`
**Impact** : Le bouton "Créer un tag" ne se désactive pas pendant la soumission
**Solution** :
```javascript
// Ligne 146 : Remplacer
disabled={createMutation.isLoading}
// Par
disabled={createMutation.isPending}
```
**Temps estimé** : 5 minutes
**Assigné à** : Frontend dev

---

## ⚠️ IMPORTANTS - À CORRIGER PROCHAINEMENT (Sprint 2)

### Backend (3 problèmes)

#### 5. Regex dépréciée dans FastAPI 📢
**Fichier** : `backend/app/routers/articles.py` ligne 33
**Problème** : Utilise `regex=` au lieu de `pattern=` (dépréciée en Pydantic v2)
**Impact** : Avertissements en production
**Solution** :
```python
# Remplacer
order: str = Query("asc", regex="^(asc|desc)$", description="Ordre de tri (asc ou desc)")
# Par
order: str = Query("asc", pattern="^(asc|desc)$", description="Ordre de tri (asc ou desc)")
```
**Temps estimé** : 10 minutes
**Assigné à** : Backend dev

---

#### 6. Gestion d'erreur trop large 🛡️
**Fichier** : `backend/app/crud.py` ligne 545-550
**Problème** : `except Exception` expose détails d'erreur sensibles
**Impact** : Sécurité faible, debug difficile
**Solution** :
```python
import logging
logger = logging.getLogger(__name__)

except IntegrityError:
    db.rollback()
    raise HTTPException(status_code=400, detail="Données invalides")
except Exception as e:
    db.rollback()
    logger.error(f"Erreur création mouvement: {e}")
    raise HTTPException(status_code=500, detail="Erreur serveur")
```
**Temps estimé** : 30 minutes
**Assigné à** : Backend dev

---

#### 7. Comparaison `== None` au lieu de `.is_(None)` 🐍
**Fichier** : `backend/app/crud.py` ligne 607
**Problème** : Anti-pattern SQLAlchemy
**Impact** : Fonctionne mais déconseillé
**Solution** :
```python
# Remplacer
.filter(models.Article.categorie_id == None)
# Par
.filter(models.Article.categorie_id.is_(None))
```
**Temps estimé** : 10 minutes
**Assigné à** : Backend dev

---

### Frontend (9 problèmes)

#### 8. Redirection post-login manquante 🔄
**Fichier** : `frontend/src/components/common/ProtectedRoute.jsx` ligne 31
**Problème** : Sauvegarde `from` mais ne l'utilise jamais
**Impact** : Utilisateurs pas redirigés vers leur page initiale
**Solution** :
```javascript
// Dans Login.jsx après connexion réussie
import { useLocation, useNavigate } from 'react-router-dom'

const location = useLocation()
const from = location.state?.from?.pathname || '/dashboard'
navigate(from, { replace: true })
```
**Temps estimé** : 20 minutes
**Assigné à** : Frontend dev

---

#### 9. Erreur API non gérée dans Dashboard 🚨
**Fichier** : `frontend/src/pages/Dashboard.jsx` ligne 51-54
**Problème** : Pas de vérification de `result.error`
**Impact** : Échec silencieux de la recherche
**Solution** :
```javascript
const result = await searchRefetch()
if (result.error) {
  toast.error('Erreur lors de la recherche')
  return
}
if (result.data) {
  setSearchResults(result.data)
}
```
**Temps estimé** : 15 minutes
**Assigné à** : Frontend dev

---

#### 10. localStorage non centralisé 🗄️
**Fichier** : `frontend/src/services/api.js` + `authService.js`
**Problème** : Accès direct à localStorage en deux endroits différents
**Impact** : Risque de désynchronisation
**Solution** : Créer un service `storageService.js` :
```javascript
// storageService.js
export const getToken = () => localStorage.getItem('token')
export const setToken = (token) => localStorage.setItem('token', token)
export const removeToken = () => localStorage.removeItem('token')
```
**Temps estimé** : 30 minutes
**Assigné à** : Frontend dev

---

#### 11. Console.log() en production 🔍
**Fichier** : `frontend/src/components/articles/ArticleForm.jsx` ligne 112-113
**Problème** : Logs de debug exposent données sensibles
**Impact** : Sécurité
**Solution** :
```javascript
// Ajouter dans .env
VITE_DEBUG_MODE=false

// Dans le code
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('📤 Données envoyées:', dataToSubmit)
}
```
**Temps estimé** : 15 minutes
**Assigné à** : Frontend dev

---

#### 12. Dépendance react-hook-form inutile 📦
**Fichier** : `frontend/package.json` ligne 19
**Problème** : Installée mais jamais utilisée
**Impact** : Augmente taille du bundle (40 KB)
**Solution** :
```bash
npm uninstall react-hook-form
```
**Temps estimé** : 5 minutes
**Assigné à** : Frontend dev

---

#### 13. Boutons sans aria-label ♿
**Fichier** : `frontend/src/pages/Articles.jsx` ligne 399-404
**Problème** : Icônes seules sans texte
**Impact** : Accessibilité (lecteurs d'écran)
**Solution** :
```jsx
<button className="btn btn-sm btn-danger" aria-label="Supprimer l'article">
  <Trash2 size={14} />
</button>
```
**Temps estimé** : 1 heure (tous les boutons)
**Assigné à** : Frontend dev

---

#### 14. Modal pas fermable au clavier ⌨️
**Fichier** : `frontend/src/components/common/Modal.jsx`
**Problème** : Pas de gestion de la touche Escape
**Impact** : Accessibilité
**Solution** :
```javascript
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape') onClose()
  }
  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
}, [onClose])
```
**Temps estimé** : 15 minutes
**Assigné à** : Frontend dev

---

#### 15. Table headers pas triables au clavier ⌨️
**Fichier** : `frontend/src/pages/Articles.jsx` ligne 287-343
**Problème** : onClick seulement, pas de onKeyPress
**Impact** : Accessibilité
**Solution** :
```jsx
<th
  onClick={() => handleSort('id')}
  onKeyPress={(e) => e.key === 'Enter' && handleSort('id')}
  tabIndex={0}
  role="button"
>
```
**Temps estimé** : 30 minutes
**Assigné à** : Frontend dev

---

#### 16. MouvementForm charge trop d'articles ⚡
**Fichier** : `frontend/src/components/mouvements/MouvementForm.jsx` ligne 26
**Problème** : `limit: 500` hardcodé
**Impact** : Performance dégradée avec beaucoup d'articles
**Solution** : Implémenter un Combobox avec recherche
```javascript
// Utiliser react-select ou créer un composant custom
import Select from 'react-select'

<Select
  options={articles.map(a => ({ value: a.id, label: a.nom }))}
  onInputChange={handleSearch}
  placeholder="Rechercher un article..."
/>
```
**Temps estimé** : 2 heures
**Assigné à** : Frontend dev

---

## 💡 NICE TO HAVE - Améliorations futures (Sprint 3+)

### Backend (6 améliorations)

#### 17. Logging absent 📝
**Ajou** : Configurer logging Python avec rotation
**Temps estimé** : 1 heure

#### 18. Rate limiting absent 🚦
**Ajouter** : slowapi pour protéger contre brute force
**Temps estimé** : 2 heures

#### 19. Tests manquants 🧪
**Ajouter** : Tests unitaires avec pytest
**Temps estimé** : 8 heures

#### 20. Documentation OpenAPI incomplète 📚
**Ajouter** : Exemples de réponses d'erreur
**Temps estimé** : 2 heures

#### 21. Validation métier supplémentaire ✅
**Ajouter** : Validations business rules
**Temps estimé** : 3 heures

#### 22. Healthcheck endpoint 🏥
**Ajouter** : GET /api/health avec checks DB
**Temps estimé** : 30 minutes

---

### Frontend (25 améliorations)

#### 23-47. Voir liste complète dans ROADMAP_DETAILS.md
*Liste trop longue pour ce document, inclut :*
- Performance (useMemo, useCallback, Virtual Scrolling)
- UX (scroll automatique, debounce, états vides)
- Accessibilité (focus visible, aria-*)
- Pages manquantes (détail article, gestion catégories/tags)
- Tests unitaires

---

## 📅 Planning par sprints

### Sprint 1 (1-2 jours) - CRITIQUES 🔴
- [ ] #1 : SECRET_KEY en environnement (15 min)
- [ ] #2 : Requêtes N+1 statistiques (1h)
- [ ] #3 : Fix N+1 dans get_statistiques (automatique)
- [ ] #4 : isPending au lieu de isLoading (5 min)

**Total Sprint 1 : ~1h30**

---

### Sprint 2 (3-5 jours) - IMPORTANTS ⚠️
- [ ] #5 : regex → pattern (10 min)
- [ ] #6 : Gestion d'erreur robuste (30 min)
- [ ] #7 : .is_(None) au lieu de == None (10 min)
- [ ] #8 : Redirection post-login (20 min)
- [ ] #9 : Erreur API Dashboard (15 min)
- [ ] #10 : Centraliser localStorage (30 min)
- [ ] #11 : Console.log conditionnels (15 min)
- [ ] #12 : Supprimer react-hook-form (5 min)
- [ ] #13 : aria-label sur boutons (1h)
- [ ] #14 : Modal Escape key (15 min)
- [ ] #15 : Table tri au clavier (30 min)
- [ ] #16 : Combobox articles MouvementForm (2h)

**Total Sprint 2 : ~6h**

---

### Sprint 3+ (Continu) - NICE TO HAVE 💡
- Amélioration continue selon priorités métier
- Tests unitaires progressifs
- Pages manquantes (détail article, gestion catégories/tags)
- Optimisations performance (Virtual Scrolling, etc.)

---

## 🎯 Objectifs de qualité

| Métrique | Actuel | Objectif Sprint 1 | Objectif Sprint 2 |
|----------|--------|-------------------|-------------------|
| **Problèmes critiques** | 4 | 0 | 0 |
| **Problèmes importants** | 12 | 12 | 0 |
| **Tests unitaires** | 0% | 0% | 10% |
| **Accessibilité** | Moyenne | Moyenne | Bonne |
| **Performance** | Bonne | Excellente | Excellente |
| **Sécurité** | Bonne | Excellente | Excellente |

---

## 📊 Métriques de suivi

### Code Quality
- [ ] 0 avertissements Python
- [ ] 0 console.log en production
- [ ] 0 dépendances inutilisées
- [ ] 100% des TODOs résolus

### Performance
- [ ] Temps de chargement Dashboard < 500ms
- [ ] Temps de réponse API statistiques < 200ms
- [ ] Bundle size < 500 KB (gzip)

### Sécurité
- [ ] SECRET_KEY en environnement
- [ ] Aucune donnée sensible en logs
- [ ] CORS correctement configuré
- [ ] Headers de sécurité présents

### Accessibilité
- [ ] Tous les boutons ont aria-label
- [ ] Navigation clavier complète
- [ ] Focus visible sur tous les éléments
- [ ] Lecteurs d'écran testés

---

## 🔗 Documents liés

- **CLAUDE.md** : Guide complet du projet
- **DEMARRAGE_RAPIDE.md** : Démarrage en mode développement
- **README.md** : Vue d'ensemble
- **docs/STATUS.md** : Statut du projet

---

Dernière mise à jour : 2026-02-07
