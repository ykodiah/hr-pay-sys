import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Megaphone, Bell, Eye } from "lucide-react"
import { getMessages, getAnnouncements, getUsers } from "@/lib/actions/communications"
import { MessageForm } from "@/components/communications/message-form"
import Link from "next/link"

async function RecentMessages() {
  const { messages, error } = await getMessages()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading messages: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const recentMessages = messages.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Messages
        </CardTitle>
        <CardDescription>{messages.length} total messages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentMessages.map((message: any) => (
            <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <h4 className="font-medium">{message.subject}</h4>
                <p className="text-sm text-gray-600">
                  From: {message.sender?.first_name} {message.sender?.last_name}
                </p>
                <p className="text-xs text-gray-400">{new Date(message.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={message.priority === "urgent" ? "destructive" : "secondary"}>{message.priority}</Badge>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/communications/messages/${message.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {recentMessages.length === 0 && <p className="text-center text-gray-500 py-4">No messages yet</p>}
        </div>
      </CardContent>
    </Card>
  )
}

async function RecentAnnouncements() {
  const { announcements, error } = await getAnnouncements()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading announcements: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const recentAnnouncements = announcements.slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Recent Announcements
        </CardTitle>
        <CardDescription>{announcements.length} total announcements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentAnnouncements.map((announcement: any) => (
            <div key={announcement.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{announcement.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{announcement.content.substring(0, 100)}...</p>
                  <p className="text-xs text-gray-400 mt-2">
                    By {announcement.author?.first_name} {announcement.author?.last_name} •
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={announcement.priority === "urgent" ? "destructive" : "secondary"}>
                  {announcement.target_audience}
                </Badge>
              </div>
            </div>
          ))}
          {recentAnnouncements.length === 0 && <p className="text-center text-gray-500 py-4">No announcements yet</p>}
        </div>
      </CardContent>
    </Card>
  )
}

async function MessageFormSection() {
  const { users } = await getUsers()
  return <MessageForm users={users} />
}

export default function CommunicationsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600 mt-2">Manage messages, announcements, and notifications</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/communications/messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              All Messages
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/communications/announcements">
              <Megaphone className="h-4 w-4 mr-2" />
              All Announcements
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-gray-600">Unread Messages</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-gray-600">Active Announcements</p>
              </div>
              <Megaphone className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-gray-600">Pending Notifications</p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <Suspense
          fallback={
            <Card>
              <CardContent className="pt-6">
                <p>Loading messages...</p>
              </CardContent>
            </Card>
          }
        >
          <RecentMessages />
        </Suspense>

        {/* Recent Announcements */}
        <Suspense
          fallback={
            <Card>
              <CardContent className="pt-6">
                <p>Loading announcements...</p>
              </CardContent>
            </Card>
          }
        >
          <RecentAnnouncements />
        </Suspense>
      </div>

      {/* Message Form */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading form...</p>
            </CardContent>
          </Card>
        }
      >
        <MessageFormSection />
      </Suspense>
    </div>
  )
}
