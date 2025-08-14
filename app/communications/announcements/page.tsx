import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Megaphone } from "lucide-react"
import { getAnnouncements } from "@/lib/actions/communications"
import { AnnouncementForm } from "@/components/communications/announcement-form"

async function AnnouncementsList() {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "normal":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Announcements</CardTitle>
        <CardDescription>{announcements.length} announcements found</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement: any) => (
            <div key={announcement.id} className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Megaphone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-gray-400">
                        By {announcement.author?.first_name} {announcement.author?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(announcement.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={getPriorityColor(announcement.priority)}>{announcement.priority}</Badge>
                  <Badge variant="outline">{announcement.target_audience}</Badge>
                </div>
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No announcements found. Create one below.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-2">Manage school-wide announcements</p>
        </div>
      </div>

      {/* Announcements List */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading announcements...</p>
            </CardContent>
          </Card>
        }
      >
        <AnnouncementsList />
      </Suspense>

      {/* Announcement Form */}
      <AnnouncementForm />
    </div>
  )
}
