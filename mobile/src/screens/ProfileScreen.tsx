"use client"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { colors } from "../styles/colors"

export default function ProfileScreen() {
  const { user } = useAuth()
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+233 24 123 4567",
    address: "123 Independence Ave, Accra",
    emergencyContact: "Jane Asante",
    emergencyPhone: "+233 20 987 6543",
  })

  const profileSections = [
    {
      title: "Personal Information",
      items: [
        { label: "Full Name", value: user?.name || "N/A", icon: "person" },
        { label: "Employee ID", value: user?.employeeId || "N/A", icon: "card" },
        { label: "Email", value: user?.email || "N/A", icon: "mail" },
        { label: "Phone", value: "+233 24 123 4567", icon: "call" },
        { label: "Address", value: "123 Independence Ave, Accra", icon: "location" },
      ],
    },
    {
      title: "Employment Details",
      items: [
        { label: "Position", value: user?.position || "N/A", icon: "briefcase" },
        { label: "Department", value: user?.department || "N/A", icon: "business" },
        { label: "Start Date", value: "January 15, 2023", icon: "calendar" },
        { label: "Employment Type", value: "Full-time", icon: "time" },
        { label: "Manager", value: "John Doe", icon: "people" },
      ],
    },
    {
      title: "Banking Information",
      items: [
        { label: "Bank", value: "GT Bank", icon: "card" },
        { label: "Account Number", value: "20610953414", icon: "keypad" },
        { label: "SSNIT Number", value: "GHA-001689781-4", icon: "shield" },
        { label: "Ghana Card", value: "GHA-123456789-0", icon: "id-card" },
      ],
    },
    {
      title: "Emergency Contact",
      items: [
        { label: "Contact Name", value: "Jane Asante", icon: "person-add" },
        { label: "Relationship", value: "Spouse", icon: "heart" },
        { label: "Phone", value: "+233 20 987 6543", icon: "call" },
      ],
    },
  ]

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const saveProfile = () => {
    Alert.alert("Success", "Profile updated successfully", [
      {
        text: "OK",
        onPress: () => setEditModalVisible(false),
      },
    ])
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{user?.name || "Employee"}</Text>
          <Text style={styles.profileTitle}>
            {user?.position} • {user?.department}
          </Text>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.profileItem}>
                  <View style={styles.itemLeft}>
                    <View style={styles.itemIcon}>
                      <Ionicons name={item.icon as any} size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.itemValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Download Employee Certificate</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Enter full name"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="Enter email"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.address}
                onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                placeholder="Enter address"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Emergency Contact Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.emergencyContact}
                onChangeText={(text) => setEditForm({ ...editForm, emergencyContact: text })}
                placeholder="Enter emergency contact name"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Emergency Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={editForm.emergencyPhone}
                onChangeText={(text) => setEditForm({ ...editForm, emergencyPhone: text })}
                placeholder="Enter emergency contact phone"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  profileHeader: {
    backgroundColor: colors.white,
    alignItems: "center",
    padding: 24,
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    fontFamily: "Inter-Bold",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    fontFamily: "Inter-Bold",
  },
  profileTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
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
  profileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: "Inter-Regular",
  },
  itemValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    textAlign: "right",
    flex: 1,
    fontFamily: "Inter-SemiBold",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
    fontFamily: "Inter-Regular",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    fontFamily: "Inter-Bold",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    fontFamily: "Inter-SemiBold",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.backgroundGray,
    fontFamily: "Inter-Regular",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    fontFamily: "Inter-SemiBold",
  },
})
