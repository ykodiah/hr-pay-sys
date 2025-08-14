"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone } from "lucide-react"
import { createAnnouncement } from "@/lib/actions/communications"

export function AnnouncementForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)

    const result = await createAnnouncement(formData)

    if (result.success) {
      // Reset form
      const form = document.getElementById("announcement-form") as HTMLFormElement
      form?.reset()
    }

    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Create Announcement
        </CardTitle>
        <CardDescription>Create a school-wide announcement</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="announcement-form" action={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Enter announcement title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Select name="target_audience" defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="students">Students Only</SelectItem>
                  <SelectItem value="parents">Parents Only</SelectItem>
                  <SelectItem value="staff">Staff Only</SelectItem>
                  <SelectItem value="teachers">Teachers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="normal">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publish_at">Publish Date</Label>
              <Input
                id="publish_at"
                name="publish_at"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" name="content" placeholder="Enter announcement content..." rows={8} required />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Create Announcement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
