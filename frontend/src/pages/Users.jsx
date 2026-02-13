/**
 * Page Users - Gestion des utilisateurs (admin only).
 *
 * Permet de lister, créer, modifier les rôles/permissions, et désactiver des utilisateurs.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getUsers, createUser, updateUserRole, updateUserPermissions, deactivateUser } from '../services/userService'
import { Users as UsersIcon, Plus, UserCog, Shield, UserX, CheckCircle, XCircle } from 'lucide-react'
import Modal from '../components/common/Modal'
import Loader from '../components/common/Loader'

function Users() {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'consultation' })
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState([])

  // Récupérer tous les utilisateurs
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  })

  // Mutation pour créer un utilisateur
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Utilisateur créé avec succès')
      setIsCreateModalOpen(false)
      setNewUser({ username: '', email: '', password: '', role: 'consultation' })
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création')
    }
  })

  // Mutation pour changer le rôle
  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Rôle modifié avec succès')
      setIsRoleModalOpen(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors du changement de rôle')
    }
  })

  // Mutation pour modifier les permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }) => updateUserPermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Permissions modifiées avec succès')
      setIsPermissionsModalOpen(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification des permissions')
    }
  })

  // Mutation pour désactiver un utilisateur
  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Utilisateur désactivé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la désactivation')
    }
  })

  // Handlers
  const handleCreateUser = (e) => {
    e.preventDefault()
    createMutation.mutate(newUser)
  }

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setIsRoleModalOpen(true)
  }

  const handleChangeRole = () => {
    changeRoleMutation.mutate({ userId: selectedUser.id, role: selectedRole })
  }

  const handleOpenPermissionsModal = (user) => {
    setSelectedUser(user)
    setSelectedPermissions(user.permissions || [])
    setIsPermissionsModalOpen(true)
  }

  const handleUpdatePermissions = () => {
    updatePermissionsMutation.mutate({
      userId: selectedUser.id,
      permissions: selectedPermissions.length > 0 ? selectedPermissions : null
    })
  }

  const togglePermission = (permission) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }

  const handleDeactivate = (user) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur "${user.username}" ?`)) {
      deactivateMutation.mutate(user.id)
    }
  }

  // Couleurs des badges de rôles
  const roleBadgeColors = {
    admin: '#8b5cf6',          // Violet
    gestionnaire: '#3b82f6',    // Bleu
    technicien: '#10b981',      // Vert
    consultation: '#6b7280'     // Gris
  }

  // Permissions disponibles
  const availablePermissions = [
    { label: 'Articles - Créer', value: 'articles:create' },
    { label: 'Articles - Modifier', value: 'articles:update' },
    { label: 'Articles - Supprimer', value: 'articles:delete' },
    { label: 'Catégories - Créer', value: 'categories:create' },
    { label: 'Catégories - Modifier', value: 'categories:update' },
    { label: 'Catégories - Supprimer', value: 'categories:delete' },
    { label: 'Tags - Créer', value: 'tags:create' },
    { label: 'Tags - Modifier', value: 'tags:update' },
    { label: 'Tags - Supprimer', value: 'tags:delete' },
    { label: 'Fournisseurs - Créer', value: 'fournisseurs:create' },
    { label: 'Fournisseurs - Modifier', value: 'fournisseurs:update' },
    { label: 'Fournisseurs - Supprimer', value: 'fournisseurs:delete' },
    { label: 'Emplacements - Créer', value: 'emplacements:create' },
    { label: 'Emplacements - Modifier', value: 'emplacements:update' },
    { label: 'Emplacements - Supprimer', value: 'emplacements:delete' },
    { label: 'Mouvements - Créer', value: 'mouvements:create' },
    { label: 'Commandes - Créer', value: 'commandes:create' },
    { label: 'Commandes - Modifier', value: 'commandes:update' },
    { label: 'Commandes - Supprimer', value: 'commandes:delete' },
    { label: 'Rapports - Exporter', value: 'rapports:export' },
    { label: 'Utilisateurs - Lire', value: 'users:read' },
    { label: 'Utilisateurs - Créer', value: 'users:create' },
    { label: 'Utilisateurs - Modifier', value: 'users:update' },
    { label: 'Utilisateurs - Supprimer', value: 'users:delete' }
  ]

  if (isLoading) return <Loader />

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">
            <UsersIcon size={32} />
            Utilisateurs
          </h1>
          <p className="page-subtitle">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <Plus size={20} />
          Nouvel utilisateur
        </button>
      </div>

      {/* Liste des utilisateurs */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id}>
                  <td data-label="Utilisateur">
                    <strong>{user.username}</strong>
                  </td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Rôle">
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.875rem',
                      borderRadius: '0.25rem',
                      backgroundColor: roleBadgeColors[user.role] || '#6b7280',
                      color: '#fff',
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td data-label="Statut">
                    {user.is_active ? (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={16} />
                        Actif
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <XCircle size={16} />
                        Inactif
                      </span>
                    )}
                  </td>
                  <td data-label="Créé le">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <button
                        onClick={() => handleOpenRoleModal(user)}
                        className="btn btn-sm btn-secondary"
                        title="Changer le rôle"
                      >
                        <UserCog size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenPermissionsModal(user)}
                        className="btn btn-sm"
                        style={{ backgroundColor: '#8b5cf6', color: '#fff' }}
                        title="Permissions custom"
                      >
                        <Shield size={14} />
                      </button>
                      {user.is_active && (
                        <button
                          onClick={() => handleDeactivate(user)}
                          className="btn btn-sm btn-danger"
                          title="Désactiver"
                        >
                          <UserX size={14} />
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

      {/* Modal Créer utilisateur */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title="Nouvel utilisateur"
        >
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Nom d'utilisateur *</label>
              <input
                type="text"
                className="form-control"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
                minLength={3}
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                className="form-control"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Mot de passe *</label>
              <input
                type="password"
                className="form-control"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label>Rôle</label>
              <select
                className="form-control"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="consultation">Consultation</option>
                <option value="technicien">Technicien</option>
                <option value="gestionnaire">Gestionnaire</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Création...' : 'Créer'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Changer rôle */}
      {isRoleModalOpen && selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setIsRoleModalOpen(false)}
          title={`Changer le rôle - ${selectedUser.username}`}
        >
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Rôle actuel : <strong style={{ color: roleBadgeColors[selectedUser.role] }}>{selectedUser.role}</strong>
          </p>
          <div className="form-group">
            <label>Nouveau rôle</label>
            <select
              className="form-control"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="consultation">Consultation</option>
              <option value="technicien">Technicien</option>
              <option value="gestionnaire">Gestionnaire</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleChangeRole}
              disabled={changeRoleMutation.isLoading}
            >
              {changeRoleMutation.isLoading ? 'Modification...' : 'Modifier'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRoleModalOpen(false)}>
              Annuler
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Permissions custom */}
      {isPermissionsModalOpen && selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setIsPermissionsModalOpen(false)}
          title={`Permissions custom - ${selectedUser.username}`}
        >
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Rôle : <strong>{selectedUser.role}</strong> - Cochez les permissions additionnelles
          </p>
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
            {availablePermissions.map(perm => (
              <label key={perm.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(perm.value)}
                  onChange={() => togglePermission(perm.value)}
                />
                {perm.label}
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdatePermissions}
              disabled={updatePermissionsMutation.isLoading}
            >
              {updatePermissionsMutation.isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPermissionsModalOpen(false)}>
              Annuler
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Users
