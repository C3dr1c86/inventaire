/**
 * Page Plan d'atelier - Vue en arbre visuel des emplacements
 * Affiche la hiérarchie complète à 3 niveaux : Zone → Étagère → Boîte
 * Avec statistiques, recherche, et indicateurs de remplissage
 */

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getEmplacementsTree } from '../services/emplacementService'
import Loader from '../components/common/Loader'
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
import { downloadQRCode } from '../services/emplacementService'
import { toast } from 'react-toastify'

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
      // Vérifier si la zone correspond
      const zoneMatch = zone.code.toLowerCase().includes(term) ||
                       (zone.description && zone.description.toLowerCase().includes(term))

      // Vérifier si une étagère ou boîte correspond
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

  // Obtenir la couleur du badge selon le % de remplissage
  const getBadgeColor = (pourcentage) => {
    if (!pourcentage || pourcentage === 0) return '#6c757d' // Gris si pas de capacité
    if (pourcentage >= 90) return '#dc3545' // Rouge si > 90%
    if (pourcentage >= 70) return '#ffc107' // Orange si > 70%
    return '#28a745' // Vert si < 70%
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
      <div className="page-container">
        <Loader />
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* En-tête */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          <MapPin size={32} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Plan d'atelier
        </h1>
        <p style={{ color: '#6c757d', margin: 0 }}>
          Visualisez l'organisation de votre atelier et localisez vos articles
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #17a2b8, #138496)' }}>
          <div className="stat-value">{stats.zones}</div>
          <div className="stat-label">
            <Warehouse size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Zone{stats.zones > 1 ? 's' : ''}
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #28a745, #1e7e34)' }}>
          <div className="stat-value">{stats.etageres}</div>
          <div className="stat-label">
            <Layers size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Étagère{stats.etageres > 1 ? 's' : ''}
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ffc107, #e0a800)' }}>
          <div className="stat-value">{stats.boites}</div>
          <div className="stat-label">
            <Box size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Boîte{stats.boites > 1 ? 's' : ''}
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #007bff, #0056b3)' }}>
          <div className="stat-value">{stats.articles}</div>
          <div className="stat-label">
            <Package size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Article{stats.articles > 1 ? 's' : ''} stocké{stats.articles > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Barre de recherche et actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Recherche */}
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6c757d'
              }} />
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher un emplacement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {/* Boutons Développer/Réduire */}
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
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6c757d' }}>
              <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3>Aucun emplacement trouvé</h3>
              <p>
                {searchTerm ?
                  `Aucun résultat pour "${searchTerm}"` :
                  "Créez votre premier emplacement pour commencer à organiser votre atelier"
                }
              </p>
            </div>
          ) : (
            <div>
              {filteredTree.map((zone) => (
                <div key={zone.id} style={{ marginBottom: '1.5rem', borderLeft: '4px solid #667eea', paddingLeft: '1rem' }}>
                  {/* ZONE (Niveau 0) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    cursor: zone.children?.length > 0 ? 'pointer' : 'default'
                  }}
                  onClick={() => zone.children?.length > 0 && toggleZone(zone.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      {zone.children?.length > 0 && (
                        expandedZones[zone.id] ?
                          <ChevronDown size={20} style={{ color: '#667eea' }} /> :
                          <ChevronRight size={20} style={{ color: '#667eea' }} />
                      )}
                      <Warehouse size={24} style={{ color: '#667eea' }} />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                          {zone.code}
                        </h3>
                        {zone.description && (
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
                            {zone.description}
                          </p>
                        )}
                        {zone.children?.length > 0 && (
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6c757d' }}>
                            {zone.children.length} étagère{zone.children.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {/* Badge de remplissage */}
                      {zone.capacite_max && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: getBadgeColor(zone.pourcentage_remplissage),
                            color: 'white'
                          }}>
                            {zone.pourcentage_remplissage?.toFixed(0)}%
                          </span>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6c757d' }}>
                            {zone.quantite_utilisee} / {zone.capacite_max}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions Zone */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadQR(zone)
                        }}
                        title="Télécharger QR code"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewArticles(zone.id)
                        }}
                        title="Voir les articles"
                      >
                        <Package size={16} />
                      </button>
                    </div>
                  </div>

                  {/* ÉTAGÈRES (Niveau 1) - Affichées si zone développée */}
                  {expandedZones[zone.id] && zone.children?.map((etagere) => (
                    <div key={etagere.id} style={{ marginLeft: '2rem', marginBottom: '0.5rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <Layers size={20} style={{ color: '#f5576c' }} />
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                              {etagere.code}
                            </h4>
                            {etagere.description && (
                              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6c757d' }}>
                                {etagere.description}
                              </p>
                            )}
                            {etagere.children?.length > 0 && (
                              <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#6c757d' }}>
                                {etagere.children.length} boîte{etagere.children.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>

                          {/* Badge de remplissage étagère */}
                          {etagere.capacite_max && (
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                backgroundColor: getBadgeColor(etagere.pourcentage_remplissage),
                                color: 'white'
                              }}>
                                {etagere.pourcentage_remplissage?.toFixed(0)}%
                              </span>
                              <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: '#6c757d' }}>
                                {etagere.quantite_utilisee} / {etagere.capacite_max}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions Étagère */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
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
                        <div key={boite.id} style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem',
                            backgroundColor: '#fafafa',
                            borderRadius: '4px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                              <Box size={18} style={{ color: '#00f2fe' }} />
                              <div style={{ flex: 1 }}>
                                <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
                                  {boite.code}
                                </h5>
                                {boite.description && (
                                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#6c757d' }}>
                                    {boite.description}
                                  </p>
                                )}
                              </div>

                              {/* Badge de remplissage boîte */}
                              {boite.capacite_max && (
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '8px',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    backgroundColor: getBadgeColor(boite.pourcentage_remplissage),
                                    color: 'white'
                                  }}>
                                    {boite.pourcentage_remplissage?.toFixed(0)}%
                                  </span>
                                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.65rem', color: '#6c757d' }}>
                                    {boite.quantite_utilisee} / {boite.capacite_max}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Actions Boîte */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleDownloadQR(boite)}
                                title="Télécharger QR code"
                                style={{ padding: '0.25rem 0.5rem' }}
                              >
                                <QrCode size={12} />
                              </button>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleViewArticles(boite.id)}
                                title="Voir les articles"
                                style={{ padding: '0.25rem 0.5rem' }}
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
