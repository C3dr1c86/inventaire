/**
 * Page de scan de QR code pour emplacements
 * Permet de scanner un QR code d'emplacement et d'afficher les articles qu'il contient
 * Supporte 2 modes : caméra (html5-qrcode) et lecteur physique (clavier)
 */

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import QRScanner from '../components/common/QRScanner'
import { getEmplacement, getArticlesByEmplacement } from '../services/emplacementService'
import { getArticles } from '../services/articleService'
import { MapPin, Package, AlertCircle, ArrowLeft, Camera, Keyboard, Barcode, Tag, Download } from 'lucide-react'
import { toast } from 'react-toastify'

// Classe CSS pour la couleur du taux de remplissage
const getRemplissageClass = (pct) => {
  if (!pct || pct <= 0) return ''
  if (pct > 90) return 'cell-danger'
  if (pct > 70) return 'cell-warning'
  return 'cell-success'
}

function ScanQRCode() {
  const navigate = useNavigate()
  const [scanType, setScanType] = useState(null) // 'emplacement' ou 'article'
  const [emplacementId, setEmplacementId] = useState(null)
  const [articleSku, setArticleSku] = useState(null)
  const [showScanner, setShowScanner] = useState(true)
  const [scanMode, setScanMode] = useState('reader') // 'camera' ou 'reader'
  const [manualInput, setManualInput] = useState('')
  const inputRef = useRef(null)

  // Exporter les articles de l'emplacement en CSV
  const handleExportCSV = () => {
    if (!articles || articles.length === 0) {
      toast.warning('Aucun article à exporter')
      return
    }

    try {
      const headers = ['Nom', 'SKU', 'Quantité', 'Quantité min', 'Prix unitaire (€)', 'Valeur totale (€)', 'Catégorie', 'Description']

      const rows = articles.map(article => [
        article.nom || '',
        article.sku || '',
        article.quantite || 0,
        article.quantite_min || 0,
        article.prix_unitaire?.toFixed(2) || '0.00',
        (article.quantite * article.prix_unitaire).toFixed(2) || '0.00',
        article.categorie?.nom_complet || article.categorie?.nom || '',
        (article.description || '').replace(/"/g, '""')
      ])

      let csv = headers.map(h => `"${h}"`).join(',') + '\n'
      rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n'
      })

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const emplacementCode = emplacement?.code || 'emplacement'
      const date = new Date().toISOString().split('T')[0]
      link.setAttribute('download', `articles_${emplacementCode}_${date}.csv`)

      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`✅ Export CSV réussi : ${articles.length} article(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      toast.error('Erreur lors de l\'export CSV')
    }
  }

  // Récupérer les détails de l'emplacement scanné
  const { data: emplacement, isLoading: emplacementLoading } = useQuery({
    queryKey: ['emplacement', emplacementId],
    queryFn: () => getEmplacement(emplacementId),
    enabled: !!emplacementId
  })

  // Récupérer les articles de l'emplacement
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['articles-emplacement', emplacementId],
    queryFn: () => getArticlesByEmplacement(emplacementId),
    enabled: !!emplacementId && scanType === 'emplacement'
  })

  // Récupérer l'article par SKU
  const { data: articleData, isLoading: articleLoading } = useQuery({
    queryKey: ['article-by-sku', articleSku],
    queryFn: async () => {
      const response = await getArticles({ search: articleSku, limit: 1 })
      return response.items && response.items.length > 0 ? response.items[0] : null
    },
    enabled: !!articleSku && scanType === 'article'
  })

  // Gérer le résultat du scan
  const handleScan = (decodedText) => {
    try {
      const cleanText = decodedText.trim()

      if (cleanText.startsWith('emplacement:')) {
        const parts = cleanText.split(':')

        if (!parts[1]) {
          toast.error('QR code d\'emplacement invalide')
          setShowScanner(true)
          return
        }

        const id = parseInt(parts[1])
        if (isNaN(id)) {
          toast.error('ID d\'emplacement incorrect')
          setShowScanner(true)
          return
        }

        setScanType('emplacement')
        setEmplacementId(id)
        setArticleSku(null)
        setShowScanner(false)
        toast.success('📍 QR code d\'emplacement scanné !')
      } else {
        setScanType('article')
        setArticleSku(cleanText)
        setEmplacementId(null)
        setShowScanner(false)
        toast.success('📦 Code-barres d\'article scanné !')
      }
    } catch (error) {
      console.error('Erreur lors du traitement du code:', error)
      toast.error('Erreur lors de la lecture du code')
      setShowScanner(true)
    }
  }

  const handleError = (errorMessage) => {
    toast.error(errorMessage)
  }

  const handleRescan = () => {
    setScanType(null)
    setEmplacementId(null)
    setArticleSku(null)
    setShowScanner(true)
    setManualInput('')
    if (scanMode === 'reader' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleViewArticle = (articleId) => {
    navigate(`/articles?id=${articleId}`)
  }

  const handleScanModeChange = (mode) => {
    setScanMode(mode)
    setManualInput('')
    if (mode === 'reader' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualInput.trim()) {
      handleScan(manualInput.trim())
      setManualInput('')
    }
  }

  useEffect(() => {
    if (scanMode === 'reader' && showScanner && inputRef.current) {
      inputRef.current.focus()
    }
  }, [scanMode, showScanner])

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Camera size={32} />
            Scanner un QR Code
          </h1>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Retour
          </button>
        </div>
      </div>

      {/* Zone de scan */}
      {showScanner && (
        <div className="scan-container">
          {/* Toggle mode de scan */}
          <div className="card">
            <div className="card-body">
              <h3 className="card-title">Méthode de scan</h3>
              <div className="scan-mode-btns">
                <button
                  className={`btn ${scanMode === 'reader' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleScanModeChange('reader')}
                >
                  <Keyboard size={20} />
                  Lecteur physique
                </button>
                <button
                  className={`btn ${scanMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleScanModeChange('camera')}
                >
                  <Camera size={20} />
                  Caméra
                </button>
              </div>
              <p className="text-muted">
                {scanMode === 'reader'
                  ? '📖 Utilisez votre lecteur de QR code (ou saisissez manuellement le code)'
                  : '📷 Utilisez la caméra de votre appareil'}
              </p>
            </div>
          </div>

          {/* Mode lecteur physique */}
          {scanMode === 'reader' && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Keyboard size={24} />
                  Scan avec lecteur physique
                </span>
              </div>
              <div className="card-body">
                <form onSubmit={handleManualSubmit}>
                  <div className="form-group">
                    <label htmlFor="qr-input" className="form-label">
                      Scannez ou saisissez le code QR
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      id="qr-input"
                      className="form-control scan-reader-input"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="emplacement:1:CODE-ZONE-A1"
                      autoFocus
                    />
                    <span className="form-helper">
                      💡 Positionnez le curseur dans ce champ et scannez le QR code avec votre lecteur
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg btn-block scan-submit-btn"
                    disabled={!manualInput.trim()}
                  >
                    Valider
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Mode caméra */}
          {scanMode === 'camera' && (
            <QRScanner
              onScan={handleScan}
              onError={handleError}
              onClose={() => navigate(-1)}
            />
          )}

          {/* Instructions */}
          <div className="card">
            <div className="card-body">
              <h3 className="card-title">
                <AlertCircle size={20} />
                Instructions
              </h3>
              <ul>
                <li>Autorisez l&apos;accès à la caméra lorsque demandé</li>
                <li>Positionnez le QR code d&apos;un emplacement devant la caméra</li>
                <li>Attendez que le scan se fasse automatiquement</li>
                <li>La liste des articles de l&apos;emplacement s&apos;affichera</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Résultat scan emplacement */}
      {!showScanner && emplacementId && (
        <div>
          {emplacementLoading ? (
            <div className="loading-card">
              <div className="spinner-lg" />
            </div>
          ) : emplacement ? (
            <div>
              {/* Informations sur l'emplacement */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">
                    <MapPin size={24} />
                    {emplacement.niveau === 0 && '🏢'}
                    {emplacement.niveau === 1 && '📚'}
                    {emplacement.niveau === 2 && '📦'}
                    {emplacement.code}
                  </span>
                </div>
                <div className="card-body">
                  <div className="scan-info-grid">
                    <div>
                      <p className="scan-info-label">Hiérarchie</p>
                      <p className="scan-info-value">{emplacement.code_complet || emplacement.code}</p>
                    </div>
                    {emplacement.description && (
                      <div>
                        <p className="scan-info-label">Description</p>
                        <p className="scan-info-value">{emplacement.description}</p>
                      </div>
                    )}
                    {emplacement.capacite_max !== null && (
                      <div>
                        <p className="scan-info-label">Capacité</p>
                        <p className="scan-info-value">
                          {emplacement.quantite_utilisee} / {emplacement.capacite_max}
                          {' '}
                          <span className={getRemplissageClass(emplacement.pourcentage_remplissage)}>
                            ({emplacement.pourcentage_remplissage?.toFixed(0) || 0}%)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Liste des articles */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">
                    <Package size={20} />
                    Articles dans cet emplacement
                    {articles && (
                      <span className="badge badge-primary">{articles.length}</span>
                    )}
                  </span>
                </div>
                <div className="card-body">
                  {articlesLoading ? (
                    <div className="loading-card">
                      <div className="spinner-lg" />
                    </div>
                  ) : articles && articles.length > 0 ? (
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Nom</th>
                            <th>SKU</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            <th>Valeur totale</th>
                            <th>Catégorie</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {articles.map(article => (
                            <tr key={article.id}>
                              <td data-label="Nom">
                                <strong>{article.nom}</strong>
                                {article.description && (
                                  <div className="text-muted">
                                    {article.description.substring(0, 60)}{article.description.length > 60 ? '...' : ''}
                                  </div>
                                )}
                              </td>
                              <td data-label="SKU">
                                {article.sku ? (
                                  <code className="sku-code">{article.sku}</code>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td data-label="Quantité">
                                <span className={article.quantite <= article.quantite_min ? 'cell-danger' : 'cell-success'}>
                                  {article.quantite}
                                </span>
                                {article.quantite <= article.quantite_min && (
                                  <span> ⚠️</span>
                                )}
                              </td>
                              <td data-label="Prix unitaire">
                                {article.prix_unitaire?.toFixed(2)} €
                              </td>
                              <td data-label="Valeur totale">
                                <strong>{(article.quantite * article.prix_unitaire).toFixed(2)} €</strong>
                              </td>
                              <td data-label="Catégorie">
                                {article.categorie?.nom_complet || article.categorie?.nom || (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td data-label="Actions">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleViewArticle(article.id)}
                                  title="Voir les détails"
                                >
                                  Voir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Package size={48} className="empty-state-icon" />
                      <p className="empty-state-title">Aucun article dans cet emplacement</p>
                      <p className="empty-state-description">Cet emplacement est vide pour le moment</p>
                    </div>
                  )}

                  <div className="scan-result-actions">
                    {articles && articles.length > 0 && (
                      <button
                        className="btn btn-success"
                        onClick={handleExportCSV}
                        title="Exporter la liste des articles en CSV"
                      >
                        <Download size={18} />
                        Exporter CSV
                      </button>
                    )}
                    <button className="btn btn-primary" onClick={handleRescan}>
                      <Camera size={18} />
                      Scanner un autre QR code
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/emplacements')}>
                      <MapPin size={18} />
                      Voir tous les emplacements
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <AlertCircle size={48} className="empty-state-icon icon-danger" />
                <p className="empty-state-title text-danger">Emplacement introuvable</p>
                <p className="empty-state-description">
                  L&apos;emplacement scanné n&apos;existe pas ou a été supprimé.
                </p>
                <button className="btn btn-primary" onClick={handleRescan}>
                  <Camera size={18} />
                  Rescanner
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Résultat scan article */}
      {!showScanner && articleSku && (
        <div>
          {articleLoading ? (
            <div className="loading-card">
              <div className="spinner-lg" />
            </div>
          ) : articleData ? (
            <div>
              {/* Informations sur l'article */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">
                    <Package size={24} />
                    📦 {articleData.nom}
                  </span>
                  {articleData.sku && (
                    <span className="text-muted">
                      <Barcode size={16} />
                      SKU: {articleData.sku}
                    </span>
                  )}
                </div>

                <div className="card-body">
                  {/* Grille d'informations */}
                  <div className="scan-info-grid">
                    <div>
                      <p className="scan-info-label">Quantité en stock</p>
                      <p className={`scan-info-value-lg ${articleData.quantite < articleData.quantite_min ? 'text-danger' : 'text-success'}`}>
                        {articleData.quantite}
                        {articleData.quantite < articleData.quantite_min && (
                          <span className="text-danger"> ⚠️ Stock bas</span>
                        )}
                      </p>
                      <p className="text-muted">Seuil min: {articleData.quantite_min}</p>
                    </div>

                    <div>
                      <p className="scan-info-label">Prix unitaire</p>
                      <p className="scan-info-value-lg">
                        {articleData.prix_unitaire.toFixed(2)} €
                      </p>
                      <p className="text-muted">
                        Valeur totale: {(articleData.quantite * articleData.prix_unitaire).toFixed(2)} €
                      </p>
                    </div>

                    <div>
                      <p className="scan-info-label">Catégorie</p>
                      <p className="scan-info-value">
                        {articleData.categorie ? (
                          <>
                            📁 {articleData.categorie.parent ? `${articleData.categorie.parent.nom} > ` : ''}
                            {articleData.categorie.nom}
                          </>
                        ) : (
                          <span className="text-muted">Non définie</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="scan-info-label">Emplacement</p>
                      <p className="scan-info-value">
                        {articleData.emplacement ? (
                          <>
                            📍 {articleData.emplacement.code}
                            <span className="text-muted" style={{ display: 'block' }}>
                              {articleData.emplacement.code_complet}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted">Non défini</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {articleData.description && (
                    <div className="scan-info-section">
                      <p className="scan-info-label">Description</p>
                      <p className="scan-info-value">{articleData.description}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {articleData.tags && articleData.tags.length > 0 && (
                    <div className="scan-info-section">
                      <p className="scan-info-label">Tags</p>
                      <div className="action-buttons">
                        {articleData.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="tag-pill"
                            style={{ backgroundColor: tag.couleur || 'var(--color-text-secondary)' }}
                          >
                            <Tag size={14} />
                            {tag.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photo */}
                  {articleData.photo_url && (
                    <div className="scan-info-section">
                      <p className="scan-info-label">Photo</p>
                      <div className="scan-photo-wrapper">
                        <img src={articleData.photo_url} alt={articleData.nom} />
                      </div>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div className="scan-result-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/articles?id=${articleData.id}`)}
                    >
                      <Package size={18} />
                      Voir les détails
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/mouvements?article_id=${articleData.id}`)}
                    >
                      Historique des mouvements
                    </button>
                    <button className="btn btn-secondary" onClick={handleRescan}>
                      <Camera size={18} />
                      Scanner un autre code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <AlertCircle size={48} className="empty-state-icon icon-danger" />
                <p className="empty-state-title text-danger">Article introuvable</p>
                <p className="empty-state-description">
                  Aucun article trouvé avec le SKU &quot;{articleSku}&quot;.
                </p>
                <button className="btn btn-primary" onClick={handleRescan}>
                  <Camera size={18} />
                  Rescanner
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ScanQRCode
