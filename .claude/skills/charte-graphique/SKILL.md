---
name: charte-graphique
description: Charte graphique complète (couleurs, dark mode, typo, CSS, composants React, hooks, conventions)
---

# Skill: Charte Graphique - Application Gestion de Stock/Inventaire

## Contexte & Contraintes Techniques
Tu es un expert UI/UX spécialisé dans les applications de gestion métier. Tu travailles sur une application de gestion de stock/inventaire avec les contraintes suivantes :
- **CSS pur** avec variables CSS (--color-*) — INTERDIT : Tailwind, Material UI, styled-components
- **Breakpoints** : 768px (tablette) et 576px (mobile)
- **Framework** : React 18.2 + Vite 5.0
- **Icônes** : Lucide React 0.309 uniquement
- **Notifications** : React Toastify 11.0
- **Navigation** : React Router DOM 6.21
- **Dates** : date-fns 3.0

---

## 1. PALETTE DE COULEURS

### Variables CSS globales (fichier: src/styles/variables.css)

```css
:root {
  /* ===== COULEURS PRIMAIRES ===== */
  --color-primary-50:  #f0f7ff;
  --color-primary-100: #d0e7ff;
  --color-primary-200: #a6d1ff;
  --color-primary-300: #79b8ff;
  --color-primary-400: #4da2ff;
  --color-primary-500: #2188ff;
  --color-primary-600: #1a6edb;
  --color-primary-700: #1456b7;
  --color-primary-800: #0d3e93;
  --color-primary-900: #07296f;

  /* ===== COULEURS D'ÉTAT (Stock) ===== */
  --color-success:       #28a745; /* Stock OK        */
  --color-success-light: #d4edda;
  --color-success-dark:  #1e7e34;

  --color-warning:       #ffc107; /* Stock faible    */
  --color-warning-light: #fff3cd;
  --color-warning-dark:  #d39e00;

  --color-danger:        #dc3545; /* Rupture stock   */
  --color-danger-light:  #f8d7da;
  --color-danger-dark:   #bd2130;

  --color-info:          #17a2b8; /* Information     */
  --color-info-light:    #d1ecf1;
  --color-info-dark:     #117a8b;

  /* ===== NEUTRES ===== */
  --color-white:    #ffffff;
  --color-gray-50:  #f8f9fa;
  --color-gray-100: #e9ecef;
  --color-gray-200: #dee2e6;
  --color-gray-300: #ced4da;
  --color-gray-400: #adb5bd;
  --color-gray-500: #6c757d;
  --color-gray-600: #495057;
  --color-gray-700: #343a40;
  --color-gray-800: #212529;
  --color-gray-900: #121416;
  --color-black:    #000000;

  /* ===== FONDS ===== */
  --color-bg-app:       #f0f2f5;
  --color-bg-card:      #ffffff;
  --color-bg-sidebar:   #1a2332;
  --color-bg-header:    #ffffff;
  --color-bg-overlay:   rgba(0, 0, 0, 0.5);

  /* ===== TEXTES ===== */
  --color-text-primary:   #212529;
  --color-text-secondary: #6c757d;
  --color-text-muted:     #adb5bd;
  --color-text-inverse:   #ffffff;
  --color-text-link:      #2188ff;

  /* ===== BORDURES ===== */
  --color-border:        #dee2e6;
  --color-border-focus:  #2188ff;
  --color-border-error:  #dc3545;

  /* ===== SIDEBAR ===== */
  --color-sidebar-bg:          #1a2332;
  --color-sidebar-text:        #a8b2c1;
  --color-sidebar-text-active: #ffffff;
  --color-sidebar-item-hover:  rgba(255,255,255,0.08);
  --color-sidebar-item-active: rgba(33,136,255,0.2);
  --color-sidebar-border:      rgba(255,255,255,0.1);

  /* ===== TYPOGRAPHIE ===== */
  --font-family-base: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

  --font-size-xs:   0.75rem;   /* 12px */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg:   1.125rem;  /* 18px */
  --font-size-xl:   1.25rem;   /* 20px */
  --font-size-2xl:  1.5rem;    /* 24px */
  --font-size-3xl:  1.875rem;  /* 30px */
  --font-size-4xl:  2.25rem;   /* 36px */

  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  --line-height-tight:  1.25;
  --line-height-normal: 1.5;
  --line-height-loose:  1.75;

  /* ===== ESPACEMENTS ===== */
  --space-1:  0.25rem;  /* 4px  */
  --space-2:  0.5rem;   /* 8px  */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */

  /* ===== LAYOUT ===== */
  --sidebar-width:          260px;
  --sidebar-width-collapsed: 64px;
  --header-height:           64px;
  --content-max-width:       1400px;
  --content-padding:         var(--space-6);

  /* ===== BORDURES & ARRONDIS ===== */
  --radius-sm:   4px;
  --radius-base: 8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  /* ===== OMBRES ===== */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);

  /* ===== TRANSITIONS ===== */
  --transition-fast:   150ms ease;
  --transition-base:   250ms ease;
  --transition-slow:   400ms ease;

  /* ===== Z-INDEX ===== */
  --z-dropdown: 100;
  --z-sticky:   200;
  --z-overlay:  300;
  --z-modal:    400;
  --z-toast:    500;
}

2. RESET & BASE (fichier: src/styles/base.css)
/* ===== RESET ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-bg-app);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img, svg { display: block; max-width: 100%; }
button { cursor: pointer; font-family: inherit; }
input, select, textarea { font-family: inherit; }
a { color: var(--color-text-link); text-decoration: none; }
a:hover { text-decoration: underline; }
ul, ol { list-style: none; }

/* ===== FOCUS VISIBLE (accessibilité) ===== */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* ===== SCROLLBAR ===== */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-gray-100); }
::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb:hover { background: var(--color-gray-400); }

/* ===== TYPOGRAPHIE ===== */
h1 { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold);   line-height: var(--line-height-tight); }
h2 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold);   line-height: var(--line-height-tight); }
h3 { font-size: var(--font-size-xl);  font-weight: var(--font-weight-semibold); }
h4 { font-size: var(--font-size-lg);  font-weight: var(--font-weight-semibold); }
h5 { font-size: var(--font-size-base); font-weight: var(--font-weight-medium); }
h6 { font-size: var(--font-size-sm);  font-weight: var(--font-weight-medium); }

p { margin-bottom: var(--space-4); }
p:last-child { margin-bottom: 0; }

/* ===== UTILITAIRES ===== */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
.text-center  { text-align: center; }
.text-right   { text-align: right; }
.text-muted   { color: var(--color-text-secondary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning-dark); }
.text-danger  { color: var(--color-danger); }
.text-info    { color: var(--color-info); }
.fw-medium    { font-weight: var(--font-weight-medium); }
.fw-semibold  { font-weight: var(--font-weight-semibold); }
.fw-bold      { font-weight: var(--font-weight-bold); }
.d-flex       { display: flex; }
.align-center { align-items: center; }
.gap-2        { gap: var(--space-2); }
.gap-4        { gap: var(--space-4); }
.mt-4         { margin-top: var(--space-4); }
.mb-4         { margin-bottom: var(--space-4); }

3. LAYOUT (fichier: src/styles/layout.css)
/* ===== APP SHELL ===== */
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* ===== SIDEBAR ===== */
.sidebar {
  width: var(--sidebar-width);
  min-height: 100vh;
  background-color: var(--color-sidebar-bg);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-sticky);
  transition: width var(--transition-base);
  overflow: hidden;
}

.sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4);
  height: var(--header-height);
  border-bottom: 1px solid var(--color-sidebar-border);
  color: var(--color-text-inverse);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}

.sidebar-logo svg {
  flex-shrink: 0;
  color: var(--color-primary-400);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-4) 0;
  overflow-y: auto;
}

.sidebar-section-label {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-sidebar-text);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: var(--space-4);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--color-sidebar-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: 0;
  transition: background-color var(--transition-fast), color var(--transition-fast);
  white-space: nowrap;
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
}

.sidebar-item:hover {
  background-color: var(--color-sidebar-item-hover);
  color: var(--color-sidebar-text-active);
  text-decoration: none;
}

.sidebar-item.active {
  background-color: var(--color-sidebar-item-active);
  color: var(--color-sidebar-text-active);
  border-right: 3px solid var(--color-primary-500);
}

.sidebar-item svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.sidebar-item-badge {
  margin-left: auto;
  background-color: var(--color-danger);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}

/* ===== MAIN ===== */
.main-wrapper {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left var(--transition-base);
}

.main-wrapper.sidebar-collapsed {
  margin-left: var(--sidebar-width-collapsed);
}

/* ===== HEADER ===== */
.header {
  height: var(--header-height);
  background-color: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--content-padding);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-xs);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* ===== PAGE CONTENT ===== */
.page-content {
  flex: 1;
  padding: var(--content-padding);
  max-width: var(--content-max-width);
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

/* ===== GRID ===== */
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform var(--transition-base);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .main-wrapper {
    margin-left: 0;
  }

  .page-content {
    padding: var(--space-4);
  }

  .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-2 { grid-template-columns: 1fr; }
}

@media (max-width: 576px) {
  .header { padding: 0 var(--space-4); }
  .page-content { padding: var(--space-3); }
  .grid-cols-4,
  .grid-cols-3,
  .grid-cols-2 { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; }
}

4. COMPOSANTS (fichier: src/styles/components.css)
/* ===========================
   BOUTONS
=========================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: inherit;
  line-height: 1.5;
  border-radius: var(--radius-base);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
}

.btn:active { transform: translateY(1px); }
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

/* Variantes */
.btn-primary {
  background-color: var(--color-primary-500);
  color: var(--color-white);
}
.btn-primary:hover {
  background-color: var(--color-primary-600);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--color-white);
  color: var(--color-gray-700);
  border-color: var(--color-border);
}
.btn-secondary:hover {
  background-color: var(--color-gray-50);
  border-color: var(--color-gray-400);
}

.btn-success {
  background-color: var(--color-success);
  color: var(--color-white);
}
.btn-success:hover { background-color: var(--color-success-dark); }

.btn-danger {
  background-color: var(--color-danger);
  color: var(--color-white);
}
.btn-danger:hover { background-color: var(--color-danger-dark); }

.btn-warning {
  background-color: var(--color-warning);
  color: var(--color-gray-800);
}
.btn-warning:hover { background-color: var(--color-warning-dark); }

.btn-ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}
.btn-ghost:hover {
  background-color: var(--color-gray-100);
  color: var(--color-text-primary);
}

/* Tailles */
.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
}
.btn-lg {
  padding: var(--space-3) var(--space-8);
  font-size: var(--font-size-base);
}
.btn-icon {
  padding: var(--space-2);
  width: 36px;
  height: 36px;
}
.btn-icon.btn-sm { width: 28px; height: 28px; padding: var(--space-1); }

/* Loading spinner */
.btn.loading {
  pointer-events: none;
  opacity: 0.8;
}
.btn.loading::before {
  content: '';
  width: 14px; height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ===========================
   CARDS
=========================== */
.card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
}

/* KPI Cards (Stat Cards) */
.stat-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5) var(--space-6);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.stat-card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card-icon.primary { background-color: var(--color-primary-50); color: var(--color-primary-600); }
.stat-card-icon.success { background-color: var(--color-success-light); color: var(--color-success-dark); }
.stat-card-icon.warning { background-color: var(--color-warning-light); color: var(--color-warning-dark); }
.stat-card-icon.danger  { background-color: var(--color-danger-light);  color: var(--color-danger-dark); }
.stat-card-icon.info    { background-color: var(--color-info-light);    color: var(--color-info-dark); }

.stat-card-body { flex: 1; min-width: 0; }

.stat-card-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-1);
}

.stat-card-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
  margin-bottom: var(--space-2);
}

.stat-card-trend {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.stat-card-trend.up   { color: var(--color-success); }
.stat-card-trend.down { color: var(--color-danger); }
.stat-card-trend.neutral { color: var(--color-text-secondary); }

/* ===========================
   BADGES & STATUS
=========================== */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.badge-success { background-color: var(--color-success-light); color: var(--color-success-dark); }
.badge-warning { background-color: var(--color-warning-light); color: var(--color-warning-dark); }
.badge-danger  { background-color: var(--color-danger-light);  color: var(--color-danger-dark); }
.badge-info    { background-color: var(--color-info-light);    color: var(--color-info-dark); }
.badge-primary { background-color: var(--color-primary-100);   color: var(--color-primary-700); }
.badge-neutral { background-color: var(--color-gray-100);      color: var(--color-gray-600); }

/* Dot indicateur */
.badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  flex-shrink: 0;
}

/* ===========================
   TABLEAUX
=========================== */
.table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-card);
}

.table thead {
  background-color: var(--color-gray-50);
  border-bottom: 2px solid var(--color-border);
}

.table th {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.table td {
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.table tbody tr:last-child td { border-bottom: none; }

.table tbody tr {
  transition: background-color var(--transition-fast);
}

.table tbody tr:hover {
  background-color: var(--color-primary-50);
}

.table th.sortable {
  cursor: pointer;
  user-select: none;
}
.table th.sortable:hover { color: var(--color-text-primary); }

/* Colonne numérique */
.table td.numeric,
.table th.numeric { text-align: right; font-variant-numeric: tabular-nums; }

/* Stock level colors */
.table td.stock-ok      { color: var(--color-success-dark); font-weight: var(--font-weight-semibold); }
.table td.stock-low     { color: var(--color-warning-dark); font-weight: var(--font-weight-semibold); }
.table td.stock-empty   { color: var(--color-danger);       font-weight: var(--font-weight-bold); }

/* ===========================
   FORMULAIRES
=========================== */
.form-group {
  margin-bottom: var(--space-5);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.form-label.required::after {
  content: ' *';
  color: var(--color-danger);
}

.form-control {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  font-family: inherit;
  color: var(--color-text-primary);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  line-height: 1.5;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  -webkit-appearance: none;
  appearance: none;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(33,136,255,0.15);
}

.form-control::placeholder {
  color: var(--color-text-muted);
}

.form-control:disabled {
  background-color: var(--color-gray-100);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.form-control.is-invalid {
  border-color: var(--color-border-error);
}
.form-control.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(220,53,69,0.15);
}

.form-hint {
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.form-error {
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* Input avec icône */
.input-wrapper {
  position: relative;
}

.input-wrapper .input-icon-left {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.input-wrapper .input-icon-right {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}

.input-wrapper.has-icon-left  .form-control { padding-left: 2.5rem; }
.input-wrapper.has-icon-right .form-control { padding-right: 2.5rem; }

/* Select */
.form-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  padding-right: 2.5rem;
  cursor: pointer;
}

/* Checkbox & Radio */
.form-check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.form-check-input {
  width: 16px; height: 16px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--color-primary-500);
}

/* Range (quantité stock) */
.form-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  outline: none;
}

.form-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px;
  background: var(--color-primary-500);
  border-radius: 50%;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.form-range::-webkit-slider-thumb:hover {
  background: var(--color-primary-600);
}

/* ===========================
   SEARCH BAR
=========================== */
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-input-wrapper svg {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3) var(--space-2) 2.5rem;
  font-size: var(--font-size-sm);
  font-family: inherit;
  color: var(--color-text-primary);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(33,136,255,0.15);
}

/* ===========================
   MODALS
=========================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  animation: fadeIn 0.2s ease;
}

.modal {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
}

.modal-sm { max-width: 400px; }
.modal-lg { max-width: 760px; }
.modal-xl { max-width: 1000px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  flex-shrink: 0;
}

/* ===========================
   ALERTS
=========================== */
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border: 1px solid transparent;
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
}

.alert svg { flex-shrink: 0; margin-top: 1px; }

.alert-success {
  background-color: var(--color-success-light);
  border-color: var(--color-success);
  color: var(--color-success-dark);
}
.alert-warning {
  background-color: var(--color-warning-light);
  border-color: var(--color-warning);
  color: var(--color-warning-dark);
}
.alert-danger {
  background-color: var(--color-danger-light);
  border-color: var(--color-danger);
  color: var(--color-danger-dark);
}
.alert-info {
  background-color: var(--color-info-light);
  border-color: var(--color-info);
  color: var(--color-info-dark);
}

/* ===========================
   PAGINATION
=========================== */
.pagination {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 var(--space-2);
  font-size: var(--font-size-sm);
  font-family: inherit;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background-color: var(--color-white);
  color: var(--color-text-primary);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--color-gray-100);
  border-color: var(--color-gray-400);
}

.pagination-btn.active {
  background-color: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: var(--color-white);
  font-weight: var(--font-weight-semibold);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ===========================
   PROGRESS BAR (Stock level)
=========================== */
.progress {
  height: 8px;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

.progress-bar.high   { background-color: var(--color-success); }
.progress-bar.medium { background-color: var(--color-warning); }
.progress-bar.low    { background-color: var(--color-danger); }

/* ===========================
   DROPDOWN
=========================== */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  min-width: 180px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  overflow: hidden;
  animation: fadeIn 0.15s ease;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.dropdown-item:hover { background-color: var(--color-gray-100); }
.dropdown-item.danger { color: var(--color-danger); }
.dropdown-item.danger:hover { background-color: var(--color-danger-light); }

.dropdown-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--space-1) 0;
}

/* ===========================
   LOADING STATES
=========================== */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 25%,
    var(--color-gray-200) 50%,
    var(--color-gray-100) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-base);
  animation: shimmer 1.5s infinite;
}

.skeleton-text {
  height: 14px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-sm);
}

.skeleton-title {
  height: 24px;
  width: 60%;
  margin-bottom: var(--space-4);
  border-radius: var(--radius-sm);
}

.spinner {
  width: 24px; height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary-500);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.spinner-sm { width: 16px; height: 16px; border-width: 2px; }
.spinner-lg { width: 40px; height: 40px; border-width: 4px; }

.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 300px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* ===========================
   EMPTY STATE
=========================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8);
  text-align: center;
  color: var(--color-text-secondary);
}

.empty-state-icon {
  width: 64px; height: 64px;
  color: var(--color-gray-300);
  margin-bottom: var(--space-4);
}

.empty-state-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-6);
  max-width: 360px;
}

/* ===========================
   TOAST (React Toastify override)
=========================== */
:root {
  --toastify-color-success: var(--color-success);
  --toastify-color-warning: var(--color-warning);
  --toastify-color-error: var(--color-danger);
  --toastify-color-info: var(--color-info);
  --toastify-font-family: var(--font-family-base);
  --toastify-z-index: var(--z-toast);
  --toastify-border-radius: var(--radius-base);
}

/* ===========================
   ANIMATIONS
=========================== */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ===========================
   RESPONSIVE COMPOSANTS
=========================== */
@media (max-width: 768px) {
  .modal { max-width: 100%; margin: var(--space-4); border-radius: var(--radius-md); }
  .table th, .table td { padding: var(--space-2) var(--space-3); }
  .card-body { padding: var(--space-4); }
  .card-header { padding: var(--space-3) var(--space-4); }
  .stat-card { padding: var(--space-4); }
  .stat-card-value { font-size: var(--font-size-2xl); }
}

@media (max-width: 576px) {
  .search-bar { flex-direction: column; align-items: stretch; }
  .search-input-wrapper { min-width: unset; }
  .pagination { justify-content: center; }
  .modal-footer { flex-direction: column-reverse; }
  .modal-footer .btn { width: 100%; justify-content: center; }
}

5. MAIN ENTRY POINT (fichier: src/main.jsx)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import App from './App.jsx'

// Import des styles dans l'ordre correct
import './styles/variables.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)

6. RÈGLES DE COHÉRENCE GRAPHIQUE
Principes fondamentaux

Toujours utiliser les variables CSS — jamais de valeurs codées en dur
Hiérarchie visuelle : titre page > titre section > label > texte corps > texte secondaire
Couleurs d'état stock :
≥ seuil OK : --color-success + .badge-success
entre 0 et seuil : --color-warning + .badge-warning
= 0 : --color-danger + .badge-danger


Espacement : toujours un multiple de --space-*
Aucun margin/padding inline : tout dans les classes CSS

Conventions de nommage CSS
.composant {}              /* Bloc principal */
.composant-element {}      /* Élément enfant */
.composant-element--etat {}  /* Modificateur d'état */
.composant.variante {}     /* Variante du composant */
Structure de fichiers styles
src/styles/
├── variables.css     ← tokens design (couleurs, typo, espacements)
├── base.css          ← reset + typographie + utilitaires
├── layout.css        ← sidebar + header + grilles + responsive
└── components.css    ← tous les composants réutilisables
Bonnes pratiques d'accessibilité

Ratio de contraste minimum 4.5:1 pour le texte
Focus visible sur tous les éléments interactifs
Attributs aria-label sur les boutons icônes
role="alert" sur les messages d'erreur de formulaire
Ne jamais utiliser la couleur seule pour transmettre l'information


7. EXEMPLE DE PAGE DASHBOARD
// src/pages/Dashboard.jsx
import { Package, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react'

const Dashboard = () => {
  const stats = [
    {
      label: 'Total Produits',
      value: '1 248',
      icon: Package,
      variant: 'primary',
      trend: '+12 ce mois',
      trendDir: 'up',
    },
    {
      label: 'Stock Faible',
      value: '23',
      icon: AlertTriangle,
      variant: 'warning',
      trend: '3 de plus qu\'hier',
      trendDir: 'down',
    },
    {
      label: 'Ruptures',
      value: '5',
      icon: ShoppingCart,
      variant: 'danger',
      trend: '-2 depuis hier',
      trendDir: 'up',
    },
    {
      label: 'Mouvements (30j)',
      value: '342',
      icon: TrendingUp,
      variant: 'success',
      trend: '+8% vs mois préc.',
      trendDir: 'up',
    },
  ]

  const lowStockItems = [
    { id: 1, name: 'Souris sans fil Logitech', sku: 'ACC-001', qty: 3,  threshold: 10, category: 'Accessoires' },
    { id: 2, name: 'Câble HDMI 2m',            sku: 'CAB-042', qty: 7,  threshold: 15, category: 'Câblage' },
    { id: 3, name: 'Clavier mécanique RGB',    sku: 'ACC-018', qty: 0,  threshold: 5,  category: 'Accessoires' },
    { id: 4, name: 'Hub USB-C 7 ports',        sku: 'ACC-033', qty: 2,  threshold: 8,  category: 'Accessoires' },
  ]

  const getStockStatus = (qty, threshold) => {
    if (qty === 0) return { label: 'Rupture',     cls: 'badge-danger',  cellCls: 'stock-empty' }
    if (qty < threshold) return { label: 'Faible', cls: 'badge-warning', cellCls: 'stock-low' }
    return { label: 'OK',                          cls: 'badge-success', cellCls: 'stock-ok' }
  }

  return (
    <div className="page-content">
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble de votre inventaire</p>
        </div>
        <button className="btn btn-primary">
          <Package size={16} />
          Ajouter un produit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-6)' }}>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="stat-card">
              <div className={`stat-card-icon ${stat.variant}`}>
                <Icon size={22} />
              </div>
              <div className="stat-card-body">
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value">{stat.value}</div>
                <div className={`stat-card-trend ${stat.trendDir}`}>
                  {stat.trend}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table stock faible */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Produits en alerte de stock</h2>
          <button className="btn btn-secondary btn-sm">Voir tout</button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>SKU</th>
                <th>Catégorie</th>
                <th className="numeric">Quantité</th>
                <th className="numeric">Seuil alerte</th>
                <th>Niveau</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => {
                const status = getStockStatus(item.qty, item.threshold)
                const pct = Math.min(100, Math.round((item.qty / item.threshold) * 100))
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{item.name}</td>
                    <td>
                      <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {item.sku}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{item.category}</span>
                    </td>
                    <td className={`numeric ${status.cellCls}`}>{item.qty}</td>
                    <td className="numeric" style={{ color: 'var(--color-text-secondary)' }}>{item.threshold}</td>
                    <td style={{ minWidth: '120px' }}>
                      <div className="progress">
                        <div
                          className={`progress-bar ${pct >= 70 ? 'high' : pct >= 30 ? 'medium' : 'low'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm" aria-label="Options">
                        ···
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

Règles d'application de ce skill

Toujours générer les 4 fichiers CSS dans l'ordre : variables → base → layout → components
Ne jamais suggérer Tailwind, Bootstrap, MUI ou styled-components
Toujours vérifier que les breakpoints utilisés sont 768px et 576px uniquement
Toujours utiliser Lucide React pour les icônes, jamais d'autres librairies d'icônes
Nommer les classes en BEM simplifié : .composant, .composant-element, .composant.variante
Tester mentalement chaque composant sur mobile 375px, tablette 768px, desktop 1280px
Proposer automatiquement les états vides, de chargement et d'erreur pour chaque liste/tableau

Voici la suite du fichier skill, avec les composants React complets :
---

## 8. COMPOSANTS REACT RÉUTILISABLES

### 8.1 Button (src/components/ui/Button.jsx)

```jsx
import { forwardRef } from 'react'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'base',
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  const classes = [
    'btn',
    `btn-${variant}`,
    sizeClass,
    loading ? 'loading' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {Icon && iconPosition === 'left' && !loading && (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} aria-hidden="true" />
      )}
      {children}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} aria-hidden="true" />
      )}
    </button>
  )
})

Button.displayName = 'Button'
export default Button

8.2 Badge (src/components/ui/Badge.jsx)
const VARIANTS = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  info:    'badge-info',
  primary: 'badge-primary',
  neutral: 'badge-neutral',
}

const Badge = ({ children, variant = 'neutral', className = '' }) => {
  return (
    <span className={`badge ${VARIANTS[variant] ?? VARIANTS.neutral} ${className}`}>
      {children}
    </span>
  )
}

export default Badge

8.3 Card (src/components/ui/Card.jsx)
const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>{children}</div>
)

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>{children}</div>
)

const CardTitle = ({ children, className = '', as: Tag = 'h2', ...props }) => (
  <Tag className={`card-title ${className}`} {...props}>{children}</Tag>
)

const CardBody = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>{children}</div>
)

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} {...props}>{children}</div>
)

Card.Header = CardHeader
Card.Title  = CardTitle
Card.Body   = CardBody
Card.Footer = CardFooter

export default Card

8.4 StatCard (src/components/ui/StatCard.jsx)
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const StatCard = ({
  label,
  value,
  icon: Icon,
  variant = 'primary',
  trend,
  trendDir = 'neutral',
  trendLabel,
  loading = false,
}) => {
  const TrendIcon =
    trendDir === 'up' ? TrendingUp :
    trendDir === 'down' ? TrendingDown :
    Minus

  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-base)', flexShrink: 0 }} />
        <div className="stat-card-body">
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="stat-card">
      {Icon && (
        <div className={`stat-card-icon ${variant}`} aria-hidden="true">
          <Icon size={22} />
        </div>
      )}
      <div className="stat-card-body">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {(trend || trendLabel) && (
          <div className={`stat-card-trend ${trendDir}`}>
            <TrendIcon size={12} aria-hidden="true" />
            <span>{trendLabel ?? trend}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard

8.5 StockBadge (src/components/stock/StockBadge.jsx)
import Badge from '../ui/Badge'

/**
 * Affiche le statut du stock en fonction de la quantité et du seuil d'alerte
 * @param {number} quantity  - Quantité actuelle
 * @param {number} threshold - Seuil d'alerte minimum
 */
const StockBadge = ({ quantity, threshold }) => {
  if (quantity === 0) {
    return <Badge variant="danger">Rupture</Badge>
  }
  if (quantity <= threshold) {
    return <Badge variant="warning">Stock faible</Badge>
  }
  return <Badge variant="success">En stock</Badge>
}

export default StockBadge

8.6 StockProgressBar (src/components/stock/StockProgressBar.jsx)
/**
 * Barre de progression représentant le niveau de stock
 * @param {number} quantity  - Quantité actuelle
 * @param {number} threshold - Seuil d'alerte
 * @param {number} max       - Capacité maximale du stock
 */
const StockProgressBar = ({ quantity, threshold, max }) => {
  const pct = max > 0 ? Math.min(100, Math.round((quantity / max) * 100)) : 0
  const level =
    quantity === 0 ? 'low' :
    quantity <= threshold ? 'medium' :
    'high'

  const label =
    quantity === 0 ? 'Rupture de stock' :
    quantity <= threshold ? `Stock faible : ${quantity}/${max}` :
    `Stock OK : ${quantity}/${max}`

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={quantity}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      title={label}
    >
      <div
        className={`progress-bar ${level}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default StockProgressBar

8.7 DataTable (src/components/ui/DataTable.jsx)
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import EmptyState from './EmptyState'
import Spinner from './Spinner'

/**
 * Tableau de données générique et réutilisable
 *
 * @param {Array}   columns         - Définition des colonnes
 * @param {Array}   data            - Données à afficher
 * @param {boolean} loading         - État de chargement
 * @param {string}  emptyMessage    - Message si aucune donnée
 * @param {string}  sortKey         - Clé de tri actuelle
 * @param {string}  sortDir         - Direction de tri : 'asc' | 'desc'
 * @param {func}    onSort          - Callback de tri (key) => void
 * @param {func}    onRowClick      - Callback clic sur ligne (row) => void
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'Aucun résultat trouvé.',
  emptyIcon,
  sortKey,
  sortDir = 'asc',
  onSort,
  onRowClick,
  className = '',
}) => {
  const handleSort = (col) => {
    if (!col.sortable || !onSort) return
    onSort(col.key)
  }

  const getSortIcon = (col) => {
    if (!col.sortable) return null
    if (sortKey !== col.key) return <ChevronsUpDown size={14} aria-hidden="true" />
    return sortDir === 'asc'
      ? <ChevronUp size={14} aria-hidden="true" />
      : <ChevronDown size={14} aria-hidden="true" />
  }

  if (loading) {
    return (
      <div className="table-wrapper">
        <table className={`table ${className}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <div
                      className="skeleton skeleton-text"
                      style={{ width: col.skeletonWidth ?? '80%' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="table-wrapper">
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className={`table ${className}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  col.numeric ? 'numeric' : '',
                  col.sortable ? 'sortable' : '',
                  sortKey === col.key ? 'sorted' : '',
                ].filter(Boolean).join(' ')}
                style={{ width: col.width }}
                onClick={() => handleSort(col)}
                aria-sort={
                  sortKey === col.key
                    ? sortDir === 'asc' ? 'ascending' : 'descending'
                    : col.sortable ? 'none' : undefined
                }
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  {col.label}
                  {getSortIcon(col)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id ?? rowIndex}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.numeric ? 'numeric' : ''}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable

8.8 SearchBar (src/components/ui/SearchBar.jsx)
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useRef } from 'react'

const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Rechercher...',
  onClear,
  onFilter,
  filterCount = 0,
  className = '',
}) => {
  const inputRef = useRef(null)

  const handleClear = () => {
    onChange('')
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-input-wrapper">
        <Search size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        {value && (
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleClear}
            aria-label="Effacer la recherche"
            style={{
              position: 'absolute',
              right: 'var(--space-2)',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {onFilter && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onFilter}
          aria-label={`Filtres${filterCount > 0 ? ` (${filterCount} actifs)` : ''}`}
        >
          <SlidersHorizontal size={16} />
          Filtres
          {filterCount > 0 && (
            <span
              className="badge badge-primary"
              style={{ marginLeft: 'var(--space-1)' }}
            >
              {filterCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

export default SearchBar

8.9 Pagination (src/components/ui/Pagination.jsx)
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * @param {number} currentPage  - Page actuelle (1-based)
 * @param {number} totalPages   - Nombre total de pages
 * @param {number} totalItems   - Nombre total d'éléments
 * @param {number} pageSize     - Nombre d'éléments par page
 * @param {func}   onPageChange - Callback (page: number) => void
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    const delta = 2

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i)
      } else if (
        i === currentPage - delta - 1 ||
        i === currentPage + delta + 1
      ) {
        pages.push('...')
      }
    }

    return pages
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem   = Math.min(currentPage * pageSize, totalItems)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-4)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {startItem}–{endItem} sur {totalItems} résultats
      </span>

      <nav className="pagination" aria-label="Pagination">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, i) =>
          page === '...' ? (
            <span
              key={`ellipsis-${i}`}
              style={{
                padding: '0 var(--space-2)',
                color: 'var(--color-text-muted)',
                userSelect: 'none',
              }}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  )
}

export default Pagination

8.10 Modal (src/components/ui/Modal.jsx)
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Modal accessible avec focus trap et fermeture via Escape
 * @param {boolean} isOpen     - Afficher/masquer la modal
 * @param {func}    onClose    - Callback de fermeture
 * @param {string}  title      - Titre de la modal
 * @param {string}  size       - 'sm' | 'base' | 'lg' | 'xl'
 * @param {node}    footer     - Contenu du footer (boutons)
 * @param {boolean} closeOnOverlay - Fermer en cliquant sur l'overlay
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'base',
  footer,
  closeOnOverlay = true,
}) => {
  const modalRef = useRef(null)
  const previousFocus = useRef(null)

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement
      modalRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      previousFocus.current?.focus()
    }

    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClass =
    size === 'sm' ? 'modal-sm' :
    size === 'lg' ? 'modal-lg' :
    size === 'xl' ? 'modal-xl' : ''

  return (
    <div
      className="modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`modal ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">{title}</h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && (
          <div className="modal-footer">{footer}</div>
        )}
      </div>
    </div>
  )
}

export default Modal

8.11 FormField (src/components/ui/FormField.jsx)
import { AlertCircle } from 'lucide-react'
import { useId } from 'react'

/**
 * Champ de formulaire générique avec label, erreur et helper text
 */
const FormField = ({
  label,
  required = false,
  error,
  helperText,
  children,
  className = '',
}) => {
  const id = useId()

  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
          {required && (
            <span aria-hidden="true" style={{ color: 'var(--color-danger)', marginLeft: 2 }}>
              *
            </span>
          )}
        </label>
      )}

      {/* Cloner l'enfant pour passer l'id et aria */}
      {children &&
        typeof children === 'object' &&
        'props' in children
          ? { ...children, props: { ...children.props, id, 'aria-describedby': error ? `${id}-error` : helperText ? `${id}-helper` : undefined } }
          : children
      }

      {error && (
        <div
          className="form-error"
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
        >
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </div>
      )}

      {helperText && !error && (
        <div
          className="form-helper"
          id={`${id}-helper`}
        >
          {helperText}
        </div>
      )}
    </div>
  )
}

