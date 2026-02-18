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
import Loader from '../components/common/Loader'
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
    queryFn: () => getArticles({ skip: 0, limit: 500 }) // Charger 500 articles max (limite backend)
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
      const message = error.response?.data?.detail || 'Erreur lors de la création'
      toast.error(message)
    }
  })

  // Calcul du montant total
  const montantTotal = useMemo(() => {
    return panier.reduce((total, ligne) => {
      return total + (ligne.quantite_commandee * ligne.prix_unitaire)
    }, 0)
  }, [panier])

  // Gestionnaires d'événements pour le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNouvelleLigneChange = (e) => {
    const { name, value } = e.target
    setNouvelleLigne(prev => ({ ...prev, [name]: value }))

    // Si l'article change, pré-remplir le prix unitaire avec le prix fournisseur
    if (name === 'article_id' && value) {
      const article = articles.find(a => a.id === parseInt(value))
      if (article && article.prix_fournisseur) {
        setNouvelleLigne(prev => ({
          ...prev,
          prix_unitaire: article.prix_fournisseur.toString()
        }))
      }
    }
  }

  const handleAjouterLigne = () => {
    // Validation
    if (!nouvelleLigne.article_id) {
      toast.error('Veuillez sélectionner un article')
      return
    }

    if (!nouvelleLigne.quantite_commandee || nouvelleLigne.quantite_commandee <= 0) {
      toast.error('La quantité doit être supérieure à 0')
      return
    }

    if (!nouvelleLigne.prix_unitaire || parseFloat(nouvelleLigne.prix_unitaire) < 0) {
      toast.error('Le prix unitaire doit être positif')
      return
    }

    // Vérifier que l'article n'est pas déjà dans le panier
    const articleDejaDansPanier = panier.some(
      ligne => ligne.article_id === parseInt(nouvelleLigne.article_id)
    )

    if (articleDejaDansPanier) {
      toast.error('Cet article est déjà dans le panier')
      return
    }

    // Récupérer l'article pour affichage
    const article = articles.find(a => a.id === parseInt(nouvelleLigne.article_id))

    // Ajouter au panier
    const lignePanier = {
      article_id: parseInt(nouvelleLigne.article_id),
      article: article, // Pour l'affichage
      quantite_commandee: parseInt(nouvelleLigne.quantite_commandee),
      prix_unitaire: parseFloat(nouvelleLigne.prix_unitaire)
    }

    setPanier(prev => [...prev, lignePanier])

    // Réinitialiser le formulaire d'ajout
    setNouvelleLigne({
      article_id: '',
      quantite_commandee: 1,
      prix_unitaire: ''
    })

    toast.success('Article ajouté au panier')
  }

  const handleSupprimerLigne = (index) => {
    setPanier(prev => prev.filter((_, i) => i !== index))
    toast.info('Article retiré du panier')
  }

  const handleModifierQuantite = (index, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) {
      toast.error('La quantité doit être supérieure à 0')
      return
    }

    setPanier(prev => prev.map((ligne, i) =>
      i === index ? { ...ligne, quantite_commandee: parseInt(nouvelleQuantite) } : ligne
    ))
  }

  const handleModifierPrix = (index, nouveauPrix) => {
    if (nouveauPrix < 0) {
      toast.error('Le prix doit être positif')
      return
    }

    setPanier(prev => prev.map((ligne, i) =>
      i === index ? { ...ligne, prix_unitaire: parseFloat(nouveauPrix) } : ligne
    ))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.fournisseur_id) {
      toast.error('Veuillez sélectionner un fournisseur')
      return
    }

    if (!formData.numero_commande.trim()) {
      toast.error('Veuillez saisir un numéro de commande')
      return
    }

    if (panier.length === 0) {
      toast.error('Veuillez ajouter au moins un article au panier')
      return
    }

    // Préparer les données pour l'API
    const commandeData = {
      fournisseur_id: parseInt(formData.fournisseur_id),
      numero_commande: formData.numero_commande.trim(),
      date_reception_prevue: formData.date_reception_prevue || null,
      notes: formData.notes.trim() || null,
      lignes: panier.map(ligne => ({
        article_id: ligne.article_id,
        quantite_commandee: ligne.quantite_commandee,
        prix_unitaire: ligne.prix_unitaire
      }))
    }

    createMutation.mutate(commandeData)
  }

  if (loadingFournisseurs || loadingArticles) {
    return (
      <div className="page-container">
        <Loader />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate('/commandes')}
            className="btn btn-secondary"
            style={{ marginBottom: '1rem' }}
          >
            <ArrowLeft size={20} />
            Retour aux commandes
          </button>
          <h1>Nouvelle Commande</h1>
          <p>Créer un bon de commande fournisseur</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Informations de base */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>Informations générales</h2>

          <div className="form-grid">
            {/* Fournisseur */}
            <div className="form-group">
              <label htmlFor="fournisseur_id">
                Fournisseur <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                id="fournisseur_id"
                name="fournisseur_id"
                value={formData.fournisseur_id}
                onChange={handleChange}
                className="form-control"
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
              <label htmlFor="numero_commande">
                Numéro de commande <span style={{ color: '#dc3545' }}>*</span>
              </label>
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
              <small style={{ color: '#6c757d' }}>
                Numéro unique pour identifier cette commande
              </small>
            </div>

            {/* Date de réception prévue */}
            <div className="form-group">
              <label htmlFor="date_reception_prevue">Date de réception prévue</label>
              <input
                type="date"
                id="date_reception_prevue"
                name="date_reception_prevue"
                value={formData.date_reception_prevue}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            {/* Notes */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="notes">Notes</label>
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

        {/* Ajouter une ligne au panier */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Plus size={20} style={{ color: '#17a2b8' }} />
            <h2 style={{ margin: 0 }}>Ajouter un article</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr auto', gap: '1rem', alignItems: 'end' }}>
            {/* Article */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="article_id">Article</label>
              <select
                id="article_id"
                name="article_id"
                value={nouvelleLigne.article_id}
                onChange={handleNouvelleLigneChange}
                className="form-control"
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
              <label htmlFor="quantite_commandee">Quantité</label>
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
              <label htmlFor="prix_unitaire">Prix unitaire (€)</label>
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
            <button
              type="button"
              onClick={handleAjouterLigne}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Ajouter
            </button>
          </div>
        </div>

        {/* Panier - Liste des lignes */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShoppingCart size={20} style={{ color: '#28a745' }} />
            <h2 style={{ margin: 0 }}>Panier ({panier.length} article{panier.length > 1 ? 's' : ''})</h2>
          </div>

          {panier.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
              <ShoppingCart size={48} style={{ color: '#dee2e6', margin: '0 auto 1rem' }} />
              <p>Aucun article dans le panier</p>
              <p style={{ fontSize: '0.875rem' }}>
                Utilisez le formulaire ci-dessus pour ajouter des articles à commander
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th style={{ width: '120px' }}>Quantité</th>
                      <th style={{ width: '150px' }}>Prix unitaire</th>
                      <th style={{ width: '150px' }}>Montant</th>
                      <th style={{ width: '80px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panier.map((ligne, index) => (
                      <tr key={index}>
                        <td data-label="Article">
                          {ligne.article?.nom}
                          {ligne.article?.sku && (
                            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                              SKU: {ligne.article.sku}
                            </div>
                          )}
                        </td>
                        <td data-label="Quantité">
                          <input
                            type="number"
                            value={ligne.quantite_commandee}
                            onChange={(e) => handleModifierQuantite(index, e.target.value)}
                            className="form-control"
                            min="1"
                            style={{ width: '100px' }}
                          />
                        </td>
                        <td data-label="Prix unitaire">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <input
                              type="number"
                              value={ligne.prix_unitaire}
                              onChange={(e) => handleModifierPrix(index, e.target.value)}
                              className="form-control"
                              min="0"
                              step="0.01"
                              style={{ width: '100px' }}
                            />
                            <span>€</span>
                          </div>
                        </td>
                        <td data-label="Montant">
                          <strong>
                            {(ligne.quantite_commandee * ligne.prix_unitaire).toFixed(2)} €
                          </strong>
                        </td>
                        <td data-label="Actions">
                          <button
                            type="button"
                            onClick={() => handleSupprimerLigne(index)}
                            className="btn btn-sm btn-danger"
                            title="Retirer du panier"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 'bold', borderTop: '2px solid #dee2e6' }}>
                      <td colSpan="3" style={{ textAlign: 'right' }}>Montant total :</td>
                      <td colSpan="2" style={{ fontSize: '1.25rem', color: '#28a745' }}>
                        {montantTotal.toFixed(2)} €
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
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
            <Save size={20} />
            {createMutation.isPending ? 'Création...' : 'Créer la commande'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NouvelleCommande
