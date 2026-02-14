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
import { MapPin, Package, AlertCircle, ArrowLeft, Camera, Keyboard, Barcode, Tag } from 'lucide-react'
import { toast } from 'react-toastify'

function ScanQRCode() {
  const navigate = useNavigate()
  const [scanType, setScanType] = useState(null) // 'emplacement' ou 'article'
  const [emplacementId, setEmplacementId] = useState(null)
  const [articleSku, setArticleSku] = useState(null)
  const [showScanner, setShowScanner] = useState(true)
  const [scanMode, setScanMode] = useState('reader') // 'camera' ou 'reader'
  const [manualInput, setManualInput] = useState('')
  const inputRef = useRef(null)

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

  // Gérer le résultat du scan (détection automatique emplacement ou article)
  const handleScan = (decodedText) => {
    try {
      // Nettoyer le texte scanné
      const cleanText = decodedText.trim()

      // Détecter si c'est un QR code d'emplacement (format: "emplacement:ID:CODE")
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

        // setScannedData(cleanText) - Variable removed as it was not used
        setScanType('emplacement')
        setEmplacementId(id)
        setArticleSku(null)
        setShowScanner(false)
        toast.success('📍 QR code d\'emplacement scanné !')
      }
      // Sinon, considérer que c'est un code-barres d'article (SKU)
      else {
        // setScannedData(cleanText) - Variable removed as it was not used
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

  // Gérer les erreurs de scan
  const handleError = (errorMessage) => {
    toast.error(errorMessage)
  }

  // Réinitialiser et rescanner
  const handleRescan = () => {
    // setScannedData(null) - Variable removed as it was not used
    setScanType(null)
    setEmplacementId(null)
    setArticleSku(null)
    setShowScanner(true)
    setManualInput('')
    if (scanMode === 'reader' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Naviguer vers un article
  const handleViewArticle = (articleId) => {
    navigate(`/articles?id=${articleId}`)
  }

  // Gérer le changement de mode de scan
  const handleScanModeChange = (mode) => {
    setScanMode(mode)
    setManualInput('')
    if (mode === 'reader' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Gérer la soumission du formulaire (lecteur physique ou saisie manuelle)
  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualInput.trim()) {
      handleScan(manualInput.trim())
      setManualInput('')
    }
  }

  // Auto-focus sur le champ input en mode lecteur
  useEffect(() => {
    if (scanMode === 'reader' && showScanner && inputRef.current) {
      inputRef.current.focus()
    }
  }, [scanMode, showScanner])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>
          <Camera size={32} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Scanner un QR Code
        </h1>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Retour
        </button>
      </div>

      {showScanner && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Toggle mode de scan */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', color: '#495057' }}>
                Méthode de scan
              </h3>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  className={`btn ${scanMode === 'reader' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleScanModeChange('reader')}
                  style={{ flex: 1, gap: '0.5rem' }}
                >
                  <Keyboard size={20} />
                  Lecteur physique
                </button>
                <button
                  className={`btn ${scanMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleScanModeChange('camera')}
                  style={{ flex: 1, gap: '0.5rem' }}
                >
                  <Camera size={20} />
                  Caméra
                </button>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: 0 }}>
                {scanMode === 'reader'
                  ? '📖 Utilisez votre lecteur de QR code (ou saisissez manuellement le code)'
                  : '📷 Utilisez la caméra de votre appareil'}
              </p>
            </div>
          </div>

          {/* Mode lecteur physique */}
          {scanMode === 'reader' && (
            <div className="card">
              <div className="card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Keyboard size={24} />
                  Scan avec lecteur physique
                </h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleManualSubmit}>
                  <div className="form-group">
                    <label htmlFor="qr-input" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                      Scannez ou saisissez le code QR
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      id="qr-input"
                      className="form-control"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="emplacement:1:CODE-ZONE-A1"
                      style={{
                        fontSize: '1.125rem',
                        padding: '0.75rem',
                        fontFamily: 'monospace',
                        backgroundColor: '#f8f9fa',
                        border: '2px solid #667eea'
                      }}
                      autoFocus
                    />
                    <small style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
                      💡 Positionnez le curseur dans ce champ et scannez le QR code avec votre lecteur
                    </small>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={!manualInput.trim()}
                    style={{ width: '100%', marginTop: '1rem' }}
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

          <div className="card" style={{ marginTop: '2rem' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                <AlertCircle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Instructions
              </h3>
              <ul style={{ paddingLeft: '1.5rem', color: '#666' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  Autorisez l&apos;accès à la caméra lorsque demandé
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Positionnez le QR code d&apos;un emplacement devant la caméra
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Attendez que le scan se fasse automatiquement
                </li>
                <li>
                  La liste des articles de l&apos;emplacement s&apos;affichera
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {!showScanner && emplacementId && (
        <div>
          {emplacementLoading ? (
            <div className="loader"></div>
          ) : emplacement ? (
            <div>
              {/* Informations sur l'emplacement */}
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={24} />
                    {emplacement.niveau === 0 && '🏢'}
                    {emplacement.niveau === 1 && '📚'}
                    {emplacement.niveau === 2 && '📦'}
                    {emplacement.code}
                  </h2>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <strong style={{ color: '#667eea' }}>Hiérarchie :</strong>
                      <p style={{ margin: '0.25rem 0 0 0' }}>{emplacement.code_complet || emplacement.code}</p>
                    </div>
                    {emplacement.description && (
                      <div>
                        <strong style={{ color: '#667eea' }}>Description :</strong>
                        <p style={{ margin: '0.25rem 0 0 0' }}>{emplacement.description}</p>
                      </div>
                    )}
                    {emplacement.capacite_max !== null && (
                      <div>
                        <strong style={{ color: '#667eea' }}>Capacité :</strong>
                        <p style={{ margin: '0.25rem 0 0 0' }}>
                          {emplacement.quantite_utilisee} / {emplacement.capacite_max}
                          {' '}
                          <span style={{
                            color: emplacement.pourcentage_remplissage > 90 ? '#dc3545' :
                                   emplacement.pourcentage_remplissage > 70 ? '#ffc107' : '#28a745'
                          }}>
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
                  <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={20} />
                    Articles dans cet emplacement
                    {articles && (
                      <span style={{
                        background: '#667eea',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: 'normal'
                      }}>
                        {articles.length}
                      </span>
                    )}
                  </h2>
                </div>
                <div className="card-body">
                  {articlesLoading ? (
                    <div className="loader"></div>
                  ) : articles && articles.length > 0 ? (
                    <div className="table-responsive">
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
                                  <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                                    {article.description.substring(0, 60)}{article.description.length > 60 ? '...' : ''}
                                  </div>
                                )}
                              </td>
                              <td data-label="SKU">
                                {article.sku ? (
                                  <code style={{
                                    background: '#f8f9fa',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem'
                                  }}>
                                    {article.sku}
                                  </code>
                                ) : (
                                  <span style={{ color: '#999' }}>-</span>
                                )}
                              </td>
                              <td data-label="Quantité">
                                <span style={{
                                  fontWeight: '500',
                                  color: article.quantite <= article.quantite_min ? '#dc3545' : '#28a745'
                                }}>
                                  {article.quantite}
                                </span>
                                {article.quantite <= article.quantite_min && (
                                  <span style={{ marginLeft: '0.5rem', color: '#dc3545' }}>⚠️</span>
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
                                  <span style={{ color: '#999' }}>-</span>
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
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem 1rem',
                      color: '#666',
                      background: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      <Package size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Aucun article dans cet emplacement</p>
                      <p style={{ fontSize: '0.875rem', margin: 0 }}>
                        Cet emplacement est vide pour le moment
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleRescan}
                    >
                      <Camera size={18} />
                      Scanner un autre QR code
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate('/emplacements')}
                    >
                      <MapPin size={18} />
                      Voir tous les emplacements
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <AlertCircle size={48} style={{ color: '#dc3545', marginBottom: '1rem' }} />
                <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>Emplacement introuvable</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  L&apos;emplacement scanné n&apos;existe pas ou a été supprimé.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleRescan}
                >
                  <Camera size={18} />
                  Rescanner
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affichage des informations de l'article scanné */}
      {!showScanner && articleSku && (
        <div>
          {articleLoading ? (
            <div className="loader"></div>
          ) : articleData ? (
            <div>
              {/* Informations sur l'article */}
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white' }}>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={24} />
                    📦 {articleData.nom}
                  </h2>
                  {articleData.sku && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                      <Barcode size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                      SKU: {articleData.sku}
                    </p>
                  )}
                </div>

                <div className="card-body">
                  {/* Grille d'informations */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', fontWeight: 'normal' }}>
                        Quantité en stock
                      </h4>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: articleData.quantite < articleData.quantite_min ? '#dc3545' : '#28a745' }}>
                        {articleData.quantite}
                        {articleData.quantite < articleData.quantite_min && (
                          <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: '#dc3545' }}>
                            ⚠️ Stock bas
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: '0.25rem 0 0' }}>
                        Seuil min: {articleData.quantite_min}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', fontWeight: 'normal' }}>
                        Prix unitaire
                      </h4>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#495057' }}>
                        {articleData.prix_unitaire.toFixed(2)} €
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: '0.25rem 0 0' }}>
                        Valeur totale: {(articleData.quantite * articleData.prix_unitaire).toFixed(2)} €
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', fontWeight: 'normal' }}>
                        Catégorie
                      </h4>
                      <p style={{ fontSize: '1rem', margin: 0, color: '#495057' }}>
                        {articleData.categorie ? (
                          <>
                            📁 {articleData.categorie.parent ? `${articleData.categorie.parent.nom} > ` : ''}
                            {articleData.categorie.nom}
                          </>
                        ) : (
                          <span style={{ color: '#999' }}>Non définie</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', fontWeight: 'normal' }}>
                        Emplacement
                      </h4>
                      <p style={{ fontSize: '1rem', margin: 0, color: '#495057' }}>
                        {articleData.emplacement ? (
                          <>
                            📍 {articleData.emplacement.code}
                            <span style={{ fontSize: '0.75rem', display: 'block', color: '#6c757d', marginTop: '0.25rem' }}>
                              {articleData.emplacement.code_complet}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: '#999' }}>Non défini</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {articleData.description && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', fontWeight: 'normal' }}>
                        Description
                      </h4>
                      <p style={{ fontSize: '1rem', margin: 0, color: '#495057', lineHeight: 1.6 }}>
                        {articleData.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {articleData.tags && articleData.tags.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', fontWeight: 'normal' }}>
                        Tags
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {articleData.tags.map((tag) => (
                          <span
                            key={tag.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              backgroundColor: tag.couleur || '#6c757d',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            <Tag size={14} />
                            {tag.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {articleData.photo_url && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem', fontWeight: 'normal' }}>
                        Photo
                      </h4>
                      <div style={{
                        display: 'inline-block',
                        maxWidth: '300px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #dee2e6'
                      }}>
                        <img
                          src={articleData.photo_url}
                          alt={articleData.nom}
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
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
                    <button
                      className="btn btn-secondary"
                      onClick={handleRescan}
                    >
                      <Camera size={18} />
                      Scanner un autre code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <AlertCircle size={48} style={{ color: '#dc3545', marginBottom: '1rem' }} />
                <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>Article introuvable</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  Aucun article trouvé avec le SKU "{articleSku}".
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleRescan}
                >
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
