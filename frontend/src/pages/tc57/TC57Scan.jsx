import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ScanLine, RotateCcw, Package, MapPin } from 'lucide-react'
import { toast } from 'react-toastify'
import TC57Layout from '../../components/layout/TC57Layout'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import { getArticles } from '../../services/articleService'
import { getEmplacement, getArticlesByEmplacement } from '../../services/emplacementService'
import { createMouvement } from '../../services/mouvementService'

// États possibles de la page
const ETAT = {
  IDLE:        'idle',
  LOADING:     'loading',
  ARTICLE:     'article',
  MOUVEMENT:   'mouvement',
  EMPLACEMENT: 'emplacement',
  NOT_FOUND:   'not_found',
}

function TC57Scan() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [etat, setEtat]               = useState(ETAT.IDLE)
  const [articleData, setArticleData] = useState(null)
  const [emplacementId, setEmplacementId] = useState(null)
  const [codeScan, setCodeScan]       = useState('')
  const [manualInput, setManualInput] = useState('')
  const [typeMouvement, setTypeMouvement] = useState(null)
  const [quantite, setQuantite]       = useState('')
  const [motif, setMotif]             = useState('')

  const inputRef      = useRef(null)
  const handleScanRef = useRef(null)

  // Données emplacement
  const { data: emplacement } = useQuery({
    queryKey: ['tc57-emplacement', emplacementId],
    queryFn: () => getEmplacement(emplacementId),
    enabled: !!emplacementId && etat === ETAT.EMPLACEMENT,
  })

  const { data: articlesEmplacement } = useQuery({
    queryKey: ['tc57-articles-emplacement', emplacementId],
    queryFn: () => getArticlesByEmplacement(emplacementId),
    enabled: !!emplacementId && etat === ETAT.EMPLACEMENT,
  })

  // Mutation mouvement
  const mutationMouvement = useMutation({
    mutationFn: createMouvement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      toast.success(`✅ ${typeMouvement === 'ENTREE' ? 'Entrée' : 'Sortie'} enregistrée`)
      setArticleData(prev => ({ ...prev, quantite: data.quantite_apres }))
      setEtat(ETAT.ARTICLE)
      setTypeMouvement(null)
      setQuantite('')
      setMotif('')
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || 'Erreur lors de l\'enregistrement'
      toast.error(msg)
    },
  })

  const handleScan = useCallback((code) => {
    const clean = (code || '').trim()
    if (!clean) return

    setManualInput('')
    setCodeScan(clean)
    setTypeMouvement(null)
    setQuantite('')
    setMotif('')

    if (clean.startsWith('emplacement:')) {
      const id = parseInt(clean.split(':')[1])
      if (isNaN(id)) { toast.error('QR code d\'emplacement invalide'); return }
      setEmplacementId(id)
      setEtat(ETAT.EMPLACEMENT)
    } else {
      setEtat(ETAT.LOADING)
      getArticles({ search: clean, limit: 5 })
        .then(res => {
          const exact   = res.items?.find(a => a.sku === clean)
          const article = exact || (res.items?.length === 1 ? res.items[0] : null)
          if (article) {
            setArticleData(article)
            setEtat(ETAT.ARTICLE)
          } else {
            setEtat(ETAT.NOT_FOUND)
          }
        })
        .catch(() => { toast.error('Erreur lors de la recherche'); setEtat(ETAT.IDLE) })
    }
  }, [])

  handleScanRef.current = handleScan

  // Code passé en paramètre URL (navigation depuis TC57Layout global)
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setSearchParams({}, { replace: true })
      handleScanRef.current?.(decodeURIComponent(code))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hook scanner Zebra (cette page gère son propre scan)
  useBarcodeScanner(
    useCallback((code) => handleScanRef.current?.(code), [])
  )

  // Auto-focus sur le champ en mode idle
  useEffect(() => {
    if (etat === ETAT.IDLE) inputRef.current?.focus()
  }, [etat])

  const handleReset = () => {
    setEtat(ETAT.IDLE)
    setArticleData(null)
    setEmplacementId(null)
    setTypeMouvement(null)
    setQuantite('')
    setMotif('')
    setCodeScan('')
  }

  const handleConfirmerMouvement = () => {
    const qty = parseInt(quantite)
    if (!qty || qty <= 0) { toast.warning('Quantité invalide'); return }
    mutationMouvement.mutate({
      article_id: articleData.id,
      type:       typeMouvement,
      quantite:   qty,
      motif:      motif || (typeMouvement === 'ENTREE' ? 'Entrée TC57' : 'Sortie TC57'),
    })
  }

  const isStockBas = articleData && articleData.quantite <= articleData.quantite_min

  return (
    <TC57Layout title="Scanner">

      {/* ── IDLE : champ de scan ── */}
      {etat === ETAT.IDLE && (
        <div className="tc57-scan-zone">
          <div className="tc57-scan-icon"><ScanLine size={72} /></div>
          <p className="tc57-scan-hint">Scannez un article ou un emplacement</p>
          <form
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
            onSubmit={(e) => { e.preventDefault(); if (manualInput.trim()) handleScan(manualInput.trim()) }}
          >
            <input
              ref={inputRef}
              type="text"
              className="tc57-input barcode-capture-input"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Code-barres ou saisie manuelle"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
            />
            {manualInput.trim() && (
              <button type="submit" className="tc57-btn tc57-btn-primary">Valider</button>
            )}
          </form>
        </div>
      )}

      {/* ── CHARGEMENT ── */}
      {etat === ETAT.LOADING && (
        <div className="tc57-loading">
          <div className="tc57-spinner" />
          <p>Recherche en cours…</p>
        </div>
      )}

      {/* ── ARTICLE NON TROUVÉ ── */}
      {etat === ETAT.NOT_FOUND && (
        <div className="tc57-result">
          <div className="tc57-not-found">
            <Package size={52} />
            <p>Article introuvable</p>
            <small>Code scanné : {codeScan}</small>
          </div>
          <button className="tc57-btn tc57-btn-ghost" onClick={handleReset}>
            <RotateCcw size={18} /> Rescanner
          </button>
        </div>
      )}

      {/* ── ARTICLE TROUVÉ ── */}
      {etat === ETAT.ARTICLE && articleData && (
        <div className="tc57-result">
          <div className="tc57-article-card">
            <div className="tc57-article-nom">{articleData.nom}</div>
            {articleData.sku && <div className="tc57-article-sku">{articleData.sku}</div>}
            <div className={`tc57-stock-qty ${isStockBas ? 'danger' : 'ok'}`}>
              {articleData.quantite}
              <span className="tc57-stock-unit">en stock</span>
            </div>
            {isStockBas && (
              <div className="tc57-stock-alert">⚠️ Stock bas (min : {articleData.quantite_min})</div>
            )}
            {articleData.emplacement && (
              <div className="tc57-article-emplacement">
                📍 {articleData.emplacement.code_complet || articleData.emplacement.code}
              </div>
            )}
          </div>

          {/* Boutons ENTRÉE / SORTIE */}
          {!typeMouvement ? (
            <div className="tc57-mouvement-btns">
              <button className="tc57-btn tc57-btn-entree" onClick={() => setTypeMouvement('ENTREE')}>
                + Entrée
              </button>
              <button className="tc57-btn tc57-btn-sortie" onClick={() => setTypeMouvement('SORTIE')}>
                − Sortie
              </button>
            </div>
          ) : (
            /* Formulaire mouvement */
            <div className="tc57-mouvement-form">
              <div className={`tc57-mouvement-titre ${typeMouvement === 'ENTREE' ? 'entree' : 'sortie'}`}>
                {typeMouvement === 'ENTREE' ? '➕ Entrée de stock' : '➖ Sortie de stock'}
              </div>
              <span className="tc57-label">Quantité</span>
              <input
                type="number"
                className="tc57-input tc57-qty-input"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                min="1"
                placeholder="0"
                autoFocus
                inputMode="numeric"
              />
              <span className="tc57-label">Motif (optionnel)</span>
              <input
                type="text"
                className="tc57-input"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder={typeMouvement === 'ENTREE' ? 'Réapprovisionnement…' : 'Utilisation…'}
              />
              <div className="tc57-mouvement-btns">
                <button
                  className={`tc57-btn ${typeMouvement === 'ENTREE' ? 'tc57-btn-entree' : 'tc57-btn-sortie'}`}
                  onClick={handleConfirmerMouvement}
                  disabled={!quantite || mutationMouvement.isPending}
                >
                  {mutationMouvement.isPending ? '…' : 'Confirmer'}
                </button>
                <button className="tc57-btn tc57-btn-secondary" onClick={() => setTypeMouvement(null)}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          <button className="tc57-btn tc57-btn-ghost" onClick={handleReset}>
            <RotateCcw size={18} /> Nouveau scan
          </button>
        </div>
      )}

      {/* ── EMPLACEMENT TROUVÉ ── */}
      {etat === ETAT.EMPLACEMENT && (
        <div className="tc57-result">
          {!emplacement ? (
            <div className="tc57-loading"><div className="tc57-spinner" /></div>
          ) : (
            <>
              <div className="tc57-emplacement-card">
                <div className="tc57-article-nom">
                  <MapPin size={20} style={{ display: 'inline', marginRight: '6px' }} />
                  {emplacement.code}
                </div>
                {emplacement.description && (
                  <div className="tc57-article-sku">{emplacement.description}</div>
                )}
                {articlesEmplacement && (
                  <div className={`tc57-stock-qty ${articlesEmplacement.length === 0 ? 'danger' : 'ok'}`}
                       style={{ fontSize: '2.5rem' }}>
                    {articlesEmplacement.length}
                    <span className="tc57-stock-unit">article{articlesEmplacement.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {articlesEmplacement && articlesEmplacement.length > 0 && (
                <div className="tc57-emplacement-liste">
                  {articlesEmplacement.map(article => (
                    <button
                      key={article.id}
                      className="tc57-article-item"
                      onClick={() => {
                        setArticleData(article)
                        setEmplacementId(null)
                        setEtat(ETAT.ARTICLE)
                      }}
                    >
                      <span className="tc57-article-item-nom">{article.nom}</span>
                      <span className={`tc57-article-item-qty ${article.quantite <= article.quantite_min ? 'danger' : 'ok'}`}>
                        {article.quantite}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button className="tc57-btn tc57-btn-ghost" onClick={handleReset}>
            <RotateCcw size={18} /> Nouveau scan
          </button>
        </div>
      )}
    </TC57Layout>
  )
}

export default TC57Scan