export default FormField

8.12 EmptyState (src/components/ui/EmptyState.jsx)
import { PackageOpen } from 'lucide-react'

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'Aucun résultat',
  message = 'Aucun élément à afficher pour le moment.',
  action,
}) => (
  <div className="empty-state" role="status">
    <Icon className="empty-state-icon" aria-hidden="true" />
    <h3 className="empty-state-title">{title}</h3>
    <p className="empty-state-description">{message}</p>
    {action && action}
  </div>
)

export default EmptyState

8.13 Spinner (src/components/ui/Spinner.jsx)
const Spinner = ({ size = 'base', label = 'Chargement en cours...' }) => {
  const sizeClass =
    size === 'sm' ? 'spinner-sm' :
    size === 'lg' ? 'spinner-lg' : ''

  return (
    <span
      className={`spinner ${sizeClass}`}
      role="status"
      aria-label={label}
    />
  )
}

export const LoadingPage = ({ message = 'Chargement...' }) => (
  <div className="loading-page">
    <Spinner size="lg" />
    <span>{message}</span>
  </div>
)

export default Spinner

8.14 ConfirmDialog (src/components/ui/ConfirmDialog.jsx)
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

/**
 * Dialog de confirmation pour les actions destructives
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer l\'action',
  message = 'Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-4)',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-base)',
          background: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <AlertTriangle size={20} />
      </div>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingTop: 'var(--space-2)' }}>
        {message}
      </p>
    </div>
  </Modal>
)

export default ConfirmDialog

9. HOOKS UTILITAIRES
9.1 useDebounce (src/hooks/useDebounce.js)
import { useState, useEffect } from 'react'

/**
 * Retarde la mise à jour d'une valeur (utile pour la recherche)
 * @param {any}    value - Valeur à debouncer
 * @param {number} delay - Délai en ms (défaut: 300)
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce

9.2 usePagination (src/hooks/usePagination.js)
import { useState, useMemo } from 'react'

/**
 * Gestion de la pagination côté client
 * @param {Array}  data     - Tableau de données complet
 * @param {number} pageSize - Nombre d'éléments par page
 */
const usePagination = (data = [], pageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, currentPage, pageSize])

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // Reset page si les données changent
  const resetPage = () => setCurrentPage(1)

  return {
    currentPage,
    totalPages,
    totalItems: data.length,
    pageSize,
    paginatedData,
    goToPage,
    resetPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}

export default usePagination

9.3 useSort (src/hooks/useSort.js)
import { useState, useMemo } from 'react'

/**
 * Tri d'un tableau par colonne
 * @param {Array}  data       - Données à trier
 * @param {string} defaultKey - Clé de tri par défaut
 * @param {string} defaultDir - Direction par défaut : 'asc' | 'desc'
 */
const useSort = (data = [], defaultKey = null, defaultDir = 'asc') => {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  const sortedData = useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]

      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      const comparison =
        typeof valA === 'string'
          ? valA.localeCompare(valB, 'fr', { sensitivity: 'base' })
          : valA - valB

      return sortDir === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return { sortedData, sortKey, sortDir, handleSort }
}

export default useSort

9.4 useLocalStorage (src/hooks/useLocalStorage.js)
import { useState } from 'react'

/**
 * State persisté dans le localStorage
 * @param {string} key          - Clé de stockage
 * @param {any}    initialValue - Valeur par défaut
 */
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const val = value instanceof Function ? value(storedValue) : value
      setStoredValue(val)
      window.localStorage.setItem(key, JSON.stringify(val))
    } catch (error) {
      console.warn(`useLocalStorage: impossible de sauvegarder "${key}"`, error)
    }
  }

  const removeValue = () => {
    try {
      setStoredValue(initialValue)
      window.localStorage.removeItem(key)
    } catch {}
  }

  return [storedValue, setValue, removeValue]
}

