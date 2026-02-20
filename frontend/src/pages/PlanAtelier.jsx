/**
 * Page Plan d'atelier - Vue en arbre visuel des emplacements
 * Affiche la hiérarchie complète à 3 niveaux : Zone → Étagère → Boîte
 * Avec statistiques, recherche, et indicateurs de remplissage
 */

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getEmplacementsTree, downloadQRCode } from '../services/emplacementService'
import { toast } from 'react-toastify'
import {
  MapPin,
  Search,
  Package,
  QrCode,
  ChevronRight,
  ChevronDown,
  Warehouse,
  Layers,
  Box,
  AlertCircle
} from 'lucide-react'

function PlanAtelier() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedZones, setExpandedZones] = useState({})

  // Charger l'arbre complet des emplacements
  const { data: emplacementsTree, isLoading } = useQuery({
    queryKey: ['emplacements-tree'],
    queryFn: getEmplacementsTree
  })

  // Calculer les statistiques globales
  const stats = useMemo(() => {
    if (!emplacementsTree) return { zones: 0, etageres: 0, boites: 0, articles: 0 }

    let zonesCount = 0
    let etageresCount = 0
    let boitesCount = 0
    let articlesCount = 0

    emplacementsTree.forEach(zone => {
      zonesCount++
      articlesCount += zone.quantite_utilisee || 0

      if (zone.children && zone.children.length > 0) {
        zone.children.forEach(etagere => {
          etageresCount++
          articlesCount += etagere.quantite_utilisee || 0

          if (etagere.children && etagere.children.length > 0) {
            boitesCount += etagere.children.length
            etagere.children.forEach(boite => {
              articlesCount += boite.quantite_utilisee || 0
            })
          }
        })
      }
    })

    return { zones: zonesCount, etageres: etageresCount, boites: boitesCount, articles: articlesCount }
  }, [emplacementsTree])

  // Filtrer les emplacements selon la recherche
  const filteredTree = useMemo(() => {
    if (!emplacementsTree || !searchTerm.trim()) return emplacementsTree

    const term = searchTerm.toLowerCase()

    return emplacementsTree.filter(zone => {
      const zoneMatch = zone.code.toLowerCase().includes(term) ||
                       (zone.description && zone.description.toLowerCase().includes(term))

      const childrenMatch = zone.children?.some(etagere => {
        const etagereMatch = etagere.code.toLowerCase().includes(term) ||
                            (etagere.description && etagere.description.toLowerCase().includes(term))

        const boitesMatch = etagere.children?.some(boite =>
          boite.code.toLowerCase().includes(term) ||
          (boite.description && boite.description.toLowerCase().includes(term))
        )

        return etagereMatch || boitesMatch
      })

      return zoneMatch || childrenMatch
    })
  }, [emplacementsTree, searchTerm])

  // Toggle expansion d'une zone
  const toggleZone = (zoneId) => {
    setExpandedZones(prev => ({
      ...prev,
      [zoneId]: !prev[zoneId]
    }))
  }

  // Tout développer
  const expandAll = () => {
    const allExpanded = {}
    emplacementsTree?.forEach(zone => {
      allExpanded[zone.id] = true
    })
    setExpandedZones(allExpanded)
  }

  // Tout réduire
  const collapseAll = () => {
    setExpandedZones({})
  }

  // Obtenir la classe de badge selon le % de remplissage
  const getRemplissageBadgeClass = (pourcentage) => {
    if (!pourcentage || pourcentage === 0) return 'badge badge-neutral'
    if (pourcentage >= 90) return 'badge badge-danger'
    if (pourcentage >= 70) return 'badge badge-warning'
    return 'badge badge-success'
  }

  // Télécharger le QR code
  const handleDownloadQR = (emplacement) => {
    downloadQRCode(emplacement.id, emplacement.code)
    toast.success(`QR code "${emplacement.code}" téléchargé`)
  }

  // Naviguer vers les articles d'un emplacement
  const handleViewArticles = (emplacementId) => {
    navigate(`/articles?emplacement_id=${emplacementId}`)
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
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <MapPin size={32} />
            Plan d'atelier
          </h1>
          <p className="page-subtitle">
            Visualisez l'organisation de votre atelier et localisez vos articles
          </p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon info">
            <Warehouse size={24} />
          </div>
          <div className="stat-card-value">{stats.zones}</div>
          <div className="stat-card-label">Zone{stats.zones > 1 ? 's' : ''}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon success">
            <Layers size={24} />
          </div>
          <div className="stat-card-value">{stats.etageres}</div>
          <div className="stat-card-label">Étagère{stats.etageres > 1 ? 's' : ''}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon warning">
            <Box size={24} />
          </div>
          <div className="stat-card-value">{stats.boites}</div>
          <div className="stat-card-label">Boîte{stats.boites > 1 ? 's' : ''}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon primary">
            <Package size={24} />
          </div>
          <div className="stat-card-value">{stats.articles}</div>
          <div className="stat-card-label">Article{stats.articles > 1 ? 's' : ''} stocké{stats.articles > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Barre de recherche et actions */}
      <div className="card">
        <div className="card-body">
          <div className="filters-bar">
            <div className="search-bar" style={{ flex: 1, minWidth: '250px' }}>
              <div className="search-input-wrapper">
                <Search size={20} />
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Rechercher un emplacement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={expandAll}>
              <ChevronDown size={16} />
              Tout développer
            </button>
            <button className="btn btn-secondary btn-sm" onClick={collapseAll}>
              <ChevronRight size={16} />
              Tout réduire
            </button>
          </div>
        </div>
      </div>

      {/* Arbre hiérarchique */}
      <div className="card">
        <div className="card-body">
          {!filteredTree || filteredTree.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} className="empty-state-icon" />
              <p className="empty-state-title">Aucun emplacement trouvé</p>
              <p className="empty-state-description">
                {searchTerm
                  ? `Aucun résultat pour "${searchTerm}"`
                  : 'Créez votre premier emplacement pour commencer à organiser votre atelier'}
              </p>
            </div>
          ) : (
            <div>
              {filteredTree.map((zone) => (
                <div key={zone.id} className="plan-zone-wrapper">
                  {/* ZONE (Niveau 0) */}
                  <div
                    className={`plan-zone-header${zone.children?.length > 0 ? ' clickable' : ''}`}
                    onClick={() => zone.children?.length > 0 && toggleZone(zone.id)}
                  >
                    <div className="plan-zone-content">
                      {zone.children?.length > 0 && (
                        expandedZones[zone.id]
                          ? <ChevronDown size={20} className="plan-chevron" />
                          : <ChevronRight size={20} className="plan-chevron" />
                      )}
                      <Warehouse size={24} className="plan-zone-icon" />
                      <div style={{ flex: 1 }}>
                        <h3 className="plan-zone-title">{zone.code}</h3>
                        {zone.description && (
                          <p className="plan-item-description">{zone.description}</p>
                        )}
                        {zone.children?.length > 0 && (
                          <p className="plan-item-count">
                            {zone.children.length} étagère{zone.children.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {/* Badge de remplissage */}
                      {zone.capacite_max && (
                        <div className="plan-item-capacity">
                          <span className={getRemplissageBadgeClass(zone.pourcentage_remplissage)}>
                            {zone.pourcentage_remplissage?.toFixed(0)}%
                          </span>
                          <p className="plan-item-capacity-count">
                            {zone.quantite_utilisee} / {zone.capacite_max}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions Zone */}
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => { e.stopPropagation(); handleDownloadQR(zone) }}
                        title="Télécharger QR code"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => { e.stopPropagation(); handleViewArticles(zone.id) }}
                        title="Voir les articles"
                      >
                        <Package size={16} />
                      </button>
                    </div>
                  </div>

                  {/* ÉTAGÈRES (Niveau 1) - Affichées si zone développée */}
                  {expandedZones[zone.id] && zone.children?.map((etagere) => (
                    <div key={etagere.id} className="plan-etagere-wrapper">
                      <div className="plan-etagere-row">
                        <div className="plan-zone-content">
                          <Layers size={20} className="plan-etagere-icon" />
                          <div style={{ flex: 1 }}>
                            <h4 className="plan-etagere-title">{etagere.code}</h4>
                            {etagere.description && (
                              <p className="plan-item-description">{etagere.description}</p>
                            )}
                            {etagere.children?.length > 0 && (
                              <p className="plan-item-count">
                                {etagere.children.length} boîte{etagere.children.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>

                          {/* Badge de remplissage étagère */}
                          {etagere.capacite_max && (
                            <div className="plan-item-capacity">
                              <span className={getRemplissageBadgeClass(etagere.pourcentage_remplissage)}>
                                {etagere.pourcentage_remplissage?.toFixed(0)}%
                              </span>
                              <p className="plan-item-capacity-count">
                                {etagere.quantite_utilisee} / {etagere.capacite_max}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions Étagère */}
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleDownloadQR(etagere)}
                            title="Télécharger QR code"
                          >
                            <QrCode size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleViewArticles(etagere.id)}
                            title="Voir les articles"
                          >
                            <Package size={14} />
                          </button>
                        </div>
                      </div>

                      {/* BOÎTES (Niveau 2) */}
                      {etagere.children?.map((boite) => (
                        <div key={boite.id} className="plan-boite-wrapper">
                          <div className="plan-boite-row">
                            <div className="plan-zone-content">
                              <Box size={18} className="plan-boite-icon" />
                              <div style={{ flex: 1 }}>
                                <h5 className="plan-boite-title">{boite.code}</h5>
                                {boite.description && (
                                  <p className="plan-item-description">{boite.description}</p>
                                )}
                              </div>

                              {/* Badge de remplissage boîte */}
                              {boite.capacite_max && (
                                <div className="plan-item-capacity">
                                  <span className={getRemplissageBadgeClass(boite.pourcentage_remplissage)}>
                                    {boite.pourcentage_remplissage?.toFixed(0)}%
                                  </span>
                                  <p className="plan-item-capacity-count">
                                    {boite.quantite_utilisee} / {boite.capacite_max}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Actions Boîte */}
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleDownloadQR(boite)}
                                title="Télécharger QR code"
                              >
                                <QrCode size={12} />
                              </button>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleViewArticles(boite.id)}
                                title="Voir les articles"
                              >
                                <Package size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlanAtelier
