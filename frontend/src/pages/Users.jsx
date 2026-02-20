/**
 * Page Users - Gestion des utilisateurs (admin only).
 *
 * Permet de lister, créer, modifier les rôles/permissions, et désactiver des utilisateurs.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getUsers, createUser, updateUserRole, updateUserPermissions, deactivateUser, reactivateUser } from '../services/userService'
import { Users as UsersIcon, Plus, UserCog, Shield, UserX, UserCheck, CheckCircle, XCircle } from 'lucide-react'
import Modal from '../components/common/Modal'

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

  // Mutation pour réactiver un utilisateur
  const reactivateMutation = useMutation({
    mutationFn: reactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Utilisateur réactivé avec succès')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la réactivation')
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

  const handleReactivate = (user) => {
    if (window.confirm(`Réactiver l'utilisateur "${user.username}" ?`)) {
      reactivateMutation.mutate(user.id)
    }
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

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner-lg" />
        <span>Chargement des utilisateurs...</span>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UsersIcon size={28} />
            Utilisateurs
          </h1>
          <p className="page-subtitle">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        <div className="page-actions">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            aria-label="Créer un nouvel utilisateur"
          >
            <Plus size={18} />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="card">
        <div className="table-wrapper">
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
                    <span className={`role-badge role-badge-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td data-label="Statut">
                    {user.is_active ? (
                      <span className="user-status active">
                        <CheckCircle size={15} />
                        Actif
                      </span>
                    ) : (
                      <span className="user-status inactive">
                        <XCircle size={15} />
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
                        aria-label="Changer le rôle"
                      >
                        <UserCog size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenPermissionsModal(user)}
                        className="btn btn-sm btn-purple"
                        title="Permissions custom"
                        aria-label="Gérer les permissions"
                      >
                        <Shield size={14} />
                      </button>
                      {user.is_active ? (
                        <button
                          onClick={() => handleDeactivate(user)}
                          className="btn btn-sm btn-danger"
                          title="Désactiver"
                          aria-label="Désactiver l'utilisateur"
                        >
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(user)}
                          className="btn btn-sm btn-success"
                          title="Réactiver"
                          aria-label="Réactiver l'utilisateur"
                        >
                          <UserCheck size={14} />
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
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">Nom d&apos;utilisateur</label>
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
                <label className="form-label required">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Mot de passe</label>
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
                <label className="form-label">Rôle</label>
                <select
                  className="form-control form-select"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="consultation">Consultation</option>
                  <option value="technicien">Technicien</option>
                  <option value="gestionnaire">Gestionnaire</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Création...' : 'Créer'}
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
          title={`Changer le rôle — ${selectedUser.username}`}
        >
          <div className="modal-body">
            <p className="text-muted">
              Rôle actuel : <span className={`role-badge role-badge-${selectedUser.role}`}>{selectedUser.role}</span>
            </p>
            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label">Nouveau rôle</label>
              <select
                className="form-control form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="consultation">Consultation</option>
                <option value="technicien">Technicien</option>
                <option value="gestionnaire">Gestionnaire</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsRoleModalOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleChangeRole}
              disabled={changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Permissions custom */}
      {isPermissionsModalOpen && selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setIsPermissionsModalOpen(false)}
          title={`Permissions custom — ${selectedUser.username}`}
        >
          <div className="modal-body">
            <p className="text-muted">
              Rôle : <strong>{selectedUser.role}</strong> — Cochez les permissions additionnelles
            </p>
            <div className="permissions-list">
              {availablePermissions.map(perm => (
                <label key={perm.value} className="perm-item">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.value)}
                    onChange={() => togglePermission(perm.value)}
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsPermissionsModalOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdatePermissions}
              disabled={updatePermissionsMutation.isPending}
            >
              {updatePermissionsMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Users
