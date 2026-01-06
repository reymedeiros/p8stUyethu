'use client';

import { useState, useEffect } from 'react';
import { usersAPI } from '@/lib/api';
import { Users, Plus, Edit2, Trash2, Shield, X } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    isAdmin: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.list();
      setUsers(response.data.users);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    
    // Validate username format
    if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      setError('Username must be alphanumeric only');
      return;
    }
    if (formData.username.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }
    
    try {
      await usersAPI.create(
        formData.username,
        formData.email,
        formData.password,
        formData.name,
        formData.isAdmin
      );
      await loadUsers();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    setError('');
    
    // Validate username format if provided
    if (formData.username) {
      if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
        setError('Username must be alphanumeric only');
        return;
      }
      if (formData.username.length > 20) {
        setError('Username must be 20 characters or less');
        return;
      }
    }
    
    try {
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        name: formData.name,
        isAdmin: formData.isAdmin,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await usersAPI.update(editingUser.id, updateData);
      await loadUsers();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(id);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ email: '', name: '', password: '', isAdmin: false });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      isAdmin: user.isAdmin,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ email: '', name: '', password: '', isAdmin: false });
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h2 className="font-semibold">User Management</h2>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.name}</span>
                  {user.isAdmin && (
                    <Shield className="w-4 h-4 text-primary" title="Admin" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Created: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(user)}
                  className="p-2 hover:bg-background rounded-md transition"
                  title="Edit user"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-2 hover:bg-background rounded-md transition text-red-500"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingUser ? 'Edit User' : 'Create User'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-secondary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Password {editingUser && '(leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required={!editingUser}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onChange={(e) =>
                    setFormData({ ...formData, isAdmin: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isAdmin" className="text-sm font-medium flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Admin privileges
                </label>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  onClick={editingUser ? handleUpdate : handleCreate}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
