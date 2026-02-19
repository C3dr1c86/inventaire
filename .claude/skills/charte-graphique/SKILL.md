---
name: charte-graphique
description: Affiche la charte graphique complète de l'application (couleurs, typographie, composants, conventions CSS)
disable-model-invocation: true
---

# SKILL — Charte Graphique : Application de Gestion de Stock/Inventaire
## Stack technique : React 18.2 + Vite 5 + CSS pur + variables CSS

---

## 🎯 CONTEXTE & OBJECTIF

Tu es en train de développer une application de gestion de stock/inventaire.
Tu dois appliquer une charte graphique cohérente, professionnelle et lisible.
Voici les règles strictes à suivre pour chaque composant, style, couleur et layout.

---

## 🛠️ STACK TECHNIQUE (ne jamais dévier)

| Outil | Version | Rôle |
|---|---|---|
| React | 18.2 | Framework UI principal |
| Vite | 5.0 | Build tool + HMR |
| React Query (@tanstack/react-query) | 5.17 | Cache + fetching serveur |
| Axios | 1.6 | Client HTTP |
| React Router DOM | 6.21 | Navigation SPA |
| Lucide React | 0.309 | Icônes SVG |
| React Toastify | 11.0 | Notifications toast |
| html5-qrcode | 2.3 | Scanner QR/code-barres |
| date-fns | 3.0 | Manipulation de dates |
| Vitest | 1.1 | Tests unitaires |
| React Testing Library | 14.1 | Tests composants |
| ESLint | 8.56 | Linting JS/JSX |

**CSS : CSS pur uniquement avec variables CSS (--color-*). JAMAIS de Tailwind, MUI, styled-components.**
**Breakpoints : 768px (tablette), 576px (mobile).**

---

## 🎨 1. PALETTE DE COULEURS

```css
:root {
  /* ── Couleurs primaires ── */
  --color-primary-50:  #f0f7ff;
  --color-primary-100: #d0e7ff;
  --color-primary-200: #a6d1ff;
  --color-primary-300: #79b8ff;
  --color-primary-400: #4da2ff;
  --color-primary-500: #2188ff; /* Couleur principale */
  --color-primary-600: #1a6edb;
  --color-primary-700: #1456b7;
  --color-primary-800: #0d3e93;
  --color-primary-900: #07296f;

  /* ── Couleurs d'état (stock) ── */
  --color-success:     #28a745; /* Stock suffisant  */
  --color-warning:     #ffc107; /* Stock faible     */
  --color-danger:      #dc3545; /* Rupture de stock */
  --color-info:        #17a2b8; /* Information      */

  --color-success-bg:  #d4edda;
  --color-warning-bg:  #fff3cd;
  --color-danger-bg:   #f8d7da;
  --color-info-bg:     #d1ecf1;

  /* ── Nuances de gris ── */
  --color-white:       #ffffff;
  --color-gray-50:     #f8f9fa;
  --color-gray-100:    #e9ecef;
  --color-gray-200:    #dee2e6;
  --color-gray-300:    #ced4da;
  --color-gray-400:    #adb5bd;
  --color-gray-500:    #6c757d;
  --color-gray-600:    #495057;
  --color-gray-700:    #343a40;
  --color-gray-800:    #212529;
  --color-gray-900:    #121416;
  --color-black:       #000000;

  /* ── Fonds ── */
  --color-bg-primary:   var(--color-white);
  --color-bg-secondary: var(--color-gray-50);
  --color-bg-tertiary:  var(--color-gray-100);
  --color-bg-overlay:   rgba(0, 0, 0, 0.5);

  /* ── Textes ── */
  --color-text-primary:   var(--color-gray-800);
  --color-text-secondary: var(--color-gray-500);
  --color-text-muted:     var(--color-gray-400);
  --color-text-inverse:   var(--color-white);

  /* ── Bordures ── */
  --color-border:        var(--color-gray-200);
  --color-border-focus:  var(--color-primary-500);
}
```

---

## 🌙 2. MODE SOMBRE

