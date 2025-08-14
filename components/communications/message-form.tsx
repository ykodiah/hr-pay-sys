"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Send, Users } from "lucide-react"
import { sendMessage } from "@/lib/actions/communications"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
}

interface MessageFormProps {
  users: User[]
}

export function MessageForm({ users }: MessageFormProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRecipientChange = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecipients([...selectedRecipients, userId])
    } else {
      setSelectedRecipients(selectedRecipients.filter((id) => id !== userId))
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)

    // Add selected recipients to form data
    selectedRecipients.forEach((recipientId) => {
      formData.append("recipients", recipientId)
    })

    const result = await sendMessage(formData)

    if (result.success) {
      // Reset form
      setSelectedRecipients([])
      const form = document.getElementById("message-form") as HTMLFormElement
      form?.reset()
    }

    setIsSubmitting(false)
  }

  const groupedUsers = users.reduce(
    (acc, user) => {
      if (!acc[user.role]) acc[user.role] = []
      acc[user.role].push(user)
      return acc
    },
    {} as Record<string, User[]>,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Message
        </CardTitle>
        <CardDescription>Send a message to users in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="message-form" action={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" placeholder="Enter message subject" required />
            </div>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message Content</Label>
            <Textarea id="content" name="content" placeholder="Enter your message here..." rows={6} required />
          </div>

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recipients ({selectedRecipients.length} selected)
            </Label>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-4">
              {Object.entries(groupedUsers).map(([role, roleUsers]) => (
                <div key={role} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                    {role.replace("_", " ")}s ({roleUsers.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {roleUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={user.id}
                          checked={selectedRecipients.includes(user.id)}
                          onCheckedChange={(checked) => handleRecipientChange(user.id, checked as boolean)}
                        />
                        <Label htmlFor={user.id} className="text-sm cursor-pointer">
                          {user.first_name} {user.last_name}
                          <span className="text-gray-500 ml-1">({user.email})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || selectedRecipients.length === 0} className="w-full">
            {isSubmitting ? "Sending..." : `Send Message to ${selectedRecipients.length} Recipients`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
