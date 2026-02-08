/**
 * Page Rapports - Rapports et exports.
 *
 * Affiche les rapports de stock bas, valeur totale et permet les exports.
 */

import { useQuery } from '@tanstack/react-query'
import {
  getRapportStockBas,
  getRapportValeurTotale,
  exportCSV,
  exportPDF,
  exportBarcodesPDF
} from '../services/rapportService'
import { getArticles } from '../services/articleService'
import { Download, FileText, AlertTriangle, Barcode, CheckSquare, Square } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'

function Rapports() {
  const [exportLoading, setExportLoading] = useState(false)
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showBarcodeSection, setShowBarcodeSection] = useState(false)

  // Récupérer le rapport de stock bas
  const { data: stockBas, isLoading: stockBasLoading } = useQuery({
    queryKey: ['rapport-stock-bas'],
    queryFn: getRapportStockBas
  })

  // Récupérer le rapport de valeur totale
  const { data: valeurTotale, isLoading: valeurLoading } = useQuery({
    queryKey: ['rapport-valeur-totale'],
    queryFn: getRapportValeurTotale
  })

  // Récupérer tous les articles pour la sélection de codes-barres
  const { data: articlesData } = useQuery({
    queryKey: ['articles-all'],
    queryFn: () => getArticles({ limit: 500 }),
    enabled: showBarcodeSection
  })

  // Gérer les exports
  const handleExport = async (type, format) => {
    try {
      setExportLoading(true)
      if (format === 'csv') {
        await exportCSV(type)
      } else {
        await exportPDF(type)
      }
    } catch (error) {
      alert(`Erreur lors de l'export : ${error.message}`)
    } finally {
      setExportLoading(false)
    }
  }

  // Gérer la sélection d'articles pour codes-barres
  const handleToggleArticle = (articleId) => {
    setSelectedArticles(prev => {
      if (prev.includes(articleId)) {
        return prev.filter(id => id !== articleId)
      } else {
        return [...prev, articleId]
      }
    })
  }

  const handleSelectAll = () => {
    const articlesWithSku = articlesData?.items?.filter(a => a.sku) || []
    if (selectedArticles.length === articlesWithSku.length) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(articlesWithSku.map(a => a.id))
    }
  }

  const handleExportBarcodes = async () => {
    if (selectedArticles.length === 0) {
      toast.error('Veuillez sélectionner au moins un article')
      return
    }

    try {
      setExportLoading(true)
      await exportBarcodesPDF(selectedArticles)
      toast.success(`PDF généré avec ${selectedArticles.length} article(s)`)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la génération du PDF')
    } finally {
      setExportLoading(false)
    }
  }

  if (stockBasLoading || valeurLoading) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Rapports</h1>
        <div className="loader"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Rapports</h1>

      {/* Valeur totale du stock */}
      <div className="card">
        <h2 className="card-header">Valeur Totale du Stock</h2>
        <div className="card-body">
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '1rem' }}>
            {valeurTotale?.valeur_totale.toFixed(2)} €
          </div>
          <p style={{ color: '#6c757d' }}>
            Basé sur {valeurTotale?.nombre_articles} article(s)
          </p>

          {valeurTotale?.details_par_categorie && valeurTotale.details_par_categorie.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Détails par catégorie</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th>Nombre d'articles</th>
                    <th>Valeur totale</th>
                  </tr>
                </thead>
                <tbody>
                  {valeurTotale.details_par_categorie.map((detail, index) => (
                    <tr key={index}>
                      <td><strong>{detail.categorie}</strong></td>
                      <td>{detail.nombre_articles}</td>
                      <td><strong>{detail.valeur.toFixed(2)} €</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section codes-barres personnalisés */}
      <div className="card">
        <h2 className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <Barcode size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Codes-Barres Personnalisés
          </span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowBarcodeSection(!showBarcodeSection)}
          >
            {showBarcodeSection ? 'Masquer' : 'Afficher'}
          </button>
        </h2>

        {showBarcodeSection && (
          <div className="card-body">
            <p style={{ marginBottom: '1rem' }}>
              Sélectionnez les articles pour lesquels générer des codes-barres à imprimer.
            </p>

            {articlesData?.items ? (
              <>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={handleSelectAll}
                  >
                    {selectedArticles.length === articlesData.items.filter(a => a.sku).length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                  <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                    {selectedArticles.length} article(s) sélectionné(s)
                  </span>
                </div>

                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  padding: '1rem'
                }}>
                  {articlesData.items.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6c757d' }}>
                      Aucun article disponible
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {articlesData.items.map(article => (
                        <label
                          key={article.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #e0e0e0',
                            backgroundColor: selectedArticles.includes(article.id) ? '#f0f8ff' : '#fff',
                            cursor: article.sku ? 'pointer' : 'not-allowed',
                            opacity: article.sku ? 1 : 0.5
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedArticles.includes(article.id)}
                            onChange={() => handleToggleArticle(article.id)}
                            disabled={!article.sku}
                            style={{ cursor: article.sku ? 'pointer' : 'not-allowed' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500' }}>{article.nom}</div>
                            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                              SKU: {article.sku || <em>Pas de SKU</em>} |
                              {' '}Qté: {article.quantite} |
                              {' '}{article.categorie?.nom || 'Sans catégorie'}
                            </div>
                          </div>
                          {selectedArticles.includes(article.id) && (
                            <CheckSquare size={20} style={{ color: '#007bff' }} />
                          )}
                          {!selectedArticles.includes(article.id) && article.sku && (
                            <Square size={20} style={{ color: '#6c757d' }} />
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleExportBarcodes}
                    disabled={selectedArticles.length === 0 || exportLoading}
                    style={{ gap: '0.5rem' }}
                  >
                    <Barcode size={18} />
                    {exportLoading ? 'Génération...' : `Générer PDF (${selectedArticles.length})`}
                  </button>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '1rem', fontStyle: 'italic' }}>
                  💡 Le PDF contiendra 12 étiquettes par page (2 colonnes × 6 lignes) prêtes à découper
                </p>
              </>
            ) : (
              <div className="loader"></div>
            )}
          </div>
        )}
      </div>

      {/* Articles en stock bas */}
      <div className="card">
        <h2 className="card-header">
          <AlertTriangle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Articles en Stock Bas
        </h2>
        <div className="card-body">
          {stockBas && stockBas.articles && stockBas.articles.length > 0 ? (
            <>
              <p style={{ marginBottom: '1rem', color: '#856404' }}>
                <strong>{stockBas.total}</strong> article(s) ont un stock inférieur au seuil minimum.
              </p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>SKU</th>
                    <th>Stock actuel</th>
                    <th>Stock minimum</th>
                    <th>Écart</th>
                    <th>Catégorie</th>
                  </tr>
                </thead>
                <tbody>
                  {stockBas.articles.map((article) => (
                    <tr key={article.id}>
                      <td><strong>{article.nom}</strong></td>
                      <td>{article.sku || '-'}</td>
                      <td>
                        <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                          {article.quantite}
                        </span>
                      </td>
                      <td>{article.quantite_min}</td>
                      <td style={{ color: 'var(--danger)' }}>
                        {article.quantite - article.quantite_min}
                      </td>
                      <td>{article.categorie?.nom || 'Sans catégorie'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="alert alert-success">
              ✓ Tous les articles ont un stock suffisant !
            </div>
          )}
        </div>
      </div>

      {/* Section exports */}
      <div className="card">
        <h2 className="card-header">
          <Download size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Exports
        </h2>
        <div className="card-body">
          <p style={{ marginBottom: '1.5rem' }}>
            Téléchargez vos données au format CSV ou PDF.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Export CSV Articles */}
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Articles (CSV)</h3>
              <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1rem' }}>
                Liste complète des articles
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleExport('articles', 'csv')}
                disabled={exportLoading}
              >
                <Download size={16} />
                Télécharger CSV
              </button>
            </div>

            {/* Export CSV Mouvements */}
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Mouvements (CSV)</h3>
              <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1rem' }}>
                Historique des mouvements
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleExport('mouvements', 'csv')}
                disabled={exportLoading}
              >
                <Download size={16} />
                Télécharger CSV
              </button>
            </div>

            {/* Export PDF Inventaire */}
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Inventaire (PDF)</h3>
              <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1rem' }}>
                Rapport complet d'inventaire
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleExport('inventaire', 'pdf')}
                disabled={exportLoading}
              >
                <FileText size={16} />
                Télécharger PDF
              </button>
            </div>

            {/* Export PDF Stock Bas */}
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Stock Bas (PDF)</h3>
              <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1rem' }}>
                Alerte des articles en stock bas
              </p>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleExport('stock-bas', 'pdf')}
                disabled={exportLoading}
              >
                <AlertTriangle size={16} />
                Télécharger PDF
              </button>
            </div>
          </div>

          {exportLoading && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div className="loader"></div>
              <p>Génération de l'export en cours...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Rapports
