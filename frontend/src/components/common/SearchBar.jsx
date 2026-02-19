/**
 * Composant SearchBar - Barre de recherche réutilisable.
 *
 * Compatible avec recherche manuelle et scanner de codes-barres.
 */

import { Search, Barcode } from 'lucide-react'

function SearchBar({ value, onChange, placeholder, autoFocus = true, className = '' }) {
  return (
    <div className={`card ${className}`} style={{ marginBottom: '1rem' }}>
      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', border: '2px dashed var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Barcode size={20} style={{ color: 'var(--primary)' }} />
          <strong style={{ color: 'var(--primary)' }}>Recherche & Scanner de codes-barres</strong>
        </div>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--primary)'
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder={placeholder || "Rechercher un article ou scanner un code-barre..."}
            value={value}
            onChange={onChange}
            autoFocus={autoFocus}
            style={{
              paddingLeft: '2.5rem',
              fontSize: '1.05rem',
              borderColor: 'var(--primary)'
            }}
          />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
          💡 Recherche instantanée par nom, SKU ou description • Compatible scanneur de codes-barres
        </p>
      </div>
    </div>
  )
}

export default SearchBar
