/**
 * Composant SearchBar - Barre de recherche réutilisable.
 *
 * Compatible avec recherche manuelle et scanner de codes-barres.
 */

import { Search, Barcode } from 'lucide-react'

function SearchBar({ value, onChange, placeholder, autoFocus = true, className = '' }) {
  return (
    <div className={`card ${className}`} style={{ marginBottom: '1rem' }}>
      <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '2px dashed #007bff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Barcode size={20} style={{ color: '#007bff' }} />
          <strong style={{ color: '#007bff' }}>Recherche & Scanner de codes-barres</strong>
        </div>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#007bff'
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
              borderColor: '#007bff'
            }}
          />
        </div>
        <p style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.5rem', marginBottom: 0 }}>
          💡 Recherche instantanée par nom, SKU ou description • Compatible scanneur de codes-barres
        </p>
      </div>
    </div>
  )
}

export default SearchBar
