"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getMessages(userId?: string) {
  try {
    const supabase = await createServerClient()

    let query = supabase
      .from("messages")
      .select(`
        *,
        sender:sender_id(id, first_name, last_name, email, role),
        message_recipients(
          id,
          recipient_id,
          read_at,
          recipient:recipient_id(id, first_name, last_name, email, role)
        )
      `)
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.or(`sender_id.eq.${userId},message_recipients.recipient_id.eq.${userId}`)
    }

    const { data: messages, error } = await query

    if (error) throw error

    return { messages: messages || [], error: null }
  } catch (error) {
    console.error("Error fetching messages:", error)
    return { messages: [], error: "Failed to fetch messages" }
  }
}

export async function sendMessage(formData: FormData) {
  try {
    const supabase = await createServerClient()

    const subject = formData.get("subject") as string
    const content = formData.get("content") as string
    const recipientIds = formData.getAll("recipients") as string[]
    const priority = (formData.get("priority") as string) || "normal"
    const messageType = (formData.get("message_type") as string) || "message"

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        subject,
        content,
        message_type: messageType,
        priority,
        status: "sent",
      })
      .select()
      .single()

    if (messageError) throw messageError

    // Create message recipients
    const recipients = recipientIds.map((recipientId) => ({
      message_id: message.id,
      recipient_id: recipientId,
    }))

    const { error: recipientsError } = await supabase.from("message_recipients").insert(recipients)

    if (recipientsError) throw recipientsError

    revalidatePath("/communications")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "Failed to send message" }
  }
}

export async function getAnnouncements() {
  try {
    const supabase = await createServerClient()

    const { data: announcements, error } = await supabase
      .from("announcements")
      .select(`
        *,
        author:author_id(id, first_name, last_name, role)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { announcements: announcements || [], error: null }
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return { announcements: [], error: "Failed to fetch announcements" }
  }
}

export async function createAnnouncement(formData: FormData) {
  try {
    const supabase = await createServerClient()

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const targetAudience = formData.get("target_audience") as string
    const priority = (formData.get("priority") as string) || "normal"
    const publishAt = formData.get("publish_at") as string

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase.from("announcements").insert({
      title,
      content,
      author_id: user.id,
      target_audience: targetAudience,
      priority,
      publish_at: publishAt || new Date().toISOString(),
      status: "published",
    })

    if (error) throw error

    revalidatePath("/communications/announcements")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error creating announcement:", error)
    return { success: false, error: "Failed to create announcement" }
  }
}

export async function getNotifications(userId?: string) {
  try {
    const supabase = await createServerClient()

    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: notifications, error } = await query

    if (error) throw error

    return { notifications: notifications || [], error: null }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return { notifications: [], error: "Failed to fetch notifications" }
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)

    if (error) throw error

    revalidatePath("/communications")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

export async function getUsers() {
  try {
    const supabase = await createServerClient()

    const { data: users, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role")
      .order("first_name")

    if (error) throw error

    return { users: users || [], error: null }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { users: [], error: "Failed to fetch users" }
  }
}
