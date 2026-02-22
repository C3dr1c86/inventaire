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
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import { usePermissions } from '../hooks/usePermissions'

// Map statut → classe badge charte
const STATUT_BADGE = {
  BROUILLON: 'badge badge-neutral',
  ENVOYEE:   'badge badge-primary',
  RECUE:     'badge badge-success',
  ANNULEE:   'badge badge-danger'
}
const STATUT_LABEL = {
  BROUILLON: 'Brouillon',
  ENVOYEE:   'Envoyée',
  RECUE:     'Reçue',
  ANNULEE:   'Annulée'
}

const Commandes = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canCreate, canUpdate, canDelete, isAdmin } = usePermissions()

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
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
    }
  })

  // Mutation pour envoyer
  const envoyerMutation = useMutation({
    mutationFn: envoyerCommande,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['commandes'])
      toast.success('Demande de devis envoyée')
      setShowActionModal(false)

      // Ouvrir un brouillon email de demande de devis si le fournisseur a un email
      if (data.fournisseur?.email) {
        const subject = `Demande de devis — ${data.fournisseur.nom}`
        let body = `Bonjour,\n\n`
        body += `Pourriez-vous nous faire parvenir un devis pour les références suivantes ?\n\n`
        data.lignes.forEach(ligne => {
          const ref = ligne.article?.ref_fournisseur
          const refPart = ref ? `${ref} — ` : ''
          body += `- ${refPart}${ligne.article.nom} — Qté : ${ligne.quantite_commandee}\n`
        })
        body += `\nMerci de préciser le délai de livraison pour chaque référence.\n\nBien cordialement,`
        window.open(`mailto:${data.fournisseur.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
      } else {
        toast.warning('Le fournisseur n\'a pas d\'adresse email configurée — aucun brouillon email ouvert.')
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi')
    }
  })

  // Mutation pour recevoir
  const recevoirMutation = useMutation({
    mutationFn: recevoirCommande,
    onSuccess: () => {
      queryClient.invalidateQueries(['commandes'])
      queryClient.invalidateQueries(['articles'])
      toast.success('Commande réceptionnée avec succès. Stock mis à jour.')
      setShowActionModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la réception')
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
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'annulation')
    }
  })

  // Gestionnaires d'événements
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
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
      case 'envoyer': envoyerMutation.mutate(commande.id); break
      case 'recevoir': recevoirMutation.mutate(commande.id); break
      case 'annuler': annulerMutation.mutate(commande.id); break
      default: break
    }
  }

  const handleDownloadPDF = (commande) => {
    try {
      downloadPDF(commande.id, commande.numero_commande)
      toast.success('Téléchargement du PDF en cours...')
    } catch {
      toast.error('Erreur lors du téléchargement du PDF')
    }
  }

  const getActionMessage = () => {
    const { type, commande } = actionData
    switch (type) {
      case 'envoyer': return `Envoyer la demande de devis N°${commande?.numero_commande} au fournisseur ?`
      case 'recevoir': return `Réceptionner la commande N°${commande?.numero_commande} ? Le stock sera automatiquement mis à jour.`
      case 'annuler': return `Annuler la commande N°${commande?.numero_commande} ? Cette action est irréversible.`
      default: return ''
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const isActionPending = envoyerMutation.isPending || recevoirMutation.isPending || annulerMutation.isPending

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner-lg" />
        <span>Chargement des commandes...</span>
      </div>
    )
  }

  const commandes = commandesData?.items || []
  const totalCommandes = commandesData?.total || 0
  const totalPages = Math.ceil(totalCommandes / itemsPerPage)

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Commandes Fournisseurs</h1>
          <p className="page-subtitle">Gestion des commandes et réception de stock</p>
        </div>
        <div className="page-actions">
          {canCreate('commandes') && (
            <button onClick={() => navigate('/commandes/nouvelle')} className="btn btn-primary">
              <Plus size={18} />
              Nouvelle commande
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Filter size={16} />
            Filtres
          </span>
          {(filters.statut || filters.fournisseur_id) && (
            <span className="text-muted">
              {totalCommandes} commande{totalCommandes > 1 ? 's' : ''} trouvée{totalCommandes > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="card-body">
          <div className="filters-bar">
            {/* Filtre statut */}
            <div className="filter-item">
              <label htmlFor="filter-statut" className="form-label">Statut</label>
              <select
                id="filter-statut"
                value={filters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
                className="form-control form-select"
              >
                <option value="">Tous les statuts</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYEE">Envoyée</option>
                <option value="RECUE">Reçue</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>

            {/* Filtre fournisseur */}
            <div className="filter-item">
              <label htmlFor="filter-fournisseur" className="form-label">Fournisseur</label>
              <select
                id="filter-fournisseur"
                value={filters.fournisseur_id}
                onChange={(e) => handleFilterChange('fournisseur_id', e.target.value)}
                className="form-control form-select"
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
            <div className="filter-item" style={{ maxWidth: 'fit-content', alignSelf: 'flex-end' }}>
              <button
                onClick={handleResetFilters}
                className="btn btn-secondary"
                disabled={!filters.statut && !filters.fournisseur_id}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des commandes */}
      {commandes.length === 0 ? (
        <div className="empty-state">
          <FileText size={56} className="empty-state-icon" />
          <h2 className="empty-state-title">Aucune commande</h2>
          <p className="empty-state-description">
            {filters.statut || filters.fournisseur_id
              ? 'Aucune commande ne correspond aux filtres sélectionnés'
              : 'Créez votre première commande fournisseur'}
          </p>
          {!filters.statut && !filters.fournisseur_id && canCreate('commandes') && (
            <button onClick={() => navigate('/commandes/nouvelle')} className="btn btn-primary">
              <Plus size={18} />
              Nouvelle commande
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-wrapper">
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
                        <strong>{commande.numero_commande}</strong>
                      </td>
                      <td data-label="Fournisseur">{commande.fournisseur.nom}</td>
                      <td data-label="Statut">
                        <span className={STATUT_BADGE[commande.statut] || 'badge badge-neutral'}>
                          {STATUT_LABEL[commande.statut] || commande.statut}
                        </span>
                      </td>
                      <td data-label="Date commande">{formatDateTime(commande.date_commande)}</td>
                      <td data-label="Montant TTC">
                        <strong>{parseFloat(commande.montant_total).toFixed(2)} €</strong>
                      </td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          {/* Bouton PDF */}
                          <button
                            onClick={() => handleDownloadPDF(commande)}
                            className="btn btn-sm btn-secondary"
                            title="Télécharger PDF"
                            aria-label="Télécharger PDF"
                          >
                            <Download size={14} />
                          </button>

                          {/* Bouton Envoyer (seulement pour BROUILLON) */}
                          {commande.statut === 'BROUILLON' && canUpdate('commandes') && (
                            <button
                              onClick={() => handleActionClick('envoyer', commande)}
                              className="btn btn-sm btn-primary"
                              title="Envoyer la commande"
                              aria-label="Envoyer la commande"
                            >
                              <Send size={14} />
                            </button>
                          )}

                          {/* Bouton Recevoir (seulement pour ENVOYEE) */}
                          {commande.statut === 'ENVOYEE' && canUpdate('commandes') && (
                            <button
                              onClick={() => handleActionClick('recevoir', commande)}
                              className="btn btn-sm btn-success"
                              title="Réceptionner la commande"
                              aria-label="Réceptionner la commande"
                            >
                              <Package size={14} />
                            </button>
                          )}

                          {/* Bouton Annuler (pour BROUILLON et ENVOYEE) */}
                          {(commande.statut === 'BROUILLON' || commande.statut === 'ENVOYEE') && canUpdate('commandes') && (
                            <button
                              onClick={() => handleActionClick('annuler', commande)}
                              className="btn btn-sm btn-danger"
                              title="Annuler la commande"
                              aria-label="Annuler la commande"
                            >
                              <XCircle size={14} />
                            </button>
                          )}

                          {/* Bouton Supprimer */}
                          {(commande.statut === 'BROUILLON' || isAdmin) && canDelete('commandes') && (
                            <button
                              onClick={() => handleDeleteClick(commande)}
                              className="btn btn-sm btn-danger"
                              title={isAdmin && commande.statut !== 'BROUILLON' ? 'Supprimer (admin)' : 'Supprimer la commande'}
                              aria-label="Supprimer la commande"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card-footer">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
      >
        <div className="modal-body">
          <p>
            Êtes-vous sûr de vouloir supprimer la commande{' '}
            <strong>N°{commandeToDelete?.numero_commande}</strong> ?
          </p>
          <div className="alert alert-danger" style={{ marginTop: 'var(--space-4)' }}>
            Cette action est irréversible.
          </div>
        </div>
        <div className="modal-footer">
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
        <div className="modal-body">
          <p>{getActionMessage()}</p>
          {actionData.type === 'recevoir' && (
            <div className="alert alert-info" style={{ marginTop: 'var(--space-4)' }}>
              ℹ️ Le stock des articles sera automatiquement incrémenté et des mouvements ENTREE seront créés.
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            onClick={() => setShowActionModal(false)}
            className="btn btn-secondary"
            disabled={isActionPending}
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
            disabled={isActionPending}
          >
            {isActionPending ? 'Traitement...' : 'Confirmer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Commandes
