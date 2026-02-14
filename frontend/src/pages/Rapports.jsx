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
  exportBarcodesPDF,
  exportEmplacementsQRCodesPDF,
  exportFournisseurs,
  exportTags,
  exportEmplacementsData
} from '../services/rapportService'
import { getArticles } from '../services/articleService'
import { getEmplacements } from '../services/emplacementService'
import { Download, FileText, AlertTriangle, Barcode, CheckSquare, Square, QrCode, Truck, Tag as TagIcon, MapPin } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'

function Rapports() {
  const [exportLoading, setExportLoading] = useState(false)
  const [selectedArticles, setSelectedArticles] = useState([])
  const [showBarcodeSection, setShowBarcodeSection] = useState(false)
  const [selectedEmplacements, setSelectedEmplacements] = useState([])
  const [labelType, setLabelType] = useState('articles') // 'articles' ou 'emplacements'

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
    enabled: showBarcodeSection && labelType === 'articles'
  })

  // Récupérer tous les emplacements pour la sélection de QR codes
  const { data: emplacementsData } = useQuery({
    queryKey: ['emplacements-all'],
    queryFn: getEmplacements,
    enabled: showBarcodeSection && labelType === 'emplacements'
  })

  // Gérer les exports
  const handleExport = async (type, format) => {
    try {
      setExportLoading(true)

      // Exports pour les nouveaux types
      if (type === 'fournisseurs') {
        await exportFournisseurs(format)
      } else if (type === 'tags') {
        await exportTags(format)
      } else if (type === 'emplacements') {
        await exportEmplacementsData(format)
      }
      // Exports existants (articles, mouvements, stock-bas, inventaire)
      else if (format === 'csv') {
        await exportCSV(type)
      } else {
        await exportPDF(type)
      }

      toast.success(`Export ${format.toUpperCase()} généré avec succès`)
    } catch (error) {
      toast.error(`Erreur lors de l'export : ${error.response?.data?.detail || error.message}`)
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

  // Gérer la sélection d'emplacements pour QR codes
  const handleToggleEmplacement = (emplacementId) => {
    setSelectedEmplacements(prev => {
      if (prev.includes(emplacementId)) {
        return prev.filter(id => id !== emplacementId)
      } else {
        return [...prev, emplacementId]
      }
    })
  }

  const handleSelectAllEmplacements = () => {
    if (selectedEmplacements.length === emplacementsData?.length) {
      setSelectedEmplacements([])
    } else {
      setSelectedEmplacements(emplacementsData?.map(e => e.id) || [])
    }
  }

  const handleExportQRCodes = async () => {
    if (selectedEmplacements.length === 0) {
      toast.error('Veuillez sélectionner au moins un emplacement')
      return
    }

    try {
      setExportLoading(true)
      await exportEmplacementsQRCodesPDF(selectedEmplacements)
      toast.success(`PDF généré avec ${selectedEmplacements.length} emplacement(s)`)
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

      {/* Section étiquettes personnalisées */}
      <div className="card">
        <h2 className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <Barcode size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Étiquettes Personnalisées
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
            {/* Toggle type d'étiquettes */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                className={`btn ${labelType === 'articles' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setLabelType('articles')
                  setSelectedArticles([])
                }}
                style={{ gap: '0.5rem', minWidth: '180px' }}
              >
                <Barcode size={18} />
                Articles (Codes-barres)
              </button>
              <button
                className={`btn ${labelType === 'emplacements' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setLabelType('emplacements')
                  setSelectedEmplacements([])
                }}
                style={{ gap: '0.5rem', minWidth: '180px' }}
              >
                <QrCode size={18} />
                Emplacements (QR codes)
              </button>
            </div>

            <p style={{ marginBottom: '1rem' }}>
              {labelType === 'articles'
                ? 'Sélectionnez les articles pour lesquels générer des codes-barres à imprimer.'
                : 'Sélectionnez les emplacements pour lesquels générer des QR codes à imprimer.'}
            </p>

            {/* Affichage selon le type */}
            {labelType === 'articles' && articlesData?.items ? (
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
            ) : labelType === 'emplacements' && emplacementsData ? (
              <>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={handleSelectAllEmplacements}
                  >
                    {selectedEmplacements.length === emplacementsData.length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                  <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                    {selectedEmplacements.length} emplacement(s) sélectionné(s)
                  </span>
                </div>

                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  padding: '1rem'
                }}>
                  {emplacementsData.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6c757d' }}>
                      Aucun emplacement disponible
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {emplacementsData.map(emplacement => (
                        <label
                          key={emplacement.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #e0e0e0',
                            backgroundColor: selectedEmplacements.includes(emplacement.id) ? '#f0f8ff' : '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmplacements.includes(emplacement.id)}
                            onChange={() => handleToggleEmplacement(emplacement.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {emplacement.niveau === 0 && '🏢'}
                              {emplacement.niveau === 1 && '📚'}
                              {emplacement.niveau === 2 && '📦'}
                              {emplacement.code}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                              {emplacement.code_complet && emplacement.code_complet !== emplacement.code && (
                                <span>{emplacement.code_complet} | </span>
                              )}
                              {emplacement.description || <em>Pas de description</em>}
                              {emplacement.capacite_max !== null && (
                                <span> | Capacité: {emplacement.quantite_utilisee}/{emplacement.capacite_max}</span>
                              )}
                            </div>
                          </div>
                          {selectedEmplacements.includes(emplacement.id) && (
                            <CheckSquare size={20} style={{ color: '#007bff' }} />
                          )}
                          {!selectedEmplacements.includes(emplacement.id) && (
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
                    onClick={handleExportQRCodes}
                    disabled={selectedEmplacements.length === 0 || exportLoading}
                    style={{ gap: '0.5rem' }}
                  >
                    <QrCode size={18} />
                    {exportLoading ? 'Génération...' : `Générer PDF (${selectedEmplacements.length})`}
                  </button>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '1rem', fontStyle: 'italic' }}>
                  💡 Le PDF contiendra 6 étiquettes par page (2 colonnes × 3 lignes) prêtes à découper
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

          <table className="table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Type de données</th>
                <th style={{ width: '40%' }}>Description</th>
                <th style={{ width: '30%' }}>Formats disponibles</th>
              </tr>
            </thead>
            <tbody>
              {/* Articles */}
              <tr>
                <td><strong>📦 Articles</strong></td>
                <td>Liste complète des articles</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExport('articles', 'csv')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <Download size={14} />
                      CSV
                    </button>
                  </div>
                </td>
              </tr>

              {/* Mouvements */}
              <tr>
                <td><strong>📋 Mouvements</strong></td>
                <td>Historique des mouvements de stock</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExport('mouvements', 'csv')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <Download size={14} />
                      CSV
                    </button>
                  </div>
                </td>
              </tr>

              {/* Inventaire */}
              <tr>
                <td><strong>📊 Inventaire complet</strong></td>
                <td>Rapport complet de l'inventaire</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleExport('inventaire', 'pdf')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <FileText size={14} />
                      PDF
                    </button>
                  </div>
                </td>
              </tr>

              {/* Stock bas */}
              <tr>
                <td><strong><AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.25rem', color: '#dc3545' }} />Stock bas</strong></td>
                <td>Alerte des articles en stock bas</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleExport('stock-bas', 'pdf')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <FileText size={14} />
                      PDF
                    </button>
                  </div>
                </td>
              </tr>

              {/* Ligne séparateur */}
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <td colSpan={3} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.875rem', color: '#6c757d', padding: '0.5rem' }}>
                  📚 Données de référence
                </td>
              </tr>

              {/* Fournisseurs */}
              <tr>
                <td>
                  <strong>
                    <Truck size={16} style={{ display: 'inline', marginRight: '0.25rem', color: '#6f42c1' }} />
                    Fournisseurs
                  </strong>
                </td>
                <td>Liste complète des fournisseurs</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExport('fournisseurs', 'csv')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <Download size={14} />
                      CSV
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleExport('fournisseurs', 'pdf')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <FileText size={14} />
                      PDF
                    </button>
                  </div>
                </td>
              </tr>

              {/* Tags */}
              <tr>
                <td>
                  <strong>
                    <TagIcon size={16} style={{ display: 'inline', marginRight: '0.25rem', color: '#fd7e14' }} />
                    Tags
                  </strong>
                </td>
                <td>Liste complète des tags</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExport('tags', 'csv')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <Download size={14} />
                      CSV
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleExport('tags', 'pdf')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <FileText size={14} />
                      PDF
                    </button>
                  </div>
                </td>
              </tr>

              {/* Emplacements */}
              <tr>
                <td>
                  <strong>
                    <MapPin size={16} style={{ display: 'inline', marginRight: '0.25rem', color: '#17a2b8' }} />
                    Emplacements
                  </strong>
                </td>
                <td>Liste complète des emplacements</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExport('emplacements', 'csv')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <Download size={14} />
                      CSV
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleExport('emplacements', 'pdf')}
                      disabled={exportLoading}
                      style={{ minWidth: '90px' }}
                    >
                      <FileText size={14} />
                      PDF
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

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
