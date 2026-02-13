/**
 * Service API pour la gestion des commandes fournisseurs.
 *
 * Fonctionnalités :
 * - Liste paginée avec filtres (statut, fournisseur)
 * - CRUD complet (créer, lire, modifier, supprimer)
 * - Workflow de statut (envoyer, recevoir, annuler)
 * - Génération de PDF pour bon de commande
 */

import api from './api'

/**
 * Récupère la liste paginée des commandes avec filtres optionnels.
 *
 * @param {Object} params - Paramètres de filtrage et pagination
 * @param {number} params.skip - Nombre d'éléments à sauter (pagination)
 * @param {number} params.limit - Nombre d'éléments à retourner
 * @param {string} params.statut - Filtre par statut (BROUILLON, ENVOYEE, RECUE, ANNULEE)
 * @param {number} params.fournisseur_id - Filtre par fournisseur
 * @returns {Promise<{items: Array, total: number, skip: number, limit: number}>}
 */
export const getCommandes = async ({ skip = 0, limit = 100, statut = null, fournisseur_id = null } = {}) => {
  const params = new URLSearchParams()
  params.append('skip', skip)
  params.append('limit', limit)
  if (statut) params.append('statut', statut)
  if (fournisseur_id) params.append('fournisseur_id', fournisseur_id)

  const response = await api.get(`/commandes?${params}`)
  return response.data
}

/**
 * Récupère une commande spécifique par son ID.
 *
 * @param {number} id - ID de la commande
 * @returns {Promise<Object>} La commande avec fournisseur et lignes
 */
export const getCommande = async (id) => {
  const response = await api.get(`/commandes/${id}`)
  return response.data
}

/**
 * Crée une nouvelle commande avec statut BROUILLON.
 *
 * @param {Object} data - Données de la commande
 * @param {number} data.fournisseur_id - ID du fournisseur
 * @param {string} data.numero_commande - Numéro unique de commande
 * @param {string} data.date_reception_prevue - Date de réception prévue (YYYY-MM-DD)
 * @param {string} data.notes - Notes sur la commande
 * @param {Array} data.lignes - Lignes de commande
 * @param {number} data.lignes[].article_id - ID de l'article
 * @param {number} data.lignes[].quantite_commandee - Quantité commandée
 * @param {number} data.lignes[].prix_unitaire - Prix unitaire
 * @returns {Promise<Object>} La commande créée
 */
export const createCommande = async (data) => {
  const response = await api.post('/commandes', data)
  return response.data
}

/**
 * Met à jour une commande existante.
 *
 * Restrictions :
 * - Impossible de modifier une commande RECUE ou ANNULEE
 * - Les lignes ne peuvent être modifiées que pour les commandes BROUILLON
 *
 * @param {number} id - ID de la commande
 * @param {Object} data - Nouvelles données
 * @returns {Promise<Object>} La commande mise à jour
 */
export const updateCommande = async (id, data) => {
  const response = await api.put(`/commandes/${id}`, data)
  return response.data
}

/**
 * Supprime une commande.
 *
 * Restriction : Seules les commandes BROUILLON peuvent être supprimées.
 *
 * @param {number} id - ID de la commande à supprimer
 * @returns {Promise<Object>} Message de confirmation
 */
export const deleteCommande = async (id) => {
  const response = await api.delete(`/commandes/${id}`)
  return response.data
}

/**
 * Envoie une commande (BROUILLON → ENVOYEE).
 *
 * Définit automatiquement date_commande = now()
 *
 * @param {number} id - ID de la commande
 * @returns {Promise<Object>} Commande avec statut mis à jour
 */
export const envoyerCommande = async (id) => {
  const response = await api.post(`/commandes/${id}/envoyer`)
  return response.data
}

/**
 * Réceptionne une commande (ENVOYEE → RECUE).
 *
 * Actions automatiques :
 * - Met à jour quantite_recue = quantite_commandee pour chaque ligne
 * - Incrémente article.quantite de quantite_recue
 * - Crée un mouvement ENTREE pour chaque ligne
 * - Définit date_reception_reelle = now()
 *
 * @param {number} id - ID de la commande
 * @returns {Promise<Object>} Commande réceptionnée avec stock mis à jour
 */
export const recevoirCommande = async (id) => {
  const response = await api.post(`/commandes/${id}/recevoir`)
  return response.data
}

/**
 * Annule une commande (BROUILLON ou ENVOYEE → ANNULEE).
 *
 * Statut final : impossible de revenir en arrière après annulation.
 *
 * @param {number} id - ID de la commande
 * @returns {Promise<Object>} Commande annulée
 */
export const annulerCommande = async (id) => {
  const response = await api.post(`/commandes/${id}/annuler`)
  return response.data
}

/**
 * Télécharge le PDF du bon de commande.
 *
 * @param {number} id - ID de la commande
 * @param {string} numeroCommande - Numéro de commande (pour le nom du fichier)
 */
export const downloadPDF = (id, numeroCommande) => {
  // Utiliser l'URL complète avec le token
  const url = `${api.defaults.baseURL}/commandes/${id}/pdf`

  // Créer un lien temporaire pour télécharger
  const link = document.createElement('a')
  link.href = url
  link.download = `commande_${numeroCommande}.pdf`
  link.setAttribute('target', '_blank')

  // Ajouter l'Authorization header via fetch pour le téléchargement
  const token = localStorage.getItem('token')

  fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob)
      link.href = blobUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    })
    .catch(error => {
      console.error('Erreur lors du téléchargement du PDF:', error)
      throw error
    })
}
