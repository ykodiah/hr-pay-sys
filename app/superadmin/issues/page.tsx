'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface Issue {
  id: string
  tenant_id: string | null
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  issue_type: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    issue_type: 'bug',
  })

  useEffect(() => {
    fetchIssues()
  }, [filterStatus, filterPriority])

  const fetchIssues = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterPriority !== 'all') params.append('priority', filterPriority)

      const response = await fetch(`/api/superadmin/issues?${params}`)
      if (!response.ok) throw new Error('Failed to fetch issues')
      const data = await response.json()
      setIssues(data.issues || [])
    } catch (error) {
      console.error('Error fetching issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIssue = async () => {
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }

    try {
      const response = await fetch('/api/superadmin/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to create issue')

      setFormData({ title: '', description: '', priority: 'medium', issue_type: 'bug' })
      setShowCreateDialog(false)
      fetchIssues()
    } catch (error) {
      console.error('Error creating issue:', error)
      alert('Failed to create issue')
    }
  }

  const handleUpdateIssue = async (updates: Partial<Issue>) => {
    if (!selectedIssue) return

    try {
      const response = await fetch(`/api/superadmin/issues/${selectedIssue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Failed to update issue')

      setShowDetailsDialog(false)
      setSelectedIssue(null)
      fetchIssues()
    } catch (error) {
      console.error('Error updating issue:', error)
      alert('Failed to update issue')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'open':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const filteredIssues = issues.filter(issue => {
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false
    if (filterPriority !== 'all' && issue.priority !== filterPriority) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Issues</h1>
          <p className="text-gray-600 mt-1">Manage support tickets and issues</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Issue
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Total Issues</p>
          <p className="text-2xl font-bold">{issues.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Open</p>
          <p className="text-2xl font-bold text-red-600">{issues.filter(i => i.status === 'open').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{issues.filter(i => i.status === 'in_progress').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{issues.filter(i => i.status === 'resolved').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Issue</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Issue title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              />
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={formData.issue_type}
                onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bug">Bug</option>
                <option value="feature_request">Feature Request</option>
                <option value="billing">Billing</option>
                <option value="technical_support">Technical Support</option>
              </select>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIssue}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading issues...</div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No issues found</div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => {
                setSelectedIssue(issue)
                setShowDetailsDialog(true)
              }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(issue.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                        {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {issue.issue_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{issue.status.toUpperCase()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Dialog */}
      {showDetailsDialog && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{selectedIssue.title}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={selectedIssue.status}
                  onChange={(e) => handleUpdateIssue({ status: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={selectedIssue.priority}
                  onChange={(e) => handleUpdateIssue({ priority: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Created:</strong> {new Date(selectedIssue.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setShowDetailsDialog(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