export default useLocalStorage

10. STRUCTURE DE FICHIERS COMPLÈTE
src/
├── assets/
│   └── logo.svg
│
├── components/
│   ├── ui/
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── DataTable.jsx
│   │   ├── EmptyState.jsx
│   │   ├── FormField.jsx
│   │   ├── Modal.jsx
│   │   ├── Pagination.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Spinner.jsx
│   │   └── StatCard.jsx
│   │
│   ├── stock/
│   │   ├── StockBadge.jsx
│   │   └── StockProgressBar.jsx
│   │
│   └── layout/
│       ├── AppShell.jsx
│       ├── Header.jsx
│       └── Sidebar.jsx
│
├── hooks/
│   ├── useDebounce.js
│   ├── useLocalStorage.js
│   ├── usePagination.js
│   └── useSort.js
│
├── pages/
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── Inventory.jsx
│   ├── Movements.jsx
│   ├── Alerts.jsx
│   └── Settings.jsx
│
├── services/
│   └── api.js
│
├── styles/
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   └── components.css
│
├── App.jsx
└── main.jsx

11. RÈGLES FINALES POUR CLAUDE
Ce que Claude DOIT toujours faire

Utiliser uniquement les variables CSS définies dans variables.css
Générer des composants accessibles (aria, rôles, focus)
Proposer les états de chargement (skeleton/spinner) et états vides
Respecter les breakpoints 768px et 576px uniquement
Utiliser Lucide React pour toutes les icônes
Appliquer les couleurs d'état stock : success/warning/danger
Nommer les classes en BEM simplifié

Ce que Claude NE DOIT JAMAIS faire

