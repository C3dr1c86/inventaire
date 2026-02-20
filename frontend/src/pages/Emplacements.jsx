/**
 * Page de gestion des emplacements physiques.
 *
 * Affiche l'arbre hiérarchique des emplacements (Zone → Étagère → Boîte)
 * avec indicateurs de remplissage et génération de QR codes.
 */

import { useState, useEffect, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  getEmplacementsTree,
  deleteEmplacement,
  createEmplacement,
  updateEmplacement,
  downloadQRCode
} from '../services/emplacementService'
import api from '../services/api'
import { Plus, Edit2, Trash2, MapPin, QrCode, Download, Warehouse } from 'lucide-react'
import Modal from '../components/common/Modal'
import EmplacementForm from '../components/emplacements/EmplacementForm'
import { usePermissions } from '../hooks/usePermissions'

function Emplacements() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { canCreate, canUpdate, canDelete } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEmplacement, setSelectedEmplacement] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [qrcodeEmplacement, setQrcodeEmplacement] = useState(null)
  const [qrcodeUrl, setQrcodeUrl] = useState(null)

  // Query pour récupérer l'arbre des emplacements
  const { data: emplacementsTree, isLoading } = useQuery({
    queryKey: ['emplacements-tree'],
    queryFn: getEmplacementsTree
  })

  // Mutation pour créer un emplacement
  const createMutation = useMutation({
    mutationFn: createEmplacement,
    onSuccess: () => {
      queryClient.invalidateQueries(['emplacements'])
      queryClient.invalidateQueries(['emplacements-tree'])
      queryClient.invalidateQueries(['emplacements-racines'])
      queryClient.invalidateQueries(['articles'])
      setIsModalOpen(false)
      toast.success('Emplacement créé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création')
    }
  })

  // Mutation pour modifier un emplacement
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateEmplacement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emplacements'])
      queryClient.invalidateQueries(['emplacements-tree'])
      queryClient.invalidateQueries(['emplacements-racines'])
      queryClient.invalidateQueries(['articles'])
      setIsModalOpen(false)
      setSelectedEmplacement(null)
      toast.success('Emplacement modifié avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification')
    }
  })

  // Mutation pour supprimer un emplacement
  const deleteMutation = useMutation({
    mutationFn: deleteEmplacement,
    onSuccess: () => {
      queryClient.invalidateQueries(['emplacements'])
      queryClient.invalidateQueries(['emplacements-tree'])
      queryClient.invalidateQueries(['emplacements-racines'])
      queryClient.invalidateQueries(['articles'])
      setDeleteConfirm(null)
      toast.success('Emplacement supprimé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
      setDeleteConfirm(null)
    }
  })

  // Charger le QR code quand le modal s'ouvre
  useEffect(() => {
    if (qrcodeEmplacement) {
      const loadQRCode = async () => {
        try {
          const response = await api.get(`/emplacements/${qrcodeEmplacement.id}/qrcode`, {
            responseType: 'blob'
          })
          const url = window.URL.createObjectURL(new Blob([response.data]))
          setQrcodeUrl(url)
        } catch (error) {
          console.error('Erreur lors du chargement du QR code:', error)
          toast.error('Erreur lors du chargement du QR code')
        }
      }
      loadQRCode()
    } else {
      if (qrcodeUrl) {
        window.URL.revokeObjectURL(qrcodeUrl)
        setQrcodeUrl(null)
      }
    }
  }, [qrcodeEmplacement])

  // Handlers
  const handleCreate = () => {
    setSelectedEmplacement(null)
    setIsModalOpen(true)
  }

  const handleEdit = (emplacement) => {
    setSelectedEmplacement(emplacement)
    setIsModalOpen(true)
  }

  const handleDelete = (emplacement) => {
    setDeleteConfirm(emplacement)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id)
    }
  }

  const handleSubmit = (data) => {
    if (selectedEmplacement) {
      updateMutation.mutate({ id: selectedEmplacement.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleQRCodeClick = (emplacement) => {
    setQrcodeEmplacement(emplacement)
  }

  const handleDownloadQRCode = async (emplacement) => {
    try {
      await downloadQRCode(emplacement.id, emplacement.code)
      toast.success('QR code téléchargé avec succès')
    } catch (error) {
      toast.error('Erreur lors du téléchargement du QR code')
    }
  }

  // Rendu de l'indicateur de remplissage
  const renderIndicateurRemplissage = (emplacement) => {
    if (emplacement.capacite_max === null || emplacement.capacite_max === 0) {
      return <span className="text-muted">Illimité</span>
    }

    const pourcentage = emplacement.pourcentage_remplissage
    const barClass = pourcentage > 90 ? 'high' : pourcentage > 70 ? 'medium' : 'low'

    return (
      <div className="fill-indicator">
        <div className="progress-track">
          <div
            className={`progress-bar ${barClass}`}
            style={{ width: `${Math.min(pourcentage, 100)}%` }}
          />
        </div>
        <span className="progress-label">
          {emplacement.quantite_utilisee} / {emplacement.capacite_max} ({pourcentage.toFixed(0)}%)
        </span>
      </div>
    )
  }

  if (isLoading) {
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
          <h1 className="page-title">
            <MapPin size={32} />
            Emplacements physiques
          </h1>
          <p className="page-subtitle">
            Gérez les emplacements de stockage dans votre atelier (Zones → Étagères → Boîtes)
          </p>
        </div>
        <div className="page-actions">
          <button
            onClick={() => navigate('/plan-atelier')}
            className="btn btn-secondary"
            title="Vue d'ensemble des emplacements"
          >
            <Warehouse size={20} />
            Plan d'atelier
          </button>
          {canCreate('emplacements') && (
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus size={20} />
              Nouvel emplacement
            </button>
          )}
        </div>
      </div>

      {/* Liste des emplacements */}
      {emplacementsTree && emplacementsTree.length === 0 ? (
        <div className="empty-state">
          <MapPin size={64} className="empty-state-icon" />
          <p className="empty-state-title">Aucun emplacement</p>
          <p className="empty-state-description">
            Créez votre premier bâtiment/zone pour commencer à organiser votre atelier
          </p>
          {canCreate('emplacements') && (
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus size={20} />
              Créer un bâtiment
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Capacité / Remplissage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emplacementsTree?.map((zone) => (
                  <Fragment key={zone.id}>
                    {/* ZONE (Niveau 0) */}
                    <tr className="emplacement-zone-row">
                      <td data-label="Code">
                        🏢 <strong>{zone.code}</strong>
                        {zone.children?.length > 0 && (
                          <span className="categorie-count">
                            ({zone.children.length} étagère{zone.children.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </td>
                      <td data-label="Description">
                        {zone.description || <span className="text-muted">Aucune description</span>}
                      </td>
                      <td data-label="Capacité">{renderIndicateurRemplissage(zone)}</td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          {canUpdate('emplacements') && (
                            <button onClick={() => handleEdit(zone)} className="btn btn-sm btn-secondary" title="Modifier la zone">
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button onClick={() => handleQRCodeClick(zone)} className="btn btn-sm btn-ghost" title="Voir QR Code">
                            <QrCode size={14} />
                          </button>
                          {canDelete('emplacements') && (
                            <button onClick={() => handleDelete(zone)} className="btn btn-sm btn-danger" title="Supprimer la zone">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ÉTAGÈRES (Niveau 1) */}
                    {zone.children?.map((etagere) => (
                      <Fragment key={etagere.id}>
                        <tr className="emplacement-etagere-row">
                          <td data-label="Code" className="emplacement-niveau-1">
                            ↳ 📚 {etagere.code}
                            {etagere.children?.length > 0 && (
                              <span className="categorie-count">
                                ({etagere.children.length} boîte{etagere.children.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </td>
                          <td data-label="Description">
                            {etagere.description || <span className="text-muted">Aucune description</span>}
                          </td>
                          <td data-label="Capacité">{renderIndicateurRemplissage(etagere)}</td>
                          <td data-label="Actions">
                            <div className="action-buttons">
                              {canUpdate('emplacements') && (
                                <button onClick={() => handleEdit(etagere)} className="btn btn-sm btn-secondary" title="Modifier l'étagère">
                                  <Edit2 size={14} />
                                </button>
                              )}
                              <button onClick={() => handleQRCodeClick(etagere)} className="btn btn-sm btn-ghost" title="Voir QR Code">
                                <QrCode size={14} />
                              </button>
                              {canDelete('emplacements') && (
                                <button onClick={() => handleDelete(etagere)} className="btn btn-sm btn-danger" title="Supprimer l'étagère">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* BOÎTES (Niveau 2) */}
                        {etagere.children?.map((boite) => (
                          <tr key={boite.id} className="emplacement-boite-row">
                            <td data-label="Code" className="emplacement-niveau-2">
                              ↳ 📦 {boite.code}
                            </td>
                            <td data-label="Description">
                              {boite.description || <span className="text-muted">Aucune description</span>}
                            </td>
                            <td data-label="Capacité">{renderIndicateurRemplissage(boite)}</td>
                            <td data-label="Actions">
                              <div className="action-buttons">
                                {canUpdate('emplacements') && (
                                  <button onClick={() => handleEdit(boite)} className="btn btn-sm btn-secondary" title="Modifier la boîte">
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                <button onClick={() => handleQRCodeClick(boite)} className="btn btn-sm btn-ghost" title="Voir QR Code">
                                  <QrCode size={14} />
                                </button>
                                {canDelete('emplacements') && (
                                  <button onClick={() => handleDelete(boite)} className="btn btn-sm btn-danger" title="Supprimer la boîte">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEmplacement(null)
        }}
        title={selectedEmplacement ? 'Modifier l\'emplacement' : 'Créer un emplacement'}
      >
        <EmplacementForm
          emplacement={selectedEmplacement}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setSelectedEmplacement(null)
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
      >
        <div className="modal-body">
          <p>
            Êtes-vous sûr de vouloir supprimer l'emplacement{' '}
            <strong>{deleteConfirm?.code}</strong> ?
          </p>
          <p className="alert-warning">
            ⚠️ Attention : Cette action est bloquée si l'emplacement contient des sous-emplacements ou des articles.
          </p>
        </div>
        <div className="modal-footer">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="btn btn-secondary"
            disabled={deleteMutation.isPending}
          >
            Annuler
          </button>
          <button
            onClick={confirmDelete}
            className="btn btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </Modal>

      {/* Modal QR Code */}
      <Modal
        isOpen={!!qrcodeEmplacement}
        onClose={() => setQrcodeEmplacement(null)}
        title={`QR Code - ${qrcodeEmplacement?.code}`}
        size="medium"
      >
        {qrcodeEmplacement && (
          <div className="qr-modal-body">
            <div className="qr-modal-info">
              <p className="text-muted">
                Emplacement : <code>{qrcodeEmplacement.code_complet || qrcodeEmplacement.code}</code>
              </p>
              {qrcodeEmplacement.description && (
                <p className="text-muted">{qrcodeEmplacement.description}</p>
              )}
            </div>

            <div className="qr-code-container">
              {qrcodeUrl ? (
                <img
                  src={qrcodeUrl}
                  alt={`QR Code ${qrcodeEmplacement.code}`}
                  style={{ maxWidth: '300px', height: 'auto' }}
                />
              ) : (
                <p className="text-muted">Chargement du QR code...</p>
              )}
            </div>

            <div className="action-buttons">
              <button
                onClick={() => handleDownloadQRCode(qrcodeEmplacement)}
                className="btn btn-primary"
              >
                <Download size={18} />
                Télécharger
              </button>
              <button
                onClick={() => setQrcodeEmplacement(null)}
                className="btn btn-secondary"
              >
                Fermer
              </button>
            </div>

            <p className="qr-modal-hint">
              💡 Imprimez ce QR code pour identifier rapidement cet emplacement
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Emplacements
