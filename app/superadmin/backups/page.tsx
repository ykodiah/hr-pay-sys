'use client'

import { useState, useEffect } from 'react'
import { Download, Trash2, Plus, RotateCw } from 'lucide-react'

interface Backup {
  id: string
  tenant_id: string | null
  backup_type: 'full' | 'incremental' | 'tenant_export'
  backup_size_mb: number
  status: 'in_progress' | 'completed' | 'failed'
  s3_path: string | null
  created_at: string
  retention_until: string
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'tenant_export'>('full')

  useEffect(() => {
    fetchBackups()
  }, [])

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/superadmin/backups')
      if (!response.ok) throw new Error('Failed to fetch backups')
      const data = await response.json()
      setBackups(data.backups || [])
    } catch (error) {
      console.error('Error fetching backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    try {
      const response = await fetch('/api/superadmin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_type: backupType }),
      })

      if (!response.ok) throw new Error('Failed to create backup')
      
      setShowCreateDialog(false)
      fetchBackups()
    } catch (error) {
      console.error('Error creating backup:', error)
      alert('Failed to create backup')
    }
  }

  const handleDownloadBackup = (backup: Backup) => {
    if (backup.s3_path) {
      window.open(`/api/superadmin/backups/${backup.id}/download`, '_blank')
    }
  }

  const handleDeleteBackup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return

    try {
      const response = await fetch(`/api/superadmin/backups/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete backup')
      setBackups(backups.filter(b => b.id !== id))
    } catch (error) {
      console.error('Error deleting backup:', error)
      alert('Failed to delete backup')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'full':
        return 'Full Backup'
      case 'incremental':
        return 'Incremental'
      case 'tenant_export':
        return 'Tenant Export'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Backups</h1>
          <p className="text-gray-600 mt-1">Manage system backups and recovery</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Create Backup
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Total Backups</p>
          <p className="text-2xl font-bold text-gray-900">{backups.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-600">{backups.filter(b => b.status === 'completed').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{backups.filter(b => b.status === 'in_progress').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Total Size</p>
          <p className="text-2xl font-bold text-gray-900">
            {(backups.reduce((sum, b) => sum + (b.backup_size_mb || 0), 0) / 1024).toFixed(1)} GB
          </p>
        </div>
      </div>

      {/* Create Backup Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Backup</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Backup Type</label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full">Full Backup</option>
                  <option value="incremental">Incremental Backup</option>
                  <option value="tenant_export">Tenant Export</option>
                </select>
              </div>
              <p className="text-sm text-gray-600">
                {backupType === 'full' && 'Complete system backup including all data and configurations'}
                {backupType === 'incremental' && 'Only backup changes since last full backup'}
                {backupType === 'tenant_export' && 'Export specific tenant data for archival or migration'}
              </p>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBackup}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backups Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Retention</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading backups...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No backups found
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{getTypeLabel(backup.backup_type)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{backup.backup_size_mb?.toFixed(2)} MB</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                      {backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(backup.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(backup.retention_until).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {backup.status === 'completed' && (
                      <button
                        onClick={() => handleDownloadBackup(backup)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
