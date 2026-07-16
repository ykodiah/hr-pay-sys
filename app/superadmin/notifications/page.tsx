'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  superadmin_user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read_at?: string
  metadata?: Record<string, any>
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    )
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const filteredNotifications =
    filter === 'all'
      ? notifications
      : filter === 'unread'
      ? notifications.filter((n) => !n.read_at)
      : notifications.filter((n) => n.type === filter)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-300 text-green-900'
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900'
      case 'error':
        return 'bg-red-100 border-red-300 text-red-900'
      default:
        return 'bg-blue-100 border-blue-300 text-blue-900'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'warning':
        return '⚠'
      case 'error':
        return '✕'
      default:
        return 'ℹ'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">System alerts and updates</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            className="text-sm"
          >
            Mark All Read
          </Button>
          <Button
            onClick={handleClearAll}
            className="bg-red-600 text-white hover:bg-red-700 text-sm"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'unread', 'info', 'success', 'warning', 'error'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No notifications</div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-lg border p-4 ${getTypeColor(notif.type)} ${
                notif.read_at ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3 flex-1">
                  <span className="text-xl flex-shrink-0">{getTypeIcon(notif.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">{notif.title}</h3>
                    <p className="text-sm mt-1">{notif.message}</p>
                    <p className="text-xs opacity-75 mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!notif.read_at && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="flex-shrink-0 ml-3 px-3 py-1 text-xs font-medium bg-white bg-opacity-50 hover:bg-opacity-75 rounded transition"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-gray-600 text-sm">Total</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {notifications.length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-gray-600 text-sm">Unread</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {notifications.filter((n) => !n.read_at).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-gray-600 text-sm">Read</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {notifications.filter((n) => n.read_at).length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
