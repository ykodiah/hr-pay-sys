"use client"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { colors } from "../styles/colors"

interface Goal {
  id: string
  title: string
  description: string
  category: string
  progress: number
  target: number
  unit: string
  dueDate: string
  status: "on-track" | "at-risk" | "completed" | "overdue"
}

export default function GoalsScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const goals: Goal[] = [
    {
      id: "1",
      title: "Complete Sales Training",
      description: "Finish all modules of the advanced sales training program",
      category: "Learning & Development",
      progress: 75,
      target: 100,
      unit: "%",
      dueDate: "2025-01-31",
      status: "on-track",
    },
    {
      id: "2",
      title: "Client Satisfaction Score",
      description: "Maintain client satisfaction rating above 4.5/5",
      category: "Performance",
      progress: 4.2,
      target: 4.5,
      unit: "/5",
      dueDate: "2025-03-31",
      status: "at-risk",
    },
    {
      id: "3",
      title: "Process Improvement",
      description: "Implement 2 process improvements in the department",
      category: "Innovation",
      progress: 2,
      target: 2,
      unit: "items",
      dueDate: "2024-12-31",
      status: "completed",
    },
  ]

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.success
      case "on-track":
        return colors.info
      case "at-risk":
        return colors.warning
      case "overdue":
        return colors.error
      default:
        return colors.textSecondary
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle"
      case "on-track":
        return "trending-up"
      case "at-risk":
        return "warning"
      case "overdue":
        return "alert-circle"
      default:
        return "help-circle"
    }
  }

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.progress / goal.target) * 100, 100)
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Performance Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Performance Overview</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>85%</Text>
              <Text style={styles.statLabel}>Overall Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Goals List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Goals</Text>
          {goals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalCategory}>{goal.category}</Text>
                </View>
                <View style={styles.statusContainer}>
                  <Ionicons name={getStatusIcon(goal.status) as any} size={20} color={getStatusColor(goal.status)} />
                </View>
              </View>

              <Text style={styles.goalDescription}>{goal.description}</Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    {goal.progress}
                    {goal.unit} of {goal.target}
                    {goal.unit}
                  </Text>
                  <Text style={styles.progressPercentage}>{getProgressPercentage(goal).toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getProgressPercentage(goal)}%`,
                        backgroundColor: getStatusColor(goal.status),
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.goalFooter}>
                <Text style={styles.dueDate}>Due: {goal.dueDate}</Text>
                <TouchableOpacity style={styles.updateButton}>
                  <Text style={styles.updateButtonText}>Update Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="trending-up" size={24} color={colors.success} />
              <Text style={styles.insightTitle}>Great Progress!</Text>
            </View>
            <Text style={styles.insightText}>
              You're performing well on your learning goals. Consider focusing more on client satisfaction to improve
              your overall performance score.
            </Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="bulb" size={24} color={colors.warning} />
              <Text style={styles.insightTitle}>Recommendation</Text>
            </View>
            <Text style={styles.insightText}>
              Schedule regular check-ins with clients to gather feedback and improve satisfaction ratings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 16,
    fontFamily: "Inter-Bold",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    fontFamily: "Inter-Bold",
  },
  statLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    marginTop: 4,
    fontFamily: "Inter-Regular",
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
  goalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    fontFamily: "Inter-SemiBold",
  },
  goalCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  statusContainer: {
    marginLeft: 12,
  },
  goalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: "Inter-Regular",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: "Inter-Regular",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    fontFamily: "Inter-SemiBold",
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dueDate: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: "Inter-Regular",
  },
  updateButton: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  updateButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  insightCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 8,
    fontFamily: "Inter-SemiBold",
  },
  insightText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: "Inter-Regular",
  },
})
