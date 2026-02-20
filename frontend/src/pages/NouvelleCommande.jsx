/**
 * Page de création d'une nouvelle commande fournisseur.
 *
 * Fonctionnalités :
 * - Formulaire complet (fournisseur, numéro, date prévue, notes)
 * - Système de "panier" pour ajouter des lignes de commande
 * - Liste des lignes avec modification/suppression
 * - Calcul automatique du montant total
 * - Validation avant soumission
 */

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, Plus, Trash2, ShoppingCart, Save } from 'lucide-react'
import { createCommande } from '../services/commandeService'
import { getFournisseurs } from '../services/fournisseurService'
import { getArticles } from '../services/articleService'
import { usePermissions } from '../hooks/usePermissions'

const NouvelleCommande = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canCreate } = usePermissions()

  // Vérifier la permission au chargement de la page
  useEffect(() => {
    if (!canCreate('commandes')) {
      toast.error('Vous n\'avez pas la permission de créer des commandes')
      navigate('/commandes')
    }
  }, [canCreate, navigate])

  // États du formulaire
  const [formData, setFormData] = useState({
    fournisseur_id: '',
    numero_commande: '',
    date_reception_prevue: '',
    notes: ''
  })

  // États du panier (lignes de commande)
  const [panier, setPanier] = useState([])

  // États pour l'ajout d'une ligne
  const [nouvelleLigne, setNouvelleLigne] = useState({
    article_id: '',
    quantite_commandee: 1,
    prix_unitaire: ''
  })

  // Récupérer les fournisseurs
  const { data: fournisseurs, isLoading: loadingFournisseurs } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: getFournisseurs
  })

  // Récupérer les articles
  const { data: articlesData, isLoading: loadingArticles } = useQuery({
    queryKey: ['articles-all'],
    queryFn: () => getArticles({ skip: 0, limit: 500 })
  })

  const articles = articlesData?.items || []

  // Mutation pour créer la commande
  const createMutation = useMutation({
    mutationFn: createCommande,
    onSuccess: () => {
      queryClient.invalidateQueries(['commandes'])
      toast.success('Commande créée avec succès')
      navigate('/commandes')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création')
    }
  })

  // Calcul du montant total
  const montantTotal = useMemo(() => {
    return panier.reduce((total, ligne) => total + (ligne.quantite_commandee * ligne.prix_unitaire), 0)
  }, [panier])

  // Gestionnaires d'événements
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNouvelleLigneChange = (e) => {
    const { name, value } = e.target
    setNouvelleLigne(prev => ({ ...prev, [name]: value }))
    if (name === 'article_id' && value) {
      const article = articles.find(a => a.id === parseInt(value))
      if (article?.prix_fournisseur) {
        setNouvelleLigne(prev => ({ ...prev, prix_unitaire: article.prix_fournisseur.toString() }))
      }
    }
  }

  const handleAjouterLigne = () => {
    if (!nouvelleLigne.article_id) { toast.error('Veuillez sélectionner un article'); return }
    if (!nouvelleLigne.quantite_commandee || nouvelleLigne.quantite_commandee <= 0) { toast.error('La quantité doit être supérieure à 0'); return }
    if (!nouvelleLigne.prix_unitaire || parseFloat(nouvelleLigne.prix_unitaire) < 0) { toast.error('Le prix unitaire doit être positif'); return }

    const articleDejaDansPanier = panier.some(l => l.article_id === parseInt(nouvelleLigne.article_id))
    if (articleDejaDansPanier) { toast.error('Cet article est déjà dans le panier'); return }

    const article = articles.find(a => a.id === parseInt(nouvelleLigne.article_id))
    setPanier(prev => [...prev, {
      article_id: parseInt(nouvelleLigne.article_id),
      article,
      quantite_commandee: parseInt(nouvelleLigne.quantite_commandee),
      prix_unitaire: parseFloat(nouvelleLigne.prix_unitaire)
    }])
    setNouvelleLigne({ article_id: '', quantite_commandee: 1, prix_unitaire: '' })
    toast.success('Article ajouté au panier')
  }

  const handleSupprimerLigne = (index) => {
    setPanier(prev => prev.filter((_, i) => i !== index))
    toast.info('Article retiré du panier')
  }

  const handleModifierQuantite = (index, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) { toast.error('La quantité doit être supérieure à 0'); return }
    setPanier(prev => prev.map((ligne, i) => i === index ? { ...ligne, quantite_commandee: parseInt(nouvelleQuantite) } : ligne))
  }

  const handleModifierPrix = (index, nouveauPrix) => {
    if (nouveauPrix < 0) { toast.error('Le prix doit être positif'); return }
    setPanier(prev => prev.map((ligne, i) => i === index ? { ...ligne, prix_unitaire: parseFloat(nouveauPrix) } : ligne))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.fournisseur_id) { toast.error('Veuillez sélectionner un fournisseur'); return }
    if (!formData.numero_commande.trim()) { toast.error('Veuillez saisir un numéro de commande'); return }
    if (panier.length === 0) { toast.error('Veuillez ajouter au moins un article au panier'); return }

    createMutation.mutate({
      fournisseur_id: parseInt(formData.fournisseur_id),
      numero_commande: formData.numero_commande.trim(),
      date_reception_prevue: formData.date_reception_prevue || null,
      notes: formData.notes.trim() || null,
      lignes: panier.map(ligne => ({
        article_id: ligne.article_id,
        quantite_commandee: ligne.quantite_commandee,
        prix_unitaire: ligne.prix_unitaire
      }))
    })
  }

  if (loadingFournisseurs || loadingArticles) {
    return (
      <div className="loading-page">
        <div className="spinner-lg" />
        <span>Chargement...</span>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate('/commandes')}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: 'var(--space-3)' }}
          >
            <ArrowLeft size={16} />
            Retour aux commandes
          </button>
          <h1 className="page-title">Nouvelle Commande</h1>
          <p className="page-subtitle">Créer un bon de commande fournisseur</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Informations générales */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Informations générales</span>
          </div>
          <div className="card-body">
            <div className="form-row">
              {/* Fournisseur */}
              <div className="form-group">
                <label htmlFor="fournisseur_id" className="form-label required">Fournisseur</label>
                <select
                  id="fournisseur_id"
                  name="fournisseur_id"
                  value={formData.fournisseur_id}
                  onChange={handleChange}
                  className="form-control form-select"
                  required
                >
                  <option value="">-- Sélectionner un fournisseur --</option>
                  {fournisseurs?.map(fournisseur => (
                    <option key={fournisseur.id} value={fournisseur.id}>
                      {fournisseur.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Numéro de commande */}
              <div className="form-group">
                <label htmlFor="numero_commande" className="form-label required">Numéro de commande</label>
                <input
                  type="text"
                  id="numero_commande"
                  name="numero_commande"
                  value={formData.numero_commande}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="CMD-2026-001"
                  required
                />
                <span className="form-helper">Numéro unique pour identifier cette commande</span>
              </div>

              {/* Date de réception prévue */}
              <div className="form-group">
                <label htmlFor="date_reception_prevue" className="form-label">Date de réception prévue</label>
                <input
                  type="date"
                  id="date_reception_prevue"
                  name="date_reception_prevue"
                  value={formData.date_reception_prevue}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              {/* Notes — pleine largeur */}
              <div className="form-group form-row full">
                <label htmlFor="notes" className="form-label">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                  placeholder="Notes ou remarques sur cette commande..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ajouter une ligne au panier */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Plus size={16} />
              Ajouter un article
            </span>
          </div>
          <div className="card-body">
            <div className="cmd-ligne-grid">
              {/* Article */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="article_id" className="form-label">Article</label>
                <select
                  id="article_id"
                  name="article_id"
                  value={nouvelleLigne.article_id}
                  onChange={handleNouvelleLigneChange}
                  className="form-control form-select"
                >
                  <option value="">-- Sélectionner un article --</option>
                  {articles.map(article => (
                    <option key={article.id} value={article.id}>
                      {article.nom} {article.sku ? `(${article.sku})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantité */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="quantite_commandee" className="form-label">Quantité</label>
                <input
                  type="number"
                  id="quantite_commandee"
                  name="quantite_commandee"
                  value={nouvelleLigne.quantite_commandee}
                  onChange={handleNouvelleLigneChange}
                  className="form-control"
                  min="1"
                />
              </div>

              {/* Prix unitaire */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="prix_unitaire" className="form-label">Prix unitaire (€)</label>
                <input
                  type="number"
                  id="prix_unitaire"
                  name="prix_unitaire"
                  value={nouvelleLigne.prix_unitaire}
                  onChange={handleNouvelleLigneChange}
                  className="form-control"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              {/* Bouton Ajouter */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleAjouterLigne}
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panier — Liste des lignes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <ShoppingCart size={16} />
              Panier ({panier.length} article{panier.length > 1 ? 's' : ''})
            </span>
          </div>

          {panier.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <ShoppingCart size={48} className="empty-state-icon" />
              <p className="empty-state-title">Aucun article dans le panier</p>
              <p className="empty-state-description">
                Utilisez le formulaire ci-dessus pour ajouter des articles à commander
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Montant</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {panier.map((ligne, index) => (
                    <tr key={index}>
                      <td data-label="Article">
                        <strong>{ligne.article?.nom}</strong>
                        {ligne.article?.sku && (
                          <div className="text-muted">SKU: {ligne.article.sku}</div>
                        )}
                      </td>
                      <td data-label="Quantité">
                        <input
                          type="number"
                          value={ligne.quantite_commandee}
                          onChange={(e) => handleModifierQuantite(index, e.target.value)}
                          className="form-control cmd-qty-input"
                          min="1"
                        />
                      </td>
                      <td data-label="Prix unitaire">
                        <div className="cmd-price-cell">
                          <input
                            type="number"
                            value={ligne.prix_unitaire}
                            onChange={(e) => handleModifierPrix(index, e.target.value)}
                            className="form-control cmd-qty-input"
                            min="0"
                            step="0.01"
                          />
                          <span>€</span>
                        </div>
                      </td>
                      <td data-label="Montant">
                        <strong>{(ligne.quantite_commandee * ligne.prix_unitaire).toFixed(2)} €</strong>
                      </td>
                      <td data-label="Actions">
                        <button
                          type="button"
                          onClick={() => handleSupprimerLigne(index)}
                          className="btn btn-sm btn-danger"
                          title="Retirer du panier"
                          aria-label="Retirer du panier"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="cmd-total-row">
                    <td colSpan="3" style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)' }}>
                      Montant total :
                    </td>
                    <td colSpan="2" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span className="cmd-total-value">{montantTotal.toFixed(2)} €</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="form-actions-row">
          <button
            type="button"
            onClick={() => navigate('/commandes')}
            className="btn btn-secondary"
            disabled={createMutation.isPending}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending || panier.length === 0}
          >
            <Save size={18} />
            {createMutation.isPending ? 'Création...' : 'Créer la commande'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NouvelleCommande