```css
[data-theme="dark"] {
  --color-bg-primary:   #1a1d23;
  --color-bg-secondary: #21262d;
  --color-bg-tertiary:  #2d333b;

  --color-text-primary:   #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-muted:     #6e7681;
  --color-text-inverse:   #1a1d23;

  --color-border:        #30363d;
  --color-border-focus:  var(--color-primary-400);

  --color-primary-500: #4da2ff;

  --color-success:     #3fb950;
  --color-warning:     #d29922;
  --color-danger:      #f85149;
  --color-info:        #58a6ff;

  --color-success-bg:  #1a2d1e;
  --color-warning-bg:  #2d2208;
  --color-danger-bg:   #2d1117;
  --color-info-bg:     #0d2036;
}
```

**Règles dark mode :**
- Toujours utiliser `var(--color-*)` — jamais de valeurs hardcodées comme `#fff`, `white`, `#f8f9fa`
- Le toggle est dans la sidebar (icône Lune/Soleil via Lucide React)
- Persisté dans `localStorage` via `document.documentElement.dataset.theme`

---

## 🔤 3. TYPOGRAPHIE

```css
:root {
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  --font-family-mono: 'Fira Code', 'Courier New', Courier, monospace;

  --font-size-xs:   0.75rem;  /* 12px */
  --font-size-sm:   0.875rem; /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg:   1.125rem; /* 18px */
  --font-size-xl:   1.25rem;  /* 20px */
  --font-size-2xl:  1.5rem;   /* 24px */
  --font-size-3xl:  1.875rem; /* 30px */

  --font-weight-normal:  400;
  --font-weight-medium:  500;
  --font-weight-semibold:600;
  --font-weight-bold:    700;

  --line-height-tight:  1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed:1.75;
}
```

**Règles** :
- Titres de page (`<h1>`) : `--font-size-2xl`, `--font-weight-bold`
- Titres de section (`<h2>`) : `--font-size-xl`, `--font-weight-semibold`
- Corps de texte : `--font-size-base`, `--font-weight-normal`
- Labels formulaires : `--font-size-sm`, `--font-weight-medium`
- Texte muted/secondaire : `--color-text-secondary`
- Badges/tags : `--font-size-xs`

---

## 📐 4. ESPACEMENTS & RAYONS

```css
:root {
  /* ── Espacements (multiples de 4px) ── */
  --spacing-1:  0.25rem;  /* 4px  */
  --spacing-2:  0.5rem;   /* 8px  */
  --spacing-3:  0.75rem;  /* 12px */
  --spacing-4:  1rem;     /* 16px */
  --spacing-5:  1.25rem;  /* 20px */
  --spacing-6:  1.5rem;   /* 24px */
  --spacing-8:  2rem;     /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */

  /* ── Rayons ── */
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   8px;
  --radius-xl:   12px;
  --radius-full: 9999px; /* Pilules / badges */

  /* ── Ombres ── */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.10);
}
```

---

## 🧩 5. COMPOSANTS — CONVENTIONS

### Boutons

```css
/* Primaire */
.btn-primary {
  background: var(--color-primary-500);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-2) var(--spacing-4);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}
.btn-primary:hover { background: var(--color-primary-600); }

/* Secondaire */
.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

/* Danger */
.btn-danger {
  background: var(--color-danger);
  color: var(--color-text-inverse);
}
```

**Règles boutons :**
- Touch target minimum : **44px** de hauteur (Apple HIG) sur mobile
- Toujours un état `:hover` et `:disabled`
- Icônes Lucide React avant le texte (ex : `<Plus size={16} /> Ajouter`)
- Jamais de texte tout en majuscules

### Tableaux

```css
.table { width: 100%; border-collapse: collapse; }
.table th {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 2px solid var(--color-border);
}
.table td {
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}
.table tr:hover { background: var(--color-bg-secondary); }
```

**Vue carte mobile (≤ 576px) :**
```css
@media (max-width: 576px) {
  .table thead { display: none; }
  .table-responsive { overflow-x: visible; }
  .table, .table tbody, .table tr, .table td {
    display: block;
    width: 100%;
    white-space: normal;
  }
  .table td::before {
    content: attr(data-label);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    display: block;
    margin-bottom: var(--spacing-1);
  }
}
```

**Règle** : Chaque `<td>` DOIT avoir un attribut `data-label="Nom de la colonne"`.

### Formulaires

