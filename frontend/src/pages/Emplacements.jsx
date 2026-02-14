/**
 * Page de gestion des emplacements physiques.
 *
 * Affiche l'arbre hiérarchique des emplacements (Zone → Étagère → Boîte)
 * avec indicateurs de remplissage et génération de QR codes.
 */

import React, { useState, useEffect } from 'react'
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
import Loader from '../components/common/Loader'
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
      // Nettoyer l'URL du blob quand le modal se ferme
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

  // Fonction pour calculer la couleur de la barre de remplissage
  const getBarColor = (pourcentage) => {
    if (pourcentage > 90) return '#dc3545' // Rouge
    if (pourcentage > 70) return '#ffc107' // Jaune/Orange
    return '#28a745' // Vert
  }

  // Rendu de l'indicateur de remplissage
  const renderIndicateurRemplissage = (emplacement) => {
    if (emplacement.capacite_max === null || emplacement.capacite_max === 0) {
      return <span style={{ color: '#6c757d' }}>Illimité</span>
    }

    const pourcentage = emplacement.pourcentage_remplissage

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          flex: 1,
          height: '20px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          overflow: 'hidden',
          minWidth: '100px'
        }}>
          <div style={{
            width: `${Math.min(pourcentage, 100)}%`,
            height: '100%',
            backgroundColor: getBarColor(pourcentage),
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
          {emplacement.quantite_utilisee} / {emplacement.capacite_max} ({pourcentage.toFixed(0)}%)
        </span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <Loader />
      </div>
    )
  }

  return (
    <div className="page-container">
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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/plan-atelier')}
            className="btn btn-secondary"
            style={{ gap: '0.5rem' }}
            title="Vue d'ensemble des emplacements"
          >
            <Warehouse size={20} />
            Plan d'atelier
          </button>
          {canCreate('emplacements') && (
            <button
              onClick={handleCreate}
              className="btn btn-primary"
              style={{ gap: '0.5rem' }}
            >
              <Plus size={20} />
              Nouvel emplacement
            </button>
          )}
        </div>
      </div>

      {/* Liste des emplacements */}
      {emplacementsTree && emplacementsTree.length === 0 ? (
        <div className="empty-state">
          <MapPin size={64} />
          <h2>Aucun emplacement</h2>
          <p>Créez votre premier bâtiment/zone pour commencer à organiser votre atelier</p>
          {canCreate('emplacements') && (
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus size={20} />
              Créer un bâtiment
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
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
                  <React.Fragment key={zone.id}>
                    {/* ZONE (Niveau 0) - Gras, fond gris */}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                      <td>
                        🏢 {zone.code}
                        {zone.children?.length > 0 && (
                          <small style={{ marginLeft: '0.5rem', fontWeight: 'normal', color: '#6c757d' }}>
                            ({zone.children.length} étagère{zone.children.length > 1 ? 's' : ''})
                          </small>
                        )}
                      </td>
                      <td>
                        {zone.description || (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Aucune description
                          </span>
                        )}
                      </td>
                      <td>{renderIndicateurRemplissage(zone)}</td>
                      <td>
                        <div className="action-buttons">
                          {canUpdate('emplacements') && (
                            <button
                              onClick={() => handleEdit(zone)}
                              className="btn btn-sm btn-secondary"
                              title="Modifier la zone"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleQRCodeClick(zone)}
                            className="btn btn-sm btn-info"
                            title="Voir QR Code"
                          >
                            <QrCode size={14} />
                          </button>
                          {canDelete('emplacements') && (
                            <button
                              onClick={() => handleDelete(zone)}
                              className="btn btn-sm btn-danger"
                              title="Supprimer la zone"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ÉTAGÈRES (Niveau 1) - Indentées 2rem */}
                    {zone.children?.map((etagere) => (
                      <React.Fragment key={etagere.id}>
                        <tr style={{ backgroundColor: '#fff' }}>
                          <td style={{ paddingLeft: '2rem' }}>
                            ↳ 📚 {etagere.code}
                            {etagere.children?.length > 0 && (
                              <small style={{ marginLeft: '0.5rem', color: '#6c757d' }}>
                                ({etagere.children.length} boîte{etagere.children.length > 1 ? 's' : ''})
                              </small>
                            )}
                          </td>
                          <td>
                            {etagere.description || (
                              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                Aucune description
                              </span>
                            )}
                          </td>
                          <td>{renderIndicateurRemplissage(etagere)}</td>
                          <td>
                            <div className="action-buttons">
                              {canUpdate('emplacements') && (
                                <button
                                  onClick={() => handleEdit(etagere)}
                                  className="btn btn-sm btn-secondary"
                                  title="Modifier l'étagère"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleQRCodeClick(etagere)}
                                className="btn btn-sm btn-info"
                                title="Voir QR Code"
                              >
                                <QrCode size={14} />
                              </button>
                              {canDelete('emplacements') && (
                                <button
                                  onClick={() => handleDelete(etagere)}
                                  className="btn btn-sm btn-danger"
                                  title="Supprimer l'étagère"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* BOÎTES (Niveau 2) - Indentées 4rem */}
                        {etagere.children?.map((boite) => (
                          <tr key={boite.id} style={{ backgroundColor: '#fafafa' }}>
                            <td style={{ paddingLeft: '4rem' }}>
                              ↳ 📦 {boite.code}
                            </td>
                            <td>
                              {boite.description || (
                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Aucune description
                                </span>
                              )}
                            </td>
                            <td>{renderIndicateurRemplissage(boite)}</td>
                            <td>
                              <div className="action-buttons">
                                {canUpdate('emplacements') && (
                                  <button
                                    onClick={() => handleEdit(boite)}
                                    className="btn btn-sm btn-secondary"
                                    title="Modifier la boîte"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleQRCodeClick(boite)}
                                  className="btn btn-sm btn-info"
                                  title="Voir QR Code"
                                >
                                  <QrCode size={14} />
                                </button>
                                {canDelete('emplacements') && (
                                  <button
                                    onClick={() => handleDelete(boite)}
                                    className="btn btn-sm btn-danger"
                                    title="Supprimer la boîte"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
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
        <div style={{ padding: '1rem 0' }}>
          <p>
            Êtes-vous sûr de vouloir supprimer l'emplacement{' '}
            <strong>{deleteConfirm?.code}</strong> ?
          </p>
          <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>
            ⚠️ Attention : Cette action est bloquée si l'emplacement contient des sous-emplacements ou des articles.
          </p>
          <div className="modal-actions" style={{ marginTop: '2rem' }}>
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
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Emplacement : <code style={{ fontSize: '1rem', fontWeight: 'bold' }}>{qrcodeEmplacement.code_complet || qrcodeEmplacement.code}</code>
              </p>
              {qrcodeEmplacement.description && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {qrcodeEmplacement.description}
                </p>
              )}
            </div>

            <div style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              marginBottom: '1.5rem',
              minWidth: '300px',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {qrcodeUrl ? (
                <img
                  src={qrcodeUrl}
                  alt={`QR Code ${qrcodeEmplacement.code}`}
                  style={{ maxWidth: '300px', height: 'auto' }}
                />
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Chargement du QR code...</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => handleDownloadQRCode(qrcodeEmplacement)}
                className="btn btn-primary"
                style={{ gap: '0.5rem' }}
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

            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
              💡 Imprimez ce QR code pour identifier rapidement cet emplacement
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Emplacements
