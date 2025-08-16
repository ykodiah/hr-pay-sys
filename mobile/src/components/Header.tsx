"use client"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors } from "../styles/colors"
import { useAuth } from "../context/AuthContext"

interface HeaderProps {
  title: string
  showNotifications?: boolean
  showProfile?: boolean
}

export default function Header({ title, showNotifications = true, showProfile = true }: HeaderProps) {
  const { user } = useAuth()

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        {showNotifications && (
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.white} />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        )}

        {showProfile && (
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    fontFamily: "Inter-Bold",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    fontFamily: "Inter-Bold",
  },
})