```css
.form-group { margin-bottom: var(--spacing-4); }
.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2);
}
.form-control {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color 0.15s;
}
.form-control:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(33, 136, 255, 0.15);
}
```

### Badges / Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: 2px var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}
.badge-success { background: var(--color-success-bg); color: var(--color-success); }
.badge-warning { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-danger  { background: var(--color-danger-bg);  color: var(--color-danger);  }
.badge-info    { background: var(--color-info-bg);    color: var(--color-info);    }
```

### Cartes (cards)

```css
.card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-4);
}
```

### Modals

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050; /* Au-dessus de la bottom-nav (z-index: 1000) */
}
.modal-content {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
}
```

---

## 📱 6. RESPONSIVE — BREAKPOINTS

| Taille | Breakpoint | Comportement |
|--------|-----------|--------------|
| Desktop | > 768px | Sidebar fixe, tableaux normaux |
| Tablette | ≤ 768px | Sidebar coulissante (hamburger), scroll horizontal tableaux |
| Mobile | ≤ 576px | Bottom nav, tableaux en vue carte, formulaires pleine largeur |

**Règles responsive :**
- CSS mobile-last : styles desktop d'abord, overrides dans `@media (max-width: ...)`
- Jamais de `min-width` et `max-width` mélangés sur le même composant
- Grilles : `grid-template-columns: repeat(4, 1fr)` → `repeat(2, 1fr)` à 768px → `1fr` à 576px
- Touch targets ≥ 44px sur mobile (boutons, liens, icônes cliquables)

### Bottom Navigation (≤ 576px)

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border);
  display: flex;
  z-index: 1000;
}
```

---

## 🔔 7. NOTIFICATIONS (React Toastify)

**Configuration dans `App.jsx`** :
```jsx
<ToastContainer
  position="top-right"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnHover
/>
```

**Usage standardisé** :
```javascript
toast.success('Article créé avec succès')
toast.error('Erreur lors de la suppression')
toast.warning('Stock insuffisant')
toast.info('Synchronisation en cours...')
```

---

## ⚡ 8. ICÔNES (Lucide React)

**Tailles standardisées** :
- Dans les boutons : `size={16}`
- Dans les titres de section : `size={20}`
- Dans la navigation sidebar : `size={20}`
- Dans les cartes de stats : `size={24}`
- Illustrations vides (empty state) : `size={48}`, couleur `--color-text-muted`

**Exemples courants** :
```jsx
import { Plus, Edit2, Trash2, Search, Package, AlertTriangle } from 'lucide-react'

<Plus size={16} />        // Créer
<Edit2 size={16} />       // Modifier
<Trash2 size={16} />      // Supprimer
<Search size={16} />      // Rechercher
<Package size={48} />     // Empty state articles
<AlertTriangle size={20} /> // Alerte stock bas
```

---

## 📋 9. CONVENTIONS DE CODE JSX

- Toutes les pages utilisent `usePermissions()` pour le rendering conditionnel
- `useQuery` avec clés en tableau : `['articles']`, `['mouvements', filters]`
- `useMutation` avec `onSuccess` → `queryClient.invalidateQueries()`
- Composants réutilisables : `Modal`, `Loader`, `Pagination` depuis `components/common/`
- État de chargement : `<Loader />` centré dans la page
- État vide : empty state avec icône Lucide + message explicatif
- Erreurs : toast.error() + message dans le composant si bloquant

**Structure standard d'une page** :
```jsx
function MaPage() {
  const { canCreate, canUpdate, canDelete } = usePermissions()
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null)

  const { data, isLoading, error } = useQuery({ queryKey: ['resource'], queryFn: getAll })
  const createMutation = useMutation({ mutationFn: create, onSuccess: () => { queryClient.invalidateQueries(['resource']); toast.success('Créé') } })

  if (isLoading) return <Loader />
  if (error) return <div className="alert alert-danger">Erreur de chargement</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Titre</h1>
        {canCreate('resource') && <button className="btn-primary" onClick={() => setModal('create')}><Plus size={16} /> Ajouter</button>}
      </div>
      {/* ... tableau ... */}
      {modal && <Modal onClose={() => setModal(null)}>...</Modal>}
    </div>
  )
}
```