Utiliser Tailwind, Bootstrap, MUI, Chakra, styled-components
Créer des valeurs CSS hardcodées (#2188ff, 16px, etc.)
Utiliser des bibliothèques d'icônes autres que Lucide React
Créer des breakpoints autres que 768px et 576px
Oublier les attributs aria-* sur les éléments interactifs

Ordre d'import des styles dans main.jsx
import './styles/variables.css'   // 1. Tokens
import './styles/base.css'        // 2. Reset + typo
import './styles/layout.css'      // 3. Structure
import './styles/components.css'  // 4. Composants

Voici la suite complète prête à être copiée :
---

## 12. FICHIERS CSS COMPLETS

### 12.1 variables.css (src/styles/variables.css)

```css
:root {
  /* ===== COULEURS PRIMAIRES ===== */
  --color-primary-50:  #f0f7ff;
  --color-primary-100: #d0e7ff;
  --color-primary-200: #a6d1ff;
  --color-primary-300: #79b8ff;
  --color-primary-400: #4da2ff;
  --color-primary-500: #2188ff;
  --color-primary-600: #1a6edb;
  --color-primary-700: #1456b7;
  --color-primary-800: #0d3e93;
  --color-primary-900: #07296f;

  /* ===== COULEURS D'ÉTAT ===== */
  --color-success:       #28a745;
  --color-success-light: #d4edda;
  --color-success-dark:  #1e7e34;

  --color-warning:       #ffc107;
  --color-warning-light: #fff3cd;
  --color-warning-dark:  #d39e00;

  --color-danger:        #dc3545;
  --color-danger-light:  #f8d7da;
  --color-danger-dark:   #bd2130;

  --color-info:          #17a2b8;
  --color-info-light:    #d1ecf1;
  --color-info-dark:     #117a8b;

  /* ===== NEUTRES ===== */
  --color-white:    #ffffff;
  --color-gray-50:  #f8f9fa;
  --color-gray-100: #e9ecef;
  --color-gray-200: #dee2e6;
  --color-gray-300: #ced4da;
  --color-gray-400: #adb5bd;
  --color-gray-500: #6c757d;
  --color-gray-600: #495057;
  --color-gray-700: #343a40;
  --color-gray-800: #212529;
  --color-gray-900: #121416;
  --color-black:    #000000;

  /* ===== FONDS ===== */
  --color-bg-app:     #f0f2f5;
  --color-bg-card:    #ffffff;
  --color-bg-sidebar: #1a2332;
  --color-bg-header:  #ffffff;
  --color-bg-overlay: rgba(0, 0, 0, 0.5);

  /* ===== TEXTES ===== */
  --color-text-primary:   #212529;
  --color-text-secondary: #6c757d;
  --color-text-muted:     #adb5bd;
  --color-text-inverse:   #ffffff;
  --color-text-link:      #2188ff;

  /* ===== BORDURES ===== */
  --color-border:       #dee2e6;
  --color-border-light: #e9ecef;
  --color-border-focus: #2188ff;

  /* ===== SIDEBAR ===== */
  --color-sidebar-text:         rgba(255, 255, 255, 0.7);
  --color-sidebar-text-active:  #ffffff;
  --color-sidebar-bg-active:    rgba(255, 255, 255, 0.1);
  --color-sidebar-bg-hover:     rgba(255, 255, 255, 0.06);
  --color-sidebar-border:       rgba(255, 255, 255, 0.08);

  /* ===== TYPOGRAPHIE ===== */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont,
                      'Segoe UI', Roboto, Oxygen, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code',
                      'Cascadia Code', Consolas, monospace;

  --font-size-xs:   0.75rem;   /* 12px */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-md:   1.125rem;  /* 18px */
  --font-size-lg:   1.25rem;   /* 20px */
  --font-size-xl:   1.5rem;    /* 24px */
  --font-size-2xl:  1.875rem;  /* 30px */
  --font-size-3xl:  2.25rem;   /* 36px */

  --font-weight-normal:  400;
  --font-weight-medium:  500;
  --font-weight-semibold: 600;
  --font-weight-bold:    700;

  --line-height-tight:  1.25;
  --line-height-base:   1.5;
  --line-height-relaxed: 1.75;

  /* ===== ESPACEMENT ===== */
  --space-1:  0.25rem;   /* 4px  */
  --space-2:  0.5rem;    /* 8px  */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* ===== BORDER RADIUS ===== */
  --radius-sm:   4px;
  --radius-base: 8px;
  --radius-md:   10px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-full: 9999px;

  /* ===== OMBRES ===== */
  --shadow-xs:  0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm:  0 1px 3px rgba(0, 0, 0, 0.08),
                0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-base: 0 4px 6px rgba(0, 0, 0, 0.07),
                 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-md:  0 8px 16px rgba(0, 0, 0, 0.08),
                0 4px 8px  rgba(0, 0, 0, 0.04);
  --shadow-lg:  0 16px 32px rgba(0, 0, 0, 0.10),
                0 8px  16px rgba(0, 0, 0, 0.05);
  --shadow-xl:  0 24px 48px rgba(0, 0, 0, 0.12),
                0 12px 24px rgba(0, 0, 0, 0.06);

  /* ===== LAYOUT ===== */
  --sidebar-width:          260px;
  --sidebar-width-collapsed: 68px;
  --header-height:           64px;
  --content-max-width:       1440px;
  --content-padding:         var(--space-6);
  --content-padding-mobile:  var(--space-4);

  /* ===== TRANSITIONS ===== */
  --transition-fast:   150ms ease;
  --transition-base:   200ms ease;
  --transition-slow:   300ms ease;
  --transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ===== Z-INDEX ===== */
  --z-dropdown: 100;
  --z-sticky:   200;
  --z-fixed:    300;
  --z-overlay:  400;
  --z-modal:    500;
  --z-toast:    600;
  --z-tooltip:  700;
}

12.2 base.css (src/styles/base.css)
/* ===== RESET ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-base);
  color: var(--color-text-primary);
  background-color: var(--color-bg-app);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== TYPOGRAPHIE ===== */
h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
h3 { font-size: var(--font-size-xl);  }
h4 { font-size: var(--font-size-lg);  }
h5 { font-size: var(--font-size-md);  }
h6 { font-size: var(--font-size-base);}

p {
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

a {
  color: var(--color-text-link);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover { text-decoration: underline; }

code, kbd, samp, pre {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
}

strong { font-weight: var(--font-weight-semibold); }

small {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* ===== IMAGES ===== */
img, svg {
  display: block;
  max-width: 100%;
}

/* ===== LISTES ===== */
ul, ol { list-style: none; }

/* ===== FORMULAIRES (reset) ===== */
button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}

button {
  cursor: pointer;
  background: none;
  border: none;
}

input, select, textarea {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  padding: var(--space-2) var(--space-3);
  width: 100%;
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast);
  outline: none;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(33, 136, 255, 0.15);
}

input::placeholder,
textarea::placeholder {
  color: var(--color-text-muted);
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  padding-right: var(--space-8);
}

textarea {
  resize: vertical;
  min-height: 100px;
}

/* ===== FOCUS VISIBLE ===== */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* ===== SCROLLBAR PERSONNALISÉE ===== */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb:hover { background: var(--color-gray-400); }

/* ===== SÉLECTION ===== */
::selection {
  background: var(--color-primary-100);
  color: var(--color-primary-800);
}

/* ===== UTILITAIRES DE BASE ===== */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-family: var(--font-family-mono);
}

12.3 layout.css (src/styles/layout.css)
/* ===== APP SHELL ===== */
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-app);
}

/* ===== SIDEBAR ===== */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: var(--sidebar-width);
  background: var(--color-bg-sidebar);
  display: flex;
  flex-direction: column;
  z-index: var(--z-fixed);
  transition: width var(--transition-slow),
              transform var(--transition-slow);
  overflow: hidden;
}

.sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4);
  height: var(--header-height);
  border-bottom: 1px solid var(--color-sidebar-border);
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-logo-icon {
  width: 36px;
  height: 36px;
  background: var(--color-primary-500);
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  flex-shrink: 0;
}

.sidebar-logo-text {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
  color: var(--color-text-inverse);
  opacity: 1;
  transition: opacity var(--transition-base);
}

.sidebar.collapsed .sidebar-logo-text { opacity: 0; }

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: var(--space-3) var(--space-2);
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-section {
  margin-bottom: var(--space-6);
}

.sidebar-section-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-sidebar-text);
  opacity: 0.5;
  padding: 0 var(--space-3);
  margin-bottom: var(--space-2);
  white-space: nowrap;
  overflow: hidden;
  transition: opacity var(--transition-base);
}

.sidebar.collapsed .sidebar-section-label { opacity: 0; }

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-base);
  color: var(--color-sidebar-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition: background var(--transition-fast),
              color var(--transition-fast);
  text-decoration: none;
  position: relative;
  margin-bottom: 2px;
}

.sidebar-item:hover {
  background: var(--color-sidebar-bg-hover);
  color: var(--color-sidebar-text-active);
  text-decoration: none;
}

.sidebar-item.active {
  background: var(--color-sidebar-bg-active);
  color: var(--color-sidebar-text-active);
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--color-primary-400);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.sidebar-item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-item-label {
  opacity: 1;
  transition: opacity var(--transition-base);
}

.sidebar.collapsed .sidebar-item-label { opacity: 0; }

.sidebar-badge {
  margin-left: auto;
  background: var(--color-danger);
  color: var(--color-white);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  transition: opacity var(--transition-base);
}

.sidebar.collapsed .sidebar-badge { opacity: 0; }

/* Footer sidebar */
.sidebar-footer {
  padding: var(--space-3) var(--space-2);
  border-top: 1px solid var(--color-sidebar-border);
}

.sidebar-collapse-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-base);
  color: var(--color-sidebar-text);
  font-size: var(--font-size-sm);
  width: 100%;
  transition: background var(--transition-fast),
              color var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-collapse-btn:hover {
  background: var(--color-sidebar-bg-hover);
  color: var(--color-sidebar-text-active);
}

/* ===== HEADER ===== */
.header {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: var(--header-height);
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--content-padding);
  z-index: var(--z-sticky);
  transition: left var(--transition-slow);
  box-shadow: var(--shadow-xs);
}

.header.sidebar-collapsed { left: var(--sidebar-width-collapsed); }

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-width: 0;
}

.header-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.header-breadcrumb-separator {
  color: var(--color-text-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

/* Avatar */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border: 2px solid transparent;
  transition: border-color var(--transition-fast);
}

.avatar:hover { border-color: var(--color-primary-300); }
.avatar img   { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }

/* ===== MAIN CONTENT ===== */
.main-content {
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  min-height: calc(100vh - var(--header-height));
  padding: var(--content-padding);
  transition: margin-left var(--transition-slow);
}

.main-content.sidebar-collapsed {
  margin-left: var(--sidebar-width-collapsed);
}

/* Page header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.page-header-info {}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-1);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.page-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

/* Grid stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

/* Grid contenu */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.content-grid.full { grid-template-columns: 1fr; }
.content-grid.aside { grid-template-columns: 1fr 360px; }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: var(--sidebar-width) !important;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: var(--color-bg-overlay);
    z-index: calc(var(--z-fixed) - 1);
  }

  .header {
    left: 0;
  }

  .main-content {
    margin-left: 0;
    padding: var(--content-padding-mobile);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  .content-grid,
  .content-grid.aside {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-actions {
    flex-wrap: wrap;
  }

  .header-title { font-size: var(--font-size-base); }
}

@media (max-width: 576px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-title { font-size: var(--font-size-xl); }

  .header {
    padding: 0 var(--content-padding-mobile);
  }

  .main-content {
    padding: var(--space-3);
  }
}

12.4 components.css (src/styles/components.css)
/* ============================
   BOUTONS
   ============================ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
  user-select: none;
  transition: background var(--transition-fast),
              color var(--transition-fast),
              border-color var(--transition-fast),
              box-shadow var(--transition-fast),
              opacity var(--transition-fast);
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.btn:disabled,
.btn.loading {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* Variantes */
.btn-primary {
  background: var(--color-primary-500);
  color: var(--color-white);
  border-color: var(--color-primary-500);
}
.btn-primary:hover {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
  box-shadow: 0 4px 12px rgba(33, 136, 255, 0.3);
}

.btn-secondary {
  background: var(--color-white);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}
.btn-secondary:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

.btn-danger {
  background: var(--color-danger);
  color: var(--color-white);
  border-color: var(--color-danger);
}
.btn-danger:hover {
  background: var(--color-danger-dark);
  border-color: var(--color-danger-dark);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn-success {
  background: var(--color-success);
  color: var(--color-white);
  border-color: var(--color-success);
}
.btn-success:hover {
  background: var(--color-success-dark);
  border-color: var(--color-success-dark);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border-color: transparent;
}
.btn-ghost:hover {
  background: var(--color-gray-100);
  color: var(--color-text-primary);
}

.btn-link {
  background: transparent;
  color: var(--color-text-link);
  border-color: transparent;
  padding-left: 0;
  padding-right: 0;
}
.btn-link:hover {
  text-decoration: underline;
}

/* Tailles */
.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  border-radius: var(--radius-sm);
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-base);
  border-radius: var(--radius-md);
}

.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--radius-base);
}

.btn-icon.btn-sm {
  width: 28px;
  height: 28px;
}

.btn-icon.btn-lg {
  width: 44px;
  height: 44px;
}

/* Loading spinner dans bouton */
.btn.loading::after {
  content: '';
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
  margin-left: var(--space-2);
}

/* ============================
   BADGES
   ============================ */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1.4;
  white-space: nowrap;
}

.badge-success { background: var(--color-success-light); color: var(--color-success-dark);  }
.badge-warning { background: var(--color-warning-light); color: var(--color-warning-dark);  }
.badge-danger  { background: var(--color-danger-light);  color: var(--color-danger-dark);   }
.badge-info    { background: var(--color-info-light);    color: var(--color-info-dark);     }
.badge-primary { background: var(--color-primary-100);   color: var(--color-primary-700);   }
.badge-neutral { background: var(--color-gray-100);      color: var(--color-gray-600);      }

/* ============================
   CARDS
   ============================ */
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.card-body { padding: var(--space-5); }

.card-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-gray-50);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

/* ============================
   STAT CARDS
   ============================ */
.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base),
              transform var(--transition-base);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.stat-card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card-icon.primary { background: var(--color-primary-100); color: var(--color-primary-600); }
.stat-card-icon.success { background: var(--color-success-light); color: var(--color-success-dark); }
.stat-card-icon.warning { background: var(--color-warning-light); color: var(--color-warning-dark); }
.stat-card-icon.danger  { background: var(--color-danger-light);  color: var(--color-danger-dark); }
.stat-card-icon.info    { background: var(--color-info-light);    color: var(--color-info-dark); }

.stat-card-body { flex: 1; min-width: 0; }

.stat-card-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-1);
}

.stat-card-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-2);
  font-variant-numeric: tabular-nums;
}

.stat-card-trend {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
}

.stat-card-trend.up   { background: var(--color-success-light); color: var(--color-success-dark); }
.stat-card-trend.down { background: var(--color-danger-light);  color: var(--color-danger-dark); }
.stat-card-trend.neutral { background: var(--color-gray-100);   color: var(--color-gray-500); }

/* ============================
   TABLEAUX
   ============================ */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--radius-base);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.table thead {
  background: var(--color-gray-50);
  border-bottom: 2px solid var(--color-border);
}

.table th {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  white-space: nowrap;
  text-align: left;
}

.table th.sortable { cursor: pointer; user-select: none; }
.table th.sortable:hover { color: var(--color-text-primary); }
.table th.sorted { color: var(--color-primary-600); }

.table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
  vertical-align: middle;
}

.table tbody tr:last-child td { border-bottom: none; }

.table tbody tr {
  transition: background var(--transition-fast);
}

.table tbody tr:hover { background: var(--color-gray-50); }

/* Cellules colorées selon le stock */
.table td.cell-success { color: var(--color-success-dark); font-weight: var(--font-weight-semibold); }
.table td.cell-warning { color: var(--color-warning-dark); font-weight: var(--font-weight-semibold); }
.table td.cell-danger  { color: var(--color-danger-dark);  font-weight: var(--font-weight-semibold); }

/* ============================
   PROGRESS BAR
   ============================ */
.progress {
  height: 6px;
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.progress-bar.high   { background: var(--color-success); }
.progress-bar.medium { background: var(--color-warning); }
.progress-bar.low    { background: var(--color-danger);  }

/* ============================
   FORMULAIRES
   ============================ */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-control {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  width: 100%;
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast);
  outline: none;
}

.form-control:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(33, 136, 255, 0.15);
}

.form-control::placeholder { color: var(--color-text-muted); }

.form-group.has-error .form-control {
  border-color: var(--color-danger);
}

.form-group.has-error .form-control:focus {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);
}

.form-error {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}

.form-helper {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Grille de formulaire */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-row.three { grid-template-columns: 1fr 1fr 1fr; }
.form-row.full  { grid-template-columns: 1fr; }

@media (max-width: 576px) {
  .form-row,
  .form-row.three { grid-template-columns: 1fr; }
}

/* ============================
   SEARCH BAR
   ============================ */
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
}

.search-input-wrapper > svg:first-child {
  position: absolute;
  left: var(--space-3);
  color: var(--color-text-muted);
  pointer-events: none;
  z-index: 1;
}

.search-input {
  padding-left: calc(var(--space-3) + 16px + var(--space-2));
  padding-right: calc(var(--space-3) + 28px + var(--space-2));
  height: 38px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  width: 100%;
  outline: none;
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.search-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(33, 136, 255, 0.15);
}

/* ============================
   PAGINATION
   ============================ */
.pagination {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.pagination-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-base);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-fast),
              color var(--transition-fast),
              border-color var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-primary-50);
  border-color: var(--color-primary-300);
  color: var(--color-primary-600);
}

.pagination-btn.active {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: var(--color-white);
  font-weight: var(--font-weight-semibold);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ============================
   MODAL
   ============================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  animation: fadeIn var(--transition-base);
}

.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp var(--transition-slow);
  outline: none;
}

.modal-sm { max-width: 420px; }
.modal-lg { max-width: 720px; }
.modal-xl { max-width: 960px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--space-5);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  flex-shrink: 0;
  background: var(--color-gray-50);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

@media (max-width: 576px) {
  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal {
    max-width: 100%;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    max-height: 95vh;
    animation: slideUpMobile var(--transition-slow);
  }
}

/* ============================
   EMPTY STATE
   ============================ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) var(--space-6);
  gap: var(--space-3);
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  color: var(--color-gray-300);
  margin-bottom: var(--space-2);
}

.empty-state-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.empty-state-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  max-width: 360px;
  line-height: var(--line-height-relaxed);
}

/* ============================
   SPINNER
   ============================ */
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}

.spinner-sm { width: 14px; height: 14px; border-width: 2px; }
.spinner-lg { width: 32px; height: 32px; border-width: 3px; }

.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 300px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* ============================
   SKELETON LOADING
   ============================ */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 25%,
    var(--color-gray-200) 50%,
    var(--color-gray-100) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-base);
}

.skeleton-text {
  height: 14px;
  border-radius: var(--radius-sm);
}

.skeleton-title {
  height: 20px;
  border-radius: var(--radius-sm);
}

/* ============================
   DROPDOWN
   ============================ */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  min-width: 180px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  overflow: hidden;
  animation: fadeIn var(--transition-fast);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
  width: 100%;
  text-align: left;
}

.dropdown-item:hover { background: var(--color-gray-50); }

.dropdown-item.danger {
  color: var(--color-danger);
}
.dropdown-item.danger:hover { background: var(--color-danger-light); }

.dropdown-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--space-1) 0;
}

/* ============================
   ALERTES / NOTIFICATIONS INLINE
   ============================ */
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border: 1px solid transparent;
  font-size: var(--font-size-sm);
}

.alert-success {
  background: var(--color-success-light);
  border-color: var(--color-success);
  color: var(--color-success-dark);
}

.alert-warning {
  background: var(--color-warning-light);
  border-color: var(--color-warning);
  color: var(--color-warning-dark);
}

.alert-danger {
  background: var(--color-danger-light);
  border-color: var(--color-danger);
  color: var(--color-danger-dark);
}

.alert-info {
  background: var(--color-info-light);
  border-color: var(--color-info);
  color: var(--color-info-dark);
}

/* ============================
   TOOLTIPS
   ============================ */
[data-tooltip] {
  position: relative;
}

[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + var(--space-1));
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-gray-800);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: var(--z-tooltip);
}

[data-tooltip]:hover::after { opacity: 1; }

/* ============================
   ANIMATIONS
   ============================ */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideUpMobile {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

13. CONFIGURATION REACT TOASTIFY
13.1 Configuration globale (src/App.jsx)
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Dans le return du composant App :
<ToastContainer
  position="bottom-right"
  autoClose={3500}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="light"
  toastStyle={{
    fontSize: 'var(--font-size-sm)',
    borderRadius: 'var(--radius-base)',
    boxShadow: 'var(--shadow-lg)',
  }}
/>
13.2 Helpers toast (src/utils/toast.js)
import { toast } from 'react-toastify'

export const toastSuccess = (message) =>
  toast.success(message, { icon: '✅' })

export const toastError = (message) =>
  toast.error(message, { icon: '❌' })

export const toastWarning = (message) =>
  toast.warning(message, { icon: '⚠️' })

export const toastInfo = (message) =>
  toast.info(message, { icon: 'ℹ️' })

export const toastLoading = (message = 'Chargement...') =>
  toast.loading(message)

export const toastUpdate = (id, { type, message }) =>
  toast.update(id, {
    render: message,
    type,
    isLoading: false,
    autoClose: 3500,
  })

14. REACT ROUTER DOM — CONFIGURATION
14.1 App.jsx complet
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './styles/variables.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'

import AppShell   from './components/layout/AppShell'
import Dashboard  from './pages/Dashboard'
import Products   from './pages/Products'
import Inventory  from './pages/Inventory'
import Movements  from './pages/Movements'
import Alerts     from './pages/Alerts'
import Settings   from './pages/Settings'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<Dashboard />}  />
        <Route path="products"   element={<Products />}   />
        <Route path="inventory"  element={<Inventory />}  />
        <Route path="movements"  element={<Movements />}  />
        <Route path="alerts"     element={<Alerts />}     />
        <Route path="settings"   element={<Settings />}   />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>

    <ToastContainer
      position="bottom-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      toastStyle={{
        fontSize: 'var(--font-size-sm)',
        borderRadius: 'var(--radius-base)',
        boxShadow: 'var(--shadow-lg)',
      }}
    />
  </BrowserRouter>
)

export default App

15. CONSTANTES MÉTIER
15.1 src/constants/stock.js
// Statuts de stock
export const STOCK_STATUS = {
  IN_STOCK:    'in_stock',
  LOW_STOCK:   'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
}

export const STOCK_STATUS_LABELS = {
  [STOCK_STATUS.IN_STOCK]:     'En stock',
  [STOCK_STATUS.LOW_STOCK]:    'Stock faible',
  [STOCK_STATUS.OUT_OF_STOCK]: 'Rupture',
}

export const STOCK_STATUS_BADGE = {
  [STOCK_STATUS.IN_STOCK]:     'success',
  [STOCK_STATUS.LOW_STOCK]:    'warning',
  [STOCK_STATUS.OUT_OF_STOCK]: 'danger',
}

// Types de mouvements
export const MOVEMENT_TYPE = {
  IN:       'in',
  OUT:      'out',
  ADJUST:   'adjust',
  TRANSFER: 'transfer',
}

export const MOVEMENT_TYPE_LABELS = {
  [MOVEMENT_TYPE.IN]:       'Entrée',
  [MOVEMENT_TYPE.OUT]:      'Sortie',
  [MOVEMENT_TYPE.ADJUST]:   'Ajustement',
  [MOVEMENT_TYPE.TRANSFER]: 'Transfert',
}

export const MOVEMENT_TYPE_BADGE = {
  [MOVEMENT_TYPE.IN]:       'success',
  [MOVEMENT_TYPE.OUT]:      'danger',
  [MOVEMENT_TYPE.ADJUST]:   'info',
  [MOVEMENT_TYPE.TRANSFER]: 'warning',
}

// Helpers
export const getStockStatus = (quantity, threshold) => {
  if (quantity === 0)           return STOCK_STATUS.OUT_OF_STOCK
  if (quantity <= threshold)    return STOCK_STATUS.LOW_STOCK
  return STOCK_STATUS.IN_STOCK
}

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
Voici la suite finale du skill :
---

## 16. COMPOSANTS REACT COMPLETS

### 16.1 AppShell (src/components/layout/AppShell.jsx)

```jsx
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const AppShell = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Fermer le menu mobile à chaque changement de route
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Gérer le resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="app-shell">
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed(prev => !prev)}
      />

      <Header
        collapsed={collapsed}
        onMenuToggle={() => setMobileOpen(prev => !prev)}
      />

      <main
        className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}
        id="main-content"
      >
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell

16.2 Sidebar (src/components/layout/Sidebar.jsx)
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard',  label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/products',   label: 'Produits',         icon: Package },
      { to: '/inventory',  label: 'Inventaire',       icon: Warehouse },
      { to: '/movements',  label: 'Mouvements',       icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { to: '/alerts',   label: 'Alertes',       icon: Bell,      badge: 3 },
      { to: '/reports',  label: 'Rapports',      icon: BarChart3 },
      { to: '/settings', label: 'Paramètres',    icon: Settings },
    ],
  },
]

const Sidebar = ({ collapsed, mobileOpen, onCollapse }) => {
  return (
    <aside
      className={[
        'sidebar',
        collapsed   ? 'collapsed'    : '',
        mobileOpen  ? 'mobile-open'  : '',
      ].filter(Boolean).join(' ')}
      aria-label="Navigation principale"
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" aria-hidden="true">
          <Warehouse size={20} />
        </div>
        <span className="sidebar-logo-text">StockPro</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Menu">
        {NAV_SECTIONS.map(section => (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-label" aria-hidden="true">
              {section.label}
            </div>
            {section.items.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
                aria-label={label}
                title={collapsed ? label : undefined}
              >
                <span className="sidebar-item-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="sidebar-item-label">{label}</span>
                {badge && (
                  <span className="sidebar-badge" aria-label={`${badge} alertes`}>
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="sidebar-collapse-btn"
          onClick={onCollapse}
          aria-label={collapsed ? 'Déplier la sidebar' : 'Replier la sidebar'}
          title={collapsed ? 'Déplier' : 'Replier'}
        >
          <span className="sidebar-item-icon" aria-hidden="true">
            {collapsed
              ? <ChevronRight size={18} />
              : <ChevronLeft  size={18} />
            }
          </span>
          <span className="sidebar-item-label">Réduire</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

16.3 Header (src/components/layout/Header.jsx)
import { useLocation } from 'react-router-dom'
import { Menu, Bell, Search, HelpCircle } from 'lucide-react'

const PAGE_TITLES = {
  '/dashboard':  { title: 'Tableau de bord',  subtitle: 'Vue générale de votre stock' },
  '/products':   { title: 'Produits',          subtitle: 'Gestion du catalogue produits' },
  '/inventory':  { title: 'Inventaire',        subtitle: 'État du stock en temps réel' },
  '/movements':  { title: 'Mouvements',        subtitle: 'Historique des entrées / sorties' },
  '/alerts':     { title: 'Alertes',           subtitle: 'Produits nécessitant une action' },
  '/reports':    { title: 'Rapports',          subtitle: 'Analyses et statistiques' },
  '/settings':   { title: 'Paramètres',        subtitle: 'Configuration de l\'application' },
}

const Header = ({ collapsed, onMenuToggle }) => {
  const { pathname } = useLocation()
  const page = PAGE_TITLES[pathname] ?? { title: 'StockPro', subtitle: '' }

  return (
    <header
      className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}
      role="banner"
    >
      {/* Gauche */}
      <div className="header-left">
        <button
          className="btn btn-ghost btn-icon"
          onClick={onMenuToggle}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <div className="header-title">{page.title}</div>
          {page.subtitle && (
            <div
              className="header-breadcrumb"
              aria-label="Description de la page"
            >
              {page.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Droite */}
      <div className="header-right">
        <button
          className="btn btn-ghost btn-icon"
          aria-label="Recherche globale"
        >
          <Search size={18} />
        </button>

        <button
          className="btn btn-ghost btn-icon"
          aria-label="Aide"
        >
          <HelpCircle size={18} />
        </button>

        <button
          className="btn btn-ghost btn-icon"
          aria-label="Notifications (3 non lues)"
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              background: 'var(--color-danger)',
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--color-bg-header)',
            }}
          />
        </button>

        <div
          className="avatar"
          role="button"
          tabIndex={0}
          aria-label="Menu utilisateur"
          title="Mon compte"
        >
          AD
        </div>
      </div>
    </header>
  )
}

export default Header

16.4 StatCard (src/components/ui/StatCard.jsx)
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconVariant = 'primary',
  trend,
  trendLabel,
  suffix = '',
  prefix = '',
}) => {
  const trendIcon = trend > 0
    ? <TrendingUp  size={12} />
    : trend < 0
    ? <TrendingDown size={12} />
    : <Minus size={12} />

  const trendCls = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'

  return (
    <div className="stat-card">
      {Icon && (
        <div className={`stat-card-icon ${iconVariant}`} aria-hidden="true">
          <Icon size={22} />
        </div>
      )}
      <div className="stat-card-body">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">
          {prefix}{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}{suffix}
        </div>
        {trend !== undefined && (
          <span className={`stat-card-trend ${trendCls}`} aria-label={`Tendance : ${trendLabel}`}>
            {trendIcon}
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  )
}

export default StatCard

16.5 Modal (src/components/ui/Modal.jsx)
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = '',
  closeOnOverlay = true,
}) => {
  const dialogRef = useRef(null)

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Fermer avec Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`modal ${size ? `modal-${size}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">{title}</h2>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="Fermer la modale"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer optionnel */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export default Modal

16.6 ConfirmDialog (src/components/ui/ConfirmDialog.jsx)
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer l\'action',
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div style={{
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start',
    }}>
      <AlertTriangle
        size={24}
        color="var(--color-warning)"
        style={{ flexShrink: 0, marginTop: '2px' }}
        aria-hidden="true"
      />
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        {message}
      </p>
    </div>
  </Modal>
)

export default ConfirmDialog

16.7 EmptyState (src/components/ui/EmptyState.jsx)
import { PackageSearch } from 'lucide-react'
import Button from './Button'

const EmptyState = ({
  icon: Icon = PackageSearch,
  title = 'Aucun élément trouvé',
  description = 'Il n\'y a rien à afficher pour le moment.',
  action,
  actionLabel = 'Ajouter',
}) => (
  <div className="empty-state" role="status" aria-live="polite">
    <Icon className="empty-state-icon" aria-hidden="true" />
    <p className="empty-state-title">{title}</p>
    <p className="empty-state-description">{description}</p>
    {action && (
      <Button
        variant="primary"
        onClick={action}
        style={{ marginTop: 'var(--space-2)' }}
      >
        {actionLabel}
      </Button>
    )}
  </div>
)

export default EmptyState

16.8 SearchBar (src/components/ui/SearchBar.jsx)
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useRef } from 'react'

const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Rechercher...',
  filters,
  onFilters,
  className = '',
}) => {
  const inputRef = useRef(null)

  return (
    <div className={`search-bar ${className}`} role="search">
      <div className="search-input-wrapper">
        <Search size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label={placeholder}
        />
        {value && (
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => { onClear?.(); inputRef.current?.focus() }}
            aria-label="Effacer la recherche"
            style={{ position: 'absolute', right: 'var(--space-1)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {onFilters && (
        <button
          className={`btn btn-secondary btn-sm ${filters ? 'active' : ''}`}
          onClick={onFilters}
          aria-label="Filtres avancés"
          aria-pressed={!!filters}
        >
          <SlidersHorizontal size={14} />
          Filtres
        </button>
      )}
    </div>
  )
}

export default SearchBar

16.9 Pagination (src/components/ui/Pagination.jsx)
import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) => {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to   = Math.min(currentPage * pageSize, totalItems)

  // Générer les numéros de page à afficher
  const pages = []
  const delta = 1
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i)
    }
  }

  // Insérer les ellipses
  const withEllipsis = []
  let prev = 0
  for (const p of pages) {
    if (p - prev > 1) withEllipsis.push('...')
    withEllipsis.push(p)
    prev = p
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        padding: 'var(--space-4) 0',
      }}
      role="navigation"
      aria-label="Pagination"
    >
      <span
        style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}
        aria-live="polite"
      >
        {from}–{to} sur {totalItems.toLocaleString('fr-FR')} résultats
      </span>

      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Page précédente"
        >
          <ChevronLeft size={14} />
        </button>

        {withEllipsis.map((p, i) =>
          p === '...' ? (
            <span
              key={`ellipsis-${i}`}
              style={{
                padding: '0 var(--space-1)',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
              }}
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default Pagination

16.10 DataTable (src/components/ui/DataTable.jsx)
import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import EmptyState from './EmptyState'
import Spinner from './Spinner'
import Pagination from './Pagination'

const DataTable = ({
  columns,
  data,
  loading = false,
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyActionLabel,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  defaultSort = null,
}) => {
  const [sort, setSort] = useState(defaultSort)

  const handleSort = (key) => {
    if (!key) return
    setSort(prev =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }

  const sortedData = sort
    ? [...data].sort((a, b) => {
        const aVal = a[sort.key]
        const bVal = b[sort.key]
        if (aVal == null) return 1
        if (bVal == null) return -1
        const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        return sort.dir === 'asc' ? cmp : -cmp
      })
    : data

  const SortIcon = ({ colKey }) => {
    if (sort?.key === colKey)
      return sort.dir === 'asc'
        ? <ChevronUp size={12} aria-hidden="true" />
        : <ChevronDown size={12} aria-hidden="true" />
    return <ChevronsUpDown size={12} aria-hidden="true" style={{ opacity: 0.4 }} />
  }

  if (loading) {
    return (
      <div className="loading-page" aria-live="polite" aria-busy="true">
        <div className="spinner spinner-lg" role="status" />
        <span>Chargement des données...</span>
      </div>
    )
  }

  if (!data.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        actionLabel={emptyActionLabel}
      />
    )
  }

  return (
    <>
      <div className="table-wrapper" role="region" aria-label="Tableau de données">
        <table className="table" aria-rowcount={totalItems}>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={[
                    col.sortable ? 'sortable' : '',
                    sort?.key === col.key ? 'sorted' : '',
                    col.align === 'right' ? 'numeric' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={
                    sort?.key === col.key
                      ? sort.dir === 'asc' ? 'ascending' : 'descending'
                      : col.sortable ? 'none' : undefined
                  }
                  tabIndex={col.sortable ? 0 : undefined}
                  onKeyDown={e => {
                    if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      handleSort(col.key)
                    }
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr key={row.id ?? rowIndex}>
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={col.align === 'right' ? 'numeric' : ''}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      )}
    </>
  )
}

export default DataTable

16.11 FormField (src/components/ui/FormField.jsx)
import { AlertCircle } from 'lucide-react'

const FormField = ({
  label,
  htmlFor,
  error,
  helper,
  required = false,
  children,
  className = '',
}) => (
  <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
    {label && (
      <label htmlFor={htmlFor} className="form-label">
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>
            *
          </span>
        )}
      </label>
    )}
    {children}
    {error && (
      <span className="form-error" role="alert" aria-live="polite">
        <AlertCircle size={12} aria-hidden="true" />
        {error}
      </span>
    )}
    {helper && !error && (
      <span className="form-helper">{helper}</span>
    )}
  </div>
)

export default FormField

16.12 Spinner (src/components/ui/Spinner.jsx)
const Spinner = ({ size = '', label = 'Chargement...' }) => (
  <span
    className={`spinner ${size ? `spinner-${size}` : ''}`}
    role="status"
    aria-label={label}
  />
)

export default Spinner

16.13 StockBadge (src/components/stock/StockBadge.jsx)
import Badge from '../ui/Badge'
import {
  getStockStatus,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_BADGE,
} from '../../constants/stock'

const StockBadge = ({ quantity, threshold }) => {
  const status = getStockStatus(quantity, threshold)
  return (
    <Badge variant={STOCK_STATUS_BADGE[status]}>
      {STOCK_STATUS_LABELS[status]}
    </Badge>
  )
}

export default StockBadge

16.14 StockProgressBar (src/components/stock/StockProgressBar.jsx)
const StockProgressBar = ({ quantity, maxQuantity }) => {
  const pct = maxQuantity > 0
    ? Math.min(Math.round((quantity / maxQuantity) * 100), 100)
    : 0

  const cls = pct >= 70 ? 'high' : pct >= 30 ? 'medium' : 'low'

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}% du stock maximum`}
      title={`${quantity} / ${maxQuantity} unités (${pct}%)`}
    >
      <div
        className={`progress-bar ${cls}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default StockProgressBar

17. HOOKS PERSONNALISÉS
17.1 useDebounce (src/hooks/useDebounce.js)
import { useState, useEffect } from 'react'

const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce

17.2 usePagination (src/hooks/usePagination.js)
import { useState, useMemo } from 'react'
import { DEFAULT_PAGE_SIZE } from '../constants/stock'

const usePagination = (items, pageSize = DEFAULT_PAGE_SIZE) => {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, currentPage, pageSize])

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const reset = () => setCurrentPage(1)

  return {
    currentPage,
    totalPages,
    totalItems: items.length,
    paginatedItems,
    pageSize,
    goToPage,
    reset,
  }
}

