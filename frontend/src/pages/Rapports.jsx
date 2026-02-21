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
  exportEmplacementsData,
  exportEtiquettesDymo,
  exportEtiquettesDymoEmplacements
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
      if (type === 'fournisseurs') {
        await exportFournisseurs(format)
      } else if (type === 'tags') {
        await exportTags(format)
      } else if (type === 'emplacements') {
        await exportEmplacementsData(format)
      } else if (format === 'csv') {
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
    setSelectedArticles(prev =>
      prev.includes(articleId) ? prev.filter(id => id !== articleId) : [...prev, articleId]
    )
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

  const handleExportDymo = async () => {
    if (selectedArticles.length === 0) {
      toast.error('Veuillez sélectionner au moins un article')
      return
    }
    try {
      setExportLoading(true)
      await exportEtiquettesDymo(selectedArticles)
      toast.success(`CSV DYMO généré avec ${selectedArticles.length} article(s)`)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la génération du CSV DYMO')
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportDymoEmplacements = async () => {
    if (selectedEmplacements.length === 0) {
      toast.error('Veuillez sélectionner au moins un emplacement')
      return
    }
    try {
      setExportLoading(true)
      await exportEtiquettesDymoEmplacements(selectedEmplacements)
      toast.success(`CSV DYMO généré avec ${selectedEmplacements.length} emplacement(s)`)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la génération du CSV DYMO')
    } finally {
      setExportLoading(false)
    }
  }

  // Gérer la sélection d'emplacements pour QR codes
  const handleToggleEmplacement = (emplacementId) => {
    setSelectedEmplacements(prev =>
      prev.includes(emplacementId) ? prev.filter(id => id !== emplacementId) : [...prev, emplacementId]
    )
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
      <div className="loading-page">
        <div className="spinner-lg" />
        <span>Chargement des rapports...</span>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapports</h1>
          <p className="page-subtitle">Statistiques et exports de vos données</p>
        </div>
      </div>

      {/* Valeur totale du stock */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Valeur Totale du Stock</span>
        </div>
        <div className="card-body">
          <div className="rapports-value-display">
            {valeurTotale?.valeur_totale.toFixed(2)} €
          </div>
          <p className="text-muted">
            Basé sur {valeurTotale?.nombre_articles} article(s)
          </p>

          {valeurTotale?.details_par_categorie && valeurTotale.details_par_categorie.length > 0 && (
            <div className="rapports-value-section">
              <h3 className="rapports-section-title">Détails par catégorie</h3>
              <div className="table-wrapper">
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
            </div>
          )}
        </div>
      </div>

      {/* Section étiquettes personnalisées */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Barcode size={18} />
            Étiquettes Personnalisées
          </span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowBarcodeSection(!showBarcodeSection)}
          >
            {showBarcodeSection ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        {showBarcodeSection && (
          <div className="card-body">
            {/* Toggle type d'étiquettes */}
            <div className="label-toggle">
              <button
                className={`btn ${labelType === 'articles' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setLabelType('articles')
                  setSelectedArticles([])
                }}
              >
                <Barcode size={16} />
                Articles (Codes-barres)
              </button>
              <button
                className={`btn ${labelType === 'emplacements' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setLabelType('emplacements')
                  setSelectedEmplacements([])
                }}
              >
                <QrCode size={16} />
                Emplacements (QR codes)
              </button>
            </div>

            <p className="text-muted">
              {labelType === 'articles'
                ? 'Sélectionnez les articles pour lesquels générer des codes-barres à imprimer.'
                : 'Sélectionnez les emplacements pour lesquels générer des QR codes à imprimer.'}
            </p>

            {/* Affichage selon le type — Articles */}
            {labelType === 'articles' && articlesData?.items ? (
              <>
                <div className="selection-controls">
                  <button className="btn btn-sm btn-secondary" onClick={handleSelectAll}>
                    {selectedArticles.length === articlesData.items.filter(a => a.sku).length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                  <span className="selection-count">
                    {selectedArticles.length} article(s) sélectionné(s)
                  </span>
                </div>

                <div className="selection-scroll">
                  {articlesData.items.length === 0 ? (
                    <p className="text-muted" style={{ textAlign: 'center' }}>
                      Aucun article disponible
                    </p>
                  ) : (
                    <div className="selection-list">
                      {articlesData.items.map(article => (
                        <label
                          key={article.id}
                          className={`selection-item${selectedArticles.includes(article.id) ? ' selected' : ''}${!article.sku ? ' disabled' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedArticles.includes(article.id)}
                            onChange={() => handleToggleArticle(article.id)}
                            disabled={!article.sku}
                          />
                          <div className="selection-item-info">
                            <div className="selection-item-name">{article.nom}</div>
                            <div className="selection-item-meta">
                              SKU: {article.sku || <em>Pas de SKU</em>} &nbsp;·&nbsp;
                              Qté: {article.quantite} &nbsp;·&nbsp;
                              {article.categorie?.nom || 'Sans catégorie'}
                            </div>
                          </div>
                          {selectedArticles.includes(article.id)
                            ? <CheckSquare size={18} className="selection-check-icon" />
                            : article.sku
                              ? <Square size={18} className="selection-uncheck-icon" />
                              : null
                          }
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="export-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={handleExportDymo}
                    disabled={selectedArticles.length === 0 || exportLoading}
                    title="Exporter un CSV compatible DYMO Label Software"
                  >
                    <Download size={16} />
                    {exportLoading ? 'Génération...' : `CSV DYMO (${selectedArticles.length})`}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleExportBarcodes}
                    disabled={selectedArticles.length === 0 || exportLoading}
                  >
                    <Barcode size={16} />
                    {exportLoading ? 'Génération...' : `Générer PDF (${selectedArticles.length})`}
                  </button>
                </div>

                <p className="export-hint">
                  💡 Le PDF contiendra 12 étiquettes par page (2 colonnes × 6 lignes) prêtes à découper
                  &nbsp;·&nbsp; Le CSV DYMO est importable directement dans DYMO Connect / DYMO Label Software
                </p>
              </>
            ) : labelType === 'emplacements' && emplacementsData ? (
              <>
                <div className="selection-controls">
                  <button className="btn btn-sm btn-secondary" onClick={handleSelectAllEmplacements}>
                    {selectedEmplacements.length === emplacementsData.length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                  <span className="selection-count">
                    {selectedEmplacements.length} emplacement(s) sélectionné(s)
                  </span>
                </div>

                <div className="selection-scroll">
                  {emplacementsData.length === 0 ? (
                    <p className="text-muted" style={{ textAlign: 'center' }}>
                      Aucun emplacement disponible
                    </p>
                  ) : (
                    <div className="selection-list">
                      {emplacementsData.map(emplacement => (
                        <label
                          key={emplacement.id}
                          className={`selection-item${selectedEmplacements.includes(emplacement.id) ? ' selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmplacements.includes(emplacement.id)}
                            onChange={() => handleToggleEmplacement(emplacement.id)}
                          />
                          <div className="selection-item-info">
                            <div className="selection-item-name">
                              {emplacement.niveau === 0 && '🏢'}
                              {emplacement.niveau === 1 && '📚'}
                              {emplacement.niveau === 2 && '📦'}
                              {' '}{emplacement.code}
                            </div>
                            <div className="selection-item-meta">
                              {emplacement.code_complet && emplacement.code_complet !== emplacement.code && (
                                <span>{emplacement.code_complet} &nbsp;·&nbsp; </span>
                              )}
                              {emplacement.description || <em>Pas de description</em>}
                              {emplacement.capacite_max !== null && (
                                <span> &nbsp;·&nbsp; Capacité: {emplacement.quantite_utilisee}/{emplacement.capacite_max}</span>
                              )}
                            </div>
                          </div>
                          {selectedEmplacements.includes(emplacement.id)
                            ? <CheckSquare size={18} className="selection-check-icon" />
                            : <Square size={18} className="selection-uncheck-icon" />
                          }
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="export-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={handleExportDymoEmplacements}
                    disabled={selectedEmplacements.length === 0 || exportLoading}
                    title="Exporter un CSV compatible DYMO Label Software"
                  >
                    <Download size={16} />
                    {exportLoading ? 'Génération...' : `CSV DYMO (${selectedEmplacements.length})`}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleExportQRCodes}
                    disabled={selectedEmplacements.length === 0 || exportLoading}
                  >
                    <QrCode size={16} />
                    {exportLoading ? 'Génération...' : `Générer PDF (${selectedEmplacements.length})`}
                  </button>
                </div>

                <p className="export-hint">
                  💡 Le PDF contiendra 6 étiquettes par page (2 colonnes × 3 lignes) prêtes à découper
                  &nbsp;·&nbsp; Le CSV DYMO est importable directement dans DYMO Connect / DYMO Label Software
                </p>
              </>
            ) : (
              <div className="loading-page" style={{ minHeight: '120px' }}>
                <div className="spinner-sm" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Articles en stock bas */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <AlertTriangle size={18} />
            Articles en Stock Bas
          </span>
        </div>
        <div className="card-body">
          {stockBas && stockBas.articles && stockBas.articles.length > 0 ? (
            <>
              <div className="alert alert-warning">
                <strong>{stockBas.total}</strong> article(s) ont un stock inférieur au seuil minimum.
              </div>
              <div className="table-wrapper">
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
                        <td data-label="Article"><strong>{article.nom}</strong></td>
                        <td data-label="SKU">{article.sku || '-'}</td>
                        <td data-label="Stock actuel" className="cell-danger">
                          {article.quantite}
                        </td>
                        <td data-label="Stock minimum">{article.quantite_min}</td>
                        <td data-label="Écart" className="cell-danger">
                          {article.quantite - article.quantite_min}
                        </td>
                        <td data-label="Catégorie">{article.categorie?.nom || 'Sans catégorie'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        <div className="card-header">
          <span className="card-title">
            <Download size={18} />
            Exports
          </span>
        </div>
        <div className="card-body">
          <p className="text-muted">
            Téléchargez vos données au format CSV ou PDF.
          </p>

          <div className="table-wrapper" style={{ marginTop: 'var(--space-4)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type de données</th>
                  <th>Description</th>
                  <th>Formats disponibles</th>
                </tr>
              </thead>
              <tbody>
                {/* Articles */}
                <tr>
                  <td><strong>📦 Articles</strong></td>
                  <td>Liste complète des articles</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExport('articles', 'csv')}
                        disabled={exportLoading}
                      >
                        <Download size={13} />
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
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExport('mouvements', 'csv')}
                        disabled={exportLoading}
                      >
                        <Download size={13} />
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
                    <div className="action-buttons">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleExport('inventaire', 'pdf')}
                        disabled={exportLoading}
                      >
                        <FileText size={13} />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Stock bas */}
                <tr>
                  <td>
                    <strong>
                      <AlertTriangle size={14} className="icon-danger" />
                      {' '}Stock bas
                    </strong>
                  </td>
                  <td>Alerte des articles en stock bas</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleExport('stock-bas', 'pdf')}
                        disabled={exportLoading}
                      >
                        <FileText size={13} />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Séparateur */}
                <tr className="table-separator-row">
                  <td colSpan={3} className="table-separator-td">
                    📚 Données de référence
                  </td>
                </tr>

                {/* Fournisseurs */}
                <tr>
                  <td>
                    <strong>
                      <Truck size={14} className="icon-purple" />
                      {' '}Fournisseurs
                    </strong>
                  </td>
                  <td>Liste complète des fournisseurs</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExport('fournisseurs', 'csv')}
                        disabled={exportLoading}
                      >
                        <Download size={13} />
                        CSV
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleExport('fournisseurs', 'pdf')}
                        disabled={exportLoading}
                      >
                        <FileText size={13} />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Tags */}
                <tr>
                  <td>
                    <strong>
                      <TagIcon size={14} className="icon-warning" />
                      {' '}Tags
                    </strong>
                  </td>
                  <td>Liste complète des tags</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExport('tags', 'csv')}
                        disabled={exportLoading}
                      >
                        <Download size={13} />
                        CSV
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleExport('tags', 'pdf')}
                        disabled={exportLoading}
                      >
                        <FileText size={13} />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Emplacements */}
                <tr>
                  <td>
                    <strong>
                      <MapPin size={14} className="icon-info" />
                      {' '}Emplacements
                    </strong>
                  </td>
                  <td>Liste complète des emplacements</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExport('emplacements', 'csv')}
                        disabled={exportLoading}
                      >
                        <Download size={13} />
                        CSV
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleExport('emplacements', 'pdf')}
                        disabled={exportLoading}
                      >
                        <FileText size={13} />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {exportLoading && (
            <div className="loading-page" style={{ minHeight: '80px' }}>
              <div className="spinner-sm" />
              <span className="text-muted">Génération de l'export en cours...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Rapports
