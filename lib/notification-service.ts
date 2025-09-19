// Notification Service for Tax Rate Updates
// Handles email, push, and in-app notifications

interface NotificationChannel {
  email: boolean
  push: boolean
  inApp: boolean
}

interface NotificationPreferences {
  channels: NotificationChannel
  urgentOnly: boolean
  countries: string[]
  frequency: "immediate" | "daily" | "weekly"
}

interface NotificationTemplate {
  subject: string
  body: string
  priority: "low" | "medium" | "high" | "urgent"
}

class NotificationService {
  private templates: Record<string, NotificationTemplate> = {
    tax_update_available: {
      subject: "New Tax Rates Available - {country} {taxYear}",
      body: "New tax rates have been published for {country} {taxYear}. Please review and apply the changes before the effective date of {effectiveDate}.",
      priority: "high",
    },
    compliance_deadline: {
      subject: "Tax Compliance Deadline Approaching - {country}",
      body: "You have {daysRemaining} days remaining to apply the new tax rates for {country} {taxYear}. Failure to update may result in compliance issues.",
      priority: "urgent",
    },
    update_applied: {
      subject: "Tax Rates Successfully Updated - {country}",
      body: "Tax rates for {country} {taxYear} have been successfully applied to your system.",
      priority: "medium",
    },
    api_connection_error: {
      subject: "Tax API Connection Issue - {country}",
      body: "Unable to connect to {country} tax authority API. Tax rate updates may be delayed.",
      priority: "medium",
    },
  }

  /**
   * Send notification about tax rate updates
   */
  async sendTaxUpdateNotification(
    type: string,
    data: Record<string, any>,
    preferences: NotificationPreferences,
  ): Promise<void> {
    console.log(`[v0] Sending ${type} notification...`)

    const template = this.templates[type]
    if (!template) {
      console.error(`[v0] Unknown notification template: ${type}`)
      return
    }

    // Skip if user only wants urgent notifications and this isn't urgent
    if (preferences.urgentOnly && template.priority !== "urgent") {
      return
    }

    // Skip if country is not in user's preferences
    if (data.country && !preferences.countries.includes(data.country.toLowerCase())) {
      return
    }

    const notification = this.buildNotification(template, data)

    // Send through enabled channels
    if (preferences.channels.email) {
      await this.sendEmailNotification(notification, data.userEmail)
    }

    if (preferences.channels.push) {
      await this.sendPushNotification(notification, data.userId)
    }

    if (preferences.channels.inApp) {
      await this.createInAppNotification(notification, data.userId)
    }
  }

  /**
   * Build notification content from template
   */
  private buildNotification(template: NotificationTemplate, data: Record<string, any>) {
    let subject = template.subject
    let body = template.body

    // Replace placeholders with actual data
    Object.keys(data).forEach((key) => {
      const placeholder = `{${key}}`
      subject = subject.replace(new RegExp(placeholder, "g"), data[key])
      body = body.replace(new RegExp(placeholder, "g"), data[key])
    })

    return {
      subject,
      body,
      priority: template.priority,
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: any, userEmail: string): Promise<void> {
    console.log(`[v0] Sending email notification to ${userEmail}`)

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For demo, we'll simulate the email sending
    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log(`[v0] Email sent: ${notification.subject}`)
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: any, userId: string): Promise<void> {
    console.log(`[v0] Sending push notification to user ${userId}`)

    // In production, integrate with push service (Firebase, OneSignal, etc.)
    // For demo, we'll simulate the push notification
    await new Promise((resolve) => setTimeout(resolve, 300))

    console.log(`[v0] Push notification sent: ${notification.subject}`)
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(notification: any, userId: string): Promise<void> {
    console.log(`[v0] Creating in-app notification for user ${userId}`)

    // In production, this would save to database
    // For demo, we'll simulate the database operation
    await new Promise((resolve) => setTimeout(resolve, 200))

    console.log(`[v0] In-app notification created: ${notification.subject}`)
  }

  /**
   * Schedule compliance deadline reminders
   */
  async scheduleComplianceReminders(
    country: string,
    taxYear: number,
    effectiveDate: Date,
    userPreferences: NotificationPreferences,
  ): Promise<void> {
    console.log(`[v0] Scheduling compliance reminders for ${country} ${taxYear}`)

    const now = new Date()
    const daysUntilDeadline = Math.ceil((effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Schedule reminders at different intervals
    const reminderSchedule = [30, 14, 7, 3, 1] // days before deadline

    for (const daysBefore of reminderSchedule) {
      if (daysUntilDeadline > daysBefore) {
        const reminderDate = new Date(effectiveDate)
        reminderDate.setDate(reminderDate.getDate() - daysBefore)

        // In production, this would schedule actual notifications
        console.log(`[v0] Scheduled reminder for ${reminderDate.toDateString()} (${daysBefore} days before deadline)`)
      }
    }
  }

  /**
   * Send batch notifications for multiple updates
   */
  async sendBatchNotifications(updates: any[], userPreferences: NotificationPreferences): Promise<void> {
    console.log(`[v0] Sending batch notifications for ${updates.length} updates`)

    for (const update of updates) {
      await this.sendTaxUpdateNotification(
        "tax_update_available",
        {
          country: update.country,
          taxYear: update.taxYear,
          effectiveDate: update.effectiveDate,
          userEmail: userPreferences.userEmail,
          userId: userPreferences.userId,
        },
        userPreferences,
      )

      // Add small delay to avoid overwhelming the user
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  /**
   * Test notification delivery
   */
  async testNotification(channel: "email" | "push" | "inApp", userContact: string): Promise<boolean> {
    try {
      console.log(`[v0] Testing ${channel} notification to ${userContact}`)

      const testNotification = {
        subject: "Test Notification - Tax Rate Management System",
        body: "This is a test notification to verify your notification settings are working correctly.",
        priority: "low",
      }

      switch (channel) {
        case "email":
          await this.sendEmailNotification(testNotification, userContact)
          break
        case "push":
          await this.sendPushNotification(testNotification, userContact)
          break
        case "inApp":
          await this.createInAppNotification(testNotification, userContact)
          break
      }

      return true
    } catch (error) {
      console.error(`[v0] Test notification failed:`, error)
      return false
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Export types
export type { NotificationPreferences, NotificationChannel }
