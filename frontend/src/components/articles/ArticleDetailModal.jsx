/**
 * Modal d'affichage des détails complets d'un article.
 *
 * Affiche toutes les informations de l'article dans une carte formatée.
 */

import { X } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function ArticleDetailModal({ article, onClose }) {
  if (!article) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Détails de l'article</h2>
          <button onClick={onClose} className="modal-close" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Colonne gauche */}
            <div>
              {/* Photo */}
              {article.photos && article.photos.length > 0 ? (
                <div style={{ marginBottom: '1rem' }}>
                  <img
                    src={`${API_URL.replace('/api', '')}/uploads/${article.photos[0].filepath}`}
                    alt={article.nom}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: '#999'
                }}>
                  Aucune photo
                </div>
              )}

              {/* Informations principales */}
              <div className="detail-section">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {article.nom}
                </h3>
                <p style={{ color: '#6c757d', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  SKU: <strong>{article.sku}</strong>
                </p>

                {article.description && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', lineHeight: '1.5', color: '#495057' }}>
                      {article.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="detail-section" style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#6c757d' }}>
                    Tags
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {article.tags.map(tag => (
                      <span
                        key={tag.id}
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          borderRadius: '1rem',
                          backgroundColor: tag.couleur || '#3498db',
                          color: '#fff',
                          fontWeight: 500
                        }}
                      >
                        {tag.nom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fournisseurs */}
              {article.fournisseurs && article.fournisseurs.length > 0 && (
                <div className="detail-section" style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#6c757d' }}>
                    Fournisseurs
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {article.fournisseurs.map(fournisseur => (
                      <div
                        key={fournisseur.id}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}
                      >
                        <strong>🚚 {fournisseur.nom}</strong>
                        {fournisseur.contact && (
                          <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                            Contact: {fournisseur.contact}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite */}
            <div>
              {/* Stock et Prix */}
              <div className="detail-section" style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#6c757d' }}>
                  Stock et Prix
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem' }}>Quantité en stock:</span>
                    <strong style={{ fontSize: '0.875rem' }}>
                      {article.quantite}
                      {article.est_stock_bas && (
                        <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>⚠️</span>
                      )}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem' }}>Stock minimum:</span>
                    <strong style={{ fontSize: '0.875rem' }}>{article.quantite_min}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #dee2e6' }}>
                    <span style={{ fontSize: '0.875rem' }}>Prix unitaire:</span>
                    <strong style={{ fontSize: '0.875rem' }}>{article.prix_unitaire.toFixed(2)} €</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #dee2e6' }}>
                    <span style={{ fontSize: '0.875rem' }}>Valeur totale:</span>
                    <strong style={{ fontSize: '1rem', color: '#28a745' }}>
                      {article.valeur_stock.toFixed(2)} €
                    </strong>
                  </div>
                </div>
              </div>

              {/* Catégorie et Emplacement */}
              <div className="detail-section" style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#6c757d' }}>
                  Organisation
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Catégorie</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {article.categorie ? article.categorie.nom_complet : 'Sans catégorie'}
                    </div>
                  </div>
                  {article.emplacement && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Emplacement</span>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        📍 {article.emplacement.code_complet}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations fournisseur */}
              {(article.prix_fournisseur || article.ref_fournisseur || article.delai_livraison) && (
                <div className="detail-section" style={{
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#6c757d' }}>
                    Informations fournisseur
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {article.prix_fournisseur && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.875rem' }}>Prix d'achat:</span>
                        <strong style={{ fontSize: '0.875rem' }}>{article.prix_fournisseur.toFixed(2)} €</strong>
                      </div>
                    )}
                    {article.ref_fournisseur && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.875rem' }}>Référence:</span>
                        <strong style={{ fontSize: '0.875rem' }}>{article.ref_fournisseur}</strong>
                      </div>
                    )}
                    {article.delai_livraison && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.875rem' }}>Délai de livraison:</span>
                        <strong style={{ fontSize: '0.875rem' }}>{article.delai_livraison} jour{article.delai_livraison > 1 ? 's' : ''}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Métadonnées */}
              <div className="detail-section" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  Créé le: {new Date(article.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div>
                  Modifié le: {new Date(article.updated_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArticleDetailModal
