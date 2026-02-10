/**
 * Service API pour la gestion des photos d'articles.
 *
 * Endpoints utilisés :
 * - POST   /articles/{article_id}/photos - Upload une photo
 * - DELETE /articles/{article_id}/photos/{photo_id} - Supprime une photo
 * - GET    /articles/{article_id}/photos - Liste toutes les photos d'un article
 */

import api from './api'

/**
 * Upload une photo pour un article.
 *
 * @param {number} articleId - ID de l'article
 * @param {File} file - Fichier image à uploader
 * @returns {Promise<Object>} Photo créée avec ses URLs
 */
export const uploadPhoto = async (articleId, file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post(`/articles/${articleId}/photos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}

/**
 * Supprime une photo.
 *
 * @param {number} articleId - ID de l'article
 * @param {number} photoId - ID de la photo à supprimer
 * @returns {Promise<void>}
 */
export const deletePhoto = async (articleId, photoId) => {
  await api.delete(`/articles/${articleId}/photos/${photoId}`)
}

/**
 * Récupère toutes les photos d'un article.
 *
 * @param {number} articleId - ID de l'article
 * @returns {Promise<Array>} Liste des photos
 */
export const getArticlePhotos = async (articleId) => {
  const response = await api.get(`/articles/${articleId}/photos`)
  return response.data
}
