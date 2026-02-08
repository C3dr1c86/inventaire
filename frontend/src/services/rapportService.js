/**
 * Service pour les rapports et exports.
 *
 * Fournit les fonctions pour communiquer avec l'API des rapports.
 */

import api from './api'

/**
 * Récupère les statistiques globales
 * @returns {Promise<Object>} Statistiques
 */
export const getStatistiques = async () => {
  const response = await api.get('/rapports/statistiques')
  return response.data
}

/**
 * Récupère le rapport des articles en stock bas
 * @returns {Promise<Object>} Liste des articles en stock bas
 */
export const getRapportStockBas = async () => {
  const response = await api.get('/rapports/stock-bas')
  return response.data
}

/**
 * Récupère le rapport de valeur totale du stock
 * @returns {Promise<Object>} Valeur totale avec détails par catégorie
 */
export const getRapportValeurTotale = async () => {
  const response = await api.get('/rapports/valeur-totale')
  return response.data
}

/**
 * Télécharge un export CSV
 * @param {string} type - Type d'export ('articles', 'mouvements', 'stock-bas')
 * @returns {Promise<void>}
 */
export const exportCSV = async (type = 'articles') => {
  const response = await api.get('/rapports/export/csv', {
    params: { type_export: type },
    responseType: 'blob'
  })

  // Créer un lien de téléchargement
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `export_${type}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Télécharge un export PDF
 * @param {string} type - Type d'export ('inventaire', 'stock-bas')
 * @returns {Promise<void>}
 */
export const exportPDF = async (type = 'inventaire') => {
  const response = await api.get('/rapports/export/pdf', {
    params: { type_export: type },
    responseType: 'blob'
  })

  // Créer un lien de téléchargement
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `rapport_${type}_${new Date().toISOString().split('T')[0]}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Génère un PDF avec les codes-barres des articles sélectionnés
 * @param {number[]} articleIds - Liste des IDs d'articles
 * @returns {Promise<void>}
 */
export const exportBarcodesPDF = async (articleIds) => {
  const response = await api.post('/rapports/export/barcodes-pdf', {
    article_ids: articleIds
  }, {
    responseType: 'blob'
  })

  // Créer un lien de téléchargement
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `codes_barres_${new Date().toISOString().split('T')[0]}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
