/**
 * Page de gestion des commandes fournisseurs.
 *
 * Fonctionnalités :
 * - Liste des commandes avec pagination
 * - Filtres par statut et fournisseur
 * - Badges colorés pour les statuts
 * - Actions selon le statut (Envoyer, Recevoir, Annuler, Supprimer)
 * - Téléchargement PDF du bon de commande
 * - Création de nouvelles commandes
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Plus, FileText, Send, Package, XCircle, Trash2, Download, Filter } from 'lucide-react'
import {
  getCommandes,
  deleteCommande,
  envoyerCommande,
  recevoirCommande,
  annulerCommande,
  downloadPDF
} from '../services/commandeService'
import { getFournisseurs } from '../services/fournisseurService'
import Loader from '../components/common/Loader'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import { usePermissions } from '../hooks/usePermissions'

const Commandes = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canCreate, canUpdate, canDelete } = usePermissions()

  // États locaux
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  const [filters, setFilters] = useState({
    statut: '',
    fournisseur_id: ''
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [commandeToDelete, setCommandeToDelete] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionData, setActionData] = useState({ type: '', commande: null })

  // Récupérer les commandes avec filtres
  const { data: commandesData, isLoading } = useQuery({
    queryKey: ['commandes', page, filters],
    queryFn: () => getCommandes({
      skip: (page - 1) * itemsPerPage,
      limit: itemsPerPage,
      statut: filters.statut || null,
      fournisseur_id: filters.fournisseur_id || null
    })
  })

  // Récupérer les fournisseurs pour le filtre
  const { data: fournisseurs } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: getFournisseurs
  })

  // Mutation pour supprimer
  const deleteMutation = useMutation({
    mutationFn: deleteCommande,
    onSuccess: () => {
      queryClient.invalidateQueries(['commandes'])
      toast.success('Commande supprimée avec succès')
      setShowDeleteModal(false)
      setCommandeToDelete(null)
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Erreur lors de la suppression'
      toast.error(message)
    }
  })

  // Mutation pour envoyer
  const envoyerMutation = useMutation({
    mutationFn: envoyerCommande,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['commandes'])
      toast.success('Commande envoyée avec succès')
      setShowActionModal(false)

      // Ouvrir un brouillon email pré-rempli si le fournisseur a un email
      if (data.fournisseur?.email) {
        const subject = `Commande N°${data.numero_commande}`

        let body = `Bonjour,\n\n`
        body += `Veuillez trouver ci-dessous notre commande N°${data.numero_commande}.\n\n`
        body += `Détail de la commande :\n`
        body += `${'─'.repeat(50)}\n`

        data.lignes.forEach(ligne => {
          body += `• ${ligne.article.nom} : ${ligne.quantite_commandee} unité(s) à ${parseFloat(ligne.prix_unitaire).toFixed(2)} € = ${parseFloat(ligne.montant_ligne).toFixed(2)} €\n`
        })

        body += `${'─'.repeat(50)}\n`
        body += `TOTAL TTC : ${parseFloat(data.montant_total).toFixed(2)} €\n`

        if (data.date_reception_prevue) {
          const dateRecep = new Date(data.date_reception_prevue).toLocaleDateString('fr-FR')
          body += `\nDate de réception souhaitée : ${dateRecep}\n`
        }

        if (data.notes) {
          body += `\nNotes : ${data.notes}\n`
        }

        body += `\nCordialement,`

        const mailtoUrl = `mailto:${data.fournisseur.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.open(mailtoUrl, '_blank')
      } else {
        toast.warning('Le fournisseur n\'a pas d\'adresse email configurée — aucun brouillon email ouvert.')
      }
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Erreur lors de l\'envoi'
      toast.error(message)
    }
  })

  // Mutation pour recevoir
  const recevoirMutation = useMutation({
    mutationFn: recevoirCommande,
    onSuccess: () => {
      queryClient.invalidateQueries(['commandes'])
      queryClient.invalidateQueries(['articles']) // Rafraîchir les articles (stock mis à jour)
      toast.success('Commande réceptionnée avec succès. Stock mis à jour.')
      setShowActionModal(false)
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Erreur lors de la réception'
      toast.error(message)
    }
  })

  // Mutation pour annuler
  const annulerMutation = useMutation({
    mutationFn: annulerCommande,
    onSuccess: () => {
      queryClient.invalidateQueries(['commandes'])
      toast.success('Commande annulée')
      setShowActionModal(false)
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Erreur lors de l\'annulation'
      toast.error(message)
    }
  })

  // Gestionnaires d'événements
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Réinitialiser à la page 1 lors du changement de filtre
  }

  const handleResetFilters = () => {
    setFilters({ statut: '', fournisseur_id: '' })
    setPage(1)
  }

  const handleDeleteClick = (commande) => {
    setCommandeToDelete(commande)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = () => {
    if (commandeToDelete) {
      deleteMutation.mutate(commandeToDelete.id)
    }
  }

  const handleActionClick = (type, commande) => {
    setActionData({ type, commande })
    setShowActionModal(true)
  }

  const handleActionConfirm = () => {
    const { type, commande } = actionData

    switch (type) {
      case 'envoyer':
        envoyerMutation.mutate(commande.id)
        break
      case 'recevoir':
        recevoirMutation.mutate(commande.id)
        break
      case 'annuler':
        annulerMutation.mutate(commande.id)
        break
      default:
        break
    }
  }

  const handleDownloadPDF = (commande) => {
    try {
      downloadPDF(commande.id, commande.numero_commande)
      toast.success('Téléchargement du PDF en cours...')
    } catch (error) {
      toast.error('Erreur lors du téléchargement du PDF')
    }
  }

  const handleNewCommande = () => {
    navigate('/commandes/nouvelle')
  }

  const handleViewDetails = (commande) => {
    navigate(`/commandes/${commande.id}`)
  }

  // Helper pour obtenir le badge de statut
  const getStatutBadge = (statut) => {
    const styles = {
      BROUILLON: { bg: '#6c757d', text: 'Brouillon' },
      ENVOYEE: { bg: '#007bff', text: 'Envoyée' },
      RECUE: { bg: '#28a745', text: 'Reçue' },
      ANNULEE: { bg: '#dc3545', text: 'Annulée' }
    }

    const style = styles[statut] || { bg: '#6c757d', text: statut }

    return (
      <span
        style={{
          backgroundColor: style.bg,
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}
      >
        {style.text}
      </span>
    )
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper pour obtenir le message de confirmation
  const getActionMessage = () => {
    const { type, commande } = actionData

    switch (type) {
      case 'envoyer':
        return `Envoyer la commande N°${commande?.numero_commande} au fournisseur ?`
      case 'recevoir':
        return `Réceptionner la commande N°${commande?.numero_commande} ? Le stock sera automatiquement mis à jour.`
      case 'annuler':
        return `Annuler la commande N°${commande?.numero_commande} ? Cette action est irréversible.`
      default:
        return ''
    }
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <Loader />
      </div>
    )
  }

  const commandes = commandesData?.items || []
  const totalCommandes = commandesData?.total || 0
  const totalPages = Math.ceil(totalCommandes / itemsPerPage)

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Commandes Fournisseurs</h1>
          <p>Gestion des commandes et réception de stock</p>
        </div>
        {canCreate('commandes') && (
          <button onClick={handleNewCommande} className="btn btn-primary">
            <Plus size={20} />
            Nouvelle commande
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Filter size={20} style={{ color: '#6c757d' }} />
          <h3 style={{ margin: 0 }}>Filtres</h3>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Filtre statut */}
          <div style={{ flex: '1 1 200px' }}>
            <label htmlFor="filter-statut">Statut</label>
            <select
              id="filter-statut"
              value={filters.statut}
              onChange={(e) => handleFilterChange('statut', e.target.value)}
              className="form-control"
            >
              <option value="">Tous les statuts</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="ENVOYEE">Envoyée</option>
              <option value="RECUE">Reçue</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </div>

          {/* Filtre fournisseur */}
          <div style={{ flex: '1 1 200px' }}>
            <label htmlFor="filter-fournisseur">Fournisseur</label>
            <select
              id="filter-fournisseur"
              value={filters.fournisseur_id}
              onChange={(e) => handleFilterChange('fournisseur_id', e.target.value)}
              className="form-control"
            >
              <option value="">Tous les fournisseurs</option>
              {fournisseurs?.map(fournisseur => (
                <option key={fournisseur.id} value={fournisseur.id}>
                  {fournisseur.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton réinitialiser */}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary"
              disabled={!filters.statut && !filters.fournisseur_id}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Résumé des filtres actifs */}
        {(filters.statut || filters.fournisseur_id) && (
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
            {totalCommandes} commande{totalCommandes > 1 ? 's' : ''} trouvée{totalCommandes > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Tableau des commandes */}
      {commandes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <FileText size={48} style={{ color: '#dee2e6', margin: '0 auto 1rem' }} />
          <h3>Aucune commande</h3>
          <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
            {filters.statut || filters.fournisseur_id
              ? 'Aucune commande ne correspond aux filtres sélectionnés'
              : 'Créez votre première commande fournisseur'}
          </p>
          {!filters.statut && !filters.fournisseur_id && canCreate('commandes') && (
            <button onClick={handleNewCommande} className="btn btn-primary">
              <Plus size={20} />
              Nouvelle commande
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Commande</th>
                    <th>Fournisseur</th>
                    <th>Statut</th>
                    <th>Date commande</th>
                    <th>Montant TTC</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commandes.map(commande => (
                    <tr key={commande.id}>
                      <td data-label="N° Commande">
                        <button
                          onClick={() => handleViewDetails(commande)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#007bff',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            font: 'inherit'
                          }}
                        >
                          {commande.numero_commande}
                        </button>
                      </td>
                      <td data-label="Fournisseur">{commande.fournisseur.nom}</td>
                      <td data-label="Statut">{getStatutBadge(commande.statut)}</td>
                      <td data-label="Date commande">{formatDateTime(commande.date_commande)}</td>
                      <td data-label="Montant TTC">
                        <strong>{parseFloat(commande.montant_total).toFixed(2)} €</strong>
                      </td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {/* Bouton PDF */}
                          <button
                            onClick={() => handleDownloadPDF(commande)}
                            className="btn btn-sm btn-secondary"
                            title="Télécharger PDF"
                          >
                            <Download size={16} />
                          </button>

                          {/* Bouton Envoyer (seulement pour BROUILLON) */}
                          {commande.statut === 'BROUILLON' && canUpdate('commandes') && (
                            <button
                              onClick={() => handleActionClick('envoyer', commande)}
                              className="btn btn-sm btn-primary"
                              title="Envoyer la commande"
                            >
                              <Send size={16} />
                            </button>
                          )}

                          {/* Bouton Recevoir (seulement pour ENVOYEE) */}
                          {commande.statut === 'ENVOYEE' && canUpdate('commandes') && (
                            <button
                              onClick={() => handleActionClick('recevoir', commande)}
                              className="btn btn-sm btn-success"
                              title="Réceptionner la commande"
                            >
                              <Package size={16} />
                            </button>
                          )}

                          {/* Bouton Annuler (seulement pour BROUILLON et ENVOYEE) */}
                          {(commande.statut === 'BROUILLON' || commande.statut === 'ENVOYEE') && canUpdate('commandes') && (
                            <button
                              onClick={() => handleActionClick('annuler', commande)}
                              className="btn btn-sm btn-danger"
                              title="Annuler la commande"
                            >
                              <XCircle size={16} />
                            </button>
                          )}

                          {/* Bouton Supprimer (seulement pour BROUILLON) */}
                          {commande.statut === 'BROUILLON' && canDelete('commandes') && (
                            <button
                              onClick={() => handleDeleteClick(commande)}
                              className="btn btn-sm btn-danger"
                              title="Supprimer la commande"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
      >
        <p>
          Êtes-vous sûr de vouloir supprimer la commande{' '}
          <strong>N°{commandeToDelete?.numero_commande}</strong> ?
        </p>
        <p style={{ color: '#dc3545', fontSize: '0.875rem' }}>
          Cette action est irréversible.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="btn btn-secondary"
            disabled={deleteMutation.isPending}
          >
            Annuler
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="btn btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </Modal>

      {/* Modal de confirmation d'action */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title="Confirmer l'action"
      >
        <p>{getActionMessage()}</p>
        {actionData.type === 'recevoir' && (
          <div
            style={{
              backgroundColor: '#d1ecf1',
              color: '#0c5460',
              padding: '0.75rem',
              borderRadius: '4px',
              marginTop: '1rem',
              fontSize: '0.875rem'
            }}
          >
            ℹ️ Le stock des articles sera automatiquement incrémenté et des mouvements ENTREE seront créés.
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            onClick={() => setShowActionModal(false)}
            className="btn btn-secondary"
            disabled={
              envoyerMutation.isPending ||
              recevoirMutation.isPending ||
              annulerMutation.isPending
            }
          >
            Annuler
          </button>
          <button
            onClick={handleActionConfirm}
            className={`btn ${
              actionData.type === 'annuler'
                ? 'btn-danger'
                : actionData.type === 'recevoir'
                  ? 'btn-success'
                  : 'btn-primary'
            }`}
            disabled={
              envoyerMutation.isPending ||
              recevoirMutation.isPending ||
              annulerMutation.isPending
            }
          >
            {(envoyerMutation.isPending ||
              recevoirMutation.isPending ||
              annulerMutation.isPending)
              ? 'Traitement...'
              : 'Confirmer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Commandes