export default usePagination

17.3 useSort (src/hooks/useSort.js)
import { useState, useMemo } from 'react'

const useSort = (items, defaultKey = null, defaultDir = 'asc') => {
  const [sort, setSort] = useState(
    defaultKey ? { key: defaultKey, dir: defaultDir } : null
  )

  const sortedItems = useMemo(() => {
    if (!sort) return items
    return [...items].sort((a, b) => {
      const aVal = a[sort.key]
      const bVal = b[sort.key]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [items, sort])

  const handleSort = (key) => {
    setSort(prev =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }

  return { sortedItems, sort, handleSort }
}

export default useSort

17.4 useLocalStorage (src/hooks/useLocalStorage.js)
import { useState } from 'react'

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (val) => {
    try {
      const valueToStore = val instanceof Function ? val(storedValue) : val
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.warn(`useLocalStorage: impossible de sauvegarder "${key}"`, error)
    }
  }

  const removeValue = () => {
    try {
      setStoredValue(initialValue)
      window.localStorage.removeItem(key)
    } catch {}
  }

  return [storedValue, setValue, removeValue]
}

export default useLocalStorage

18. RÈGLES FINALES ABSOLUES
✅ Claude DOIT toujours

Utiliser uniquement les variables CSS de variables.css
Générer des composants accessibles (aria, rôles, labels, focus)
Proposer états vides + chargement + erreur pour chaque liste
Respecter les breakpoints 768px et 576px uniquement
Utiliser Lucide React pour toutes les icônes sans exception
Appliquer les couleurs métier : success / warning / danger pour le stock
Nommer les classes en BEM simplifié
Utiliser createPortal pour les modales et tooltips

❌ Claude NE DOIT JAMAIS

Utiliser Tailwind, Bootstrap, MUI, Chakra, styled-components
Écrire des valeurs CSS en dur (#2188ff, 16px, bold)
Utiliser des librairies d'icônes autres que Lucide React
Créer des breakpoints autres que 768px et 576px
Oublier les attributs aria-* sur les éléments interactifs
Mélanger les styles inline et les classes CSS sans raison valide
Utiliser !important sauf cas absolument nécessaire