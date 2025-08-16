"use client"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Dimensions } from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { colors } from "../styles/colors"

const { width } = Dimensions.get("window")

export default function DashboardScreen() {
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1000)
  }

  const quickActions = [
    { id: 1, title: "View Payslips", icon: "document-text", color: colors.primary },
    { id: 2, title: "Request Leave", icon: "calendar", color: colors.info },
    { id: 3, title: "Update Profile", icon: "person", color: colors.warning },
    { id: 4, title: "Performance", icon: "trending-up", color: colors.success },
  ]

  const recentActivities = [
    {
      id: 1,
      title: "Payslip Generated",
      description: "December 2024 payslip is ready",
      time: "2 hours ago",
      icon: "document-text",
    },
    {
      id: 2,
      title: "Leave Approved",
      description: "Annual leave request approved",
      time: "1 day ago",
      icon: "checkmark-circle",
    },
    { id: 3, title: "Goal Updated", description: "Q4 performance goal updated", time: "3 days ago", icon: "target" },
  ]

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || "Employee"}</Text>
          <Text style={styles.userInfo}>
            {user?.position} • {user?.department}
          </Text>
        </View>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
          </View>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="wallet" size={24} color={colors.primary} />
              <Text style={styles.metricValue}>GH₵ 5,756.14</Text>
            </View>
            <Text style={styles.metricLabel}>Last Net Pay</Text>
            <Text style={styles.metricSubtext}>December 2024</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="calendar" size={24} color={colors.info} />
              <Text style={styles.metricValue}>18</Text>
            </View>
            <Text style={styles.metricLabel}>Leave Balance</Text>
            <Text style={styles.metricSubtext}>Days remaining</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="time" size={24} color={colors.warning} />
              <Text style={styles.metricValue}>160</Text>
            </View>
            <Text style={styles.metricLabel}>Hours Worked</Text>
            <Text style={styles.metricSubtext}>This month</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-up" size={24} color={colors.success} />
              <Text style={styles.metricValue}>85%</Text>
            </View>
            <Text style={styles.metricLabel}>Performance</Text>
            <Text style={styles.metricSubtext}>Q4 Score</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          {recentActivities.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name={activity.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        <View style={styles.eventCard}>
          <View style={styles.eventDate}>
            <Text style={styles.eventDay}>15</Text>
            <Text style={styles.eventMonth}>JAN</Text>
          </View>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>Performance Review</Text>
            <Text style={styles.eventDescription}>Annual performance review with manager</Text>
            <Text style={styles.eventTime}>10:00 AM - 11:00 AM</Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  welcomeSection: {
    backgroundColor: colors.primary,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    fontFamily: "Inter-Regular",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    marginTop: 4,
    fontFamily: "Inter-Bold",
  },
  userInfo: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  avatarContainer: {
    marginLeft: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    fontFamily: "Inter-Bold",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
    fontFamily: "Inter-Bold",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    fontFamily: "Inter-Bold",
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    fontFamily: "Inter-SemiBold",
  },
  metricSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: (width - 52) / 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    fontFamily: "Inter-SemiBold",
  },
  activityContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    fontFamily: "Inter-SemiBold",
  },
  activityDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  activityTime: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventDate: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginRight: 16,
    minWidth: 60,
  },
  eventDay: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    fontFamily: "Inter-Bold",
  },
  eventMonth: {
    fontSize: 12,
    color: colors.white,
    fontFamily: "Inter-SemiBold",
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    fontFamily: "Inter-SemiBold",
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  eventTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  bottomSpacing: {
    height: 20,
  },
})
