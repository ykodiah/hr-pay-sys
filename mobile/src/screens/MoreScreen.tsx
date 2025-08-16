"use client"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { colors } from "../styles/colors"

export default function MoreScreen() {
  const { user, logout } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  const menuSections = [
    {
      title: "Performance & Development",
      items: [
        { label: "My Goals", icon: "target", action: () => Alert.alert("Goals", "Navigate to goals screen") },
        {
          label: "Performance Reviews",
          icon: "trending-up",
          action: () => Alert.alert("Reviews", "Navigate to reviews"),
        },
        { label: "Learning & Courses", icon: "school", action: () => Alert.alert("Learning", "Navigate to courses") },
        { label: "Certifications", icon: "ribbon", action: () => Alert.alert("Certifications", "View certifications") },
      ],
    },
    {
      title: "Tools & Resources",
      items: [
        {
          label: "Company Directory",
          icon: "people",
          action: () => Alert.alert("Directory", "View company directory"),
        },
        { label: "Policies & Handbook", icon: "book", action: () => Alert.alert("Policies", "View company policies") },
        { label: "IT Support", icon: "desktop", action: () => Alert.alert("IT Support", "Contact IT support") },
        { label: "HR Helpdesk", icon: "help-circle", action: () => Alert.alert("HR Help", "Contact HR helpdesk") },
      ],
    },
    {
      title: "App Settings",
      items: [
        {
          label: "Notifications",
          icon: "notifications",
          action: () => {},
          hasSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchChange: setNotificationsEnabled,
        },
        {
          label: "Biometric Login",
          icon: "finger-print",
          action: () => {},
          hasSwitch: true,
          switchValue: biometricEnabled,
          onSwitchChange: setBiometricEnabled,
        },
        { label: "Language", icon: "language", action: () => Alert.alert("Language", "Change app language") },
        { label: "Privacy Settings", icon: "shield", action: () => Alert.alert("Privacy", "Manage privacy settings") },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help Center", icon: "help", action: () => Alert.alert("Help", "Open help center") },
        { label: "Contact Support", icon: "mail", action: () => Alert.alert("Support", "Contact support team") },
        { label: "Report Issue", icon: "bug", action: () => Alert.alert("Report", "Report an issue") },
        { label: "App Version", icon: "information-circle", action: () => Alert.alert("Version", "App Version 1.0.0") },
      ],
    },
  ]

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: logout,
      },
    ])
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info Header */}
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || "Employee"}</Text>
            <Text style={styles.userTitle}>
              {user?.position} • {user?.department}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[styles.menuItem, itemIndex === section.items.length - 1 && styles.lastMenuItem]}
                  onPress={item.action}
                  disabled={item.hasSwitch}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>
                      <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  {item.hasSwitch ? (
                    <Switch
                      value={item.switchValue}
                      onValueChange={item.onSwitchChange}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.white}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>AkwaabaHRPay Mobile</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Welcome to Growth</Text>
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
  userHeader: {
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    fontFamily: "Inter-Bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    fontFamily: "Inter-Bold",
  },
  userTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  userEmail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 20,
    fontFamily: "Inter-Bold",
  },
  sectionContent: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    color: colors.text,
    fontFamily: "Inter-Regular",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 14,
    color: colors.error,
    marginLeft: 12,
    fontFamily: "Inter-Regular",
  },
  appInfo: {
    alignItems: "center",
    padding: 20,
    marginTop: 20,
  },
  appName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    fontFamily: "Inter-Bold",
  },
  appVersion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  appTagline: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
})
