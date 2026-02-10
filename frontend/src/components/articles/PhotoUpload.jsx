/**
 * Composant PhotoUpload - Gestion des photos d'articles
 *
 * Fonctionnalités :
 * - Upload par clic ou drag & drop
 * - Validation côté client (type, taille, limite 5 photos)
 * - Galerie avec miniatures
 * - Lightbox pour visualisation plein écran
 * - Suppression avec confirmation
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadPhoto, deletePhoto } from '../../services/photoService'
import { toast } from 'react-toastify'
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react'
import './PhotoUpload.css'

const MAX_PHOTOS = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function PhotoUpload({ articleId, photos = [], onPhotoAdded, onPhotoDeleted }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null) // Pour lightbox
  const queryClient = useQueryClient()

  // Mutation upload
  const uploadMutation = useMutation({
    mutationFn: (file) => uploadPhoto(articleId, file),
    onSuccess: (newPhoto) => {
      toast.success('Photo ajoutée avec succès')
      queryClient.invalidateQueries(['article', articleId])
      queryClient.invalidateQueries(['articles'])
      if (onPhotoAdded) onPhotoAdded(newPhoto)
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Erreur lors de l\'upload'
      toast.error(message)
    }
  })

  // Mutation suppression
  const deleteMutation = useMutation({
    mutationFn: (photoId) => deletePhoto(articleId, photoId),
    onSuccess: (_, photoId) => {
      toast.success('Photo supprimée')
      queryClient.invalidateQueries(['article', articleId])
      queryClient.invalidateQueries(['articles'])
      if (onPhotoDeleted) onPhotoDeleted(photoId)
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Erreur lors de la suppression'
      toast.error(message)
    }
  })

  // Validation fichier
  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WEBP')
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Fichier trop volumineux (max 5 MB)')
      return false
    }

    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos par article`)
      return false
    }

    return true
  }

  // Gestion upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      uploadMutation.mutate(file)
    }
    // Réinitialiser l'input pour permettre le re-upload du même fichier
    e.target.value = ''
  }

  // Drag & drop
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && validateFile(file)) {
      uploadMutation.mutate(file)
    }
  }

  // Suppression avec confirmation
  const handleDelete = (photoId) => {
    if (window.confirm('Supprimer cette photo ?')) {
      deleteMutation.mutate(photoId)
    }
  }

  // Construire l'URL complète de la photo
  const getPhotoUrl = (filepath) => {
    // Le filepath est déjà relatif depuis uploads/ (ex: articles/1/photo.jpg)
    // On doit construire l'URL complète : http://localhost:8000/uploads/articles/1/photo.jpg
    return `${API_URL.replace('/api', '')}/uploads/${filepath}`
  }

  return (
    <div className="photo-upload">
      <h3>Photos ({photos.length}/{MAX_PHOTOS})</h3>

      {/* Zone upload */}
      {photos.length < MAX_PHOTOS && (
        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="photo-input"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploadMutation.isPending}
            style={{ display: 'none' }}
          />

          <label htmlFor="photo-input" className="upload-label">
            {uploadMutation.isPending ? (
              <>
                <Loader className="spin" size={32} />
                <p>Upload en cours...</p>
              </>
            ) : (
              <>
                <Upload size={32} />
                <p>
                  <strong>Cliquez</strong> ou <strong>glissez une image</strong>
                </p>
                <small>JPG, PNG, WEBP • Max 5 MB</small>
              </>
            )}
          </label>
        </div>
      )}

      {/* Galerie photos */}
      {photos.length > 0 ? (
        <div className="photo-gallery">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-item">
              <img
                src={getPhotoUrl(photo.thumbnail_path || photo.filepath)}
                alt={photo.filename}
                onClick={() => setSelectedPhoto(photo)}
                className="photo-thumbnail"
              />
              <button
                type="button"
                className="delete-photo-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(photo.id)
                }}
                disabled={deleteMutation.isPending}
                title="Supprimer"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-photos">
          <ImageIcon size={48} style={{ color: '#ccc' }} />
          <p>Aucune photo</p>
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="lightbox" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>
            <img
              src={getPhotoUrl(selectedPhoto.filepath)}
              alt={selectedPhoto.filename}
            />
            <p className="lightbox-filename">{selectedPhoto.filename}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUpload
