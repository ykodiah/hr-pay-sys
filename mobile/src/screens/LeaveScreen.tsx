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
import { colors } from "../styles/colors"

interface LeaveRequest {
  id: string
  type: string
  startDate: string
  endDate: string
  days: number
  status: "pending" | "approved" | "rejected"
  reason: string
  appliedDate: string
}

export default function LeaveScreen() {
  const [modalVisible, setModalVisible] = useState(false)
  const [leaveType, setLeaveType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const leaveBalance = {
    annual: 18,
    sick: 5,
    maternity: 0,
    casual: 3,
  }

  const leaveRequests: LeaveRequest[] = [
    {
      id: "1",
      type: "Annual Leave",
      startDate: "2024-12-20",
      endDate: "2024-12-27",
      days: 6,
      status: "approved",
      reason: "Christmas vacation",
      appliedDate: "2024-12-01",
    },
    {
      id: "2",
      type: "Sick Leave",
      startDate: "2024-11-15",
      endDate: "2024-11-16",
      days: 2,
      status: "approved",
      reason: "Medical appointment",
      appliedDate: "2024-11-14",
    },
  ]

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const submitLeaveRequest = () => {
    if (!leaveType || !startDate || !endDate || !reason) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    Alert.alert("Success", "Leave request submitted successfully", [
      {
        text: "OK",
        onPress: () => {
          setModalVisible(false)
          setLeaveType("")
          setStartDate("")
          setEndDate("")
          setReason("")
        },
      },
    ])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return colors.success
      case "rejected":
        return colors.error
      case "pending":
        return colors.warning
      default:
        return colors.textSecondary
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "checkmark-circle"
      case "rejected":
        return "close-circle"
      case "pending":
        return "time"
      default:
        return "help-circle"
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Leave Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          <View style={styles.balanceGrid}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceValue}>{leaveBalance.annual}</Text>
              <Text style={styles.balanceLabel}>Annual Leave</Text>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceValue}>{leaveBalance.sick}</Text>
              <Text style={styles.balanceLabel}>Sick Leave</Text>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceValue}>{leaveBalance.maternity}</Text>
              <Text style={styles.balanceLabel}>Maternity</Text>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceValue}>{leaveBalance.casual}</Text>
              <Text style={styles.balanceLabel}>Casual Leave</Text>
            </View>
          </View>
        </View>

        {/* Request Leave Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.requestButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={24} color={colors.white} />
            <Text style={styles.requestButtonText}>Request Leave</Text>
          </TouchableOpacity>
        </View>

        {/* Leave History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave History</Text>
          {leaveRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestType}>{request.type}</Text>
                  <Text style={styles.requestDates}>
                    {request.startDate} to {request.endDate}
                  </Text>
                  <Text style={styles.requestDays}>{request.days} days</Text>
                </View>
                <View style={styles.statusContainer}>
                  <Ionicons
                    name={getStatusIcon(request.status) as any}
                    size={20}
                    color={getStatusColor(request.status)}
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestReason}>{request.reason}</Text>
              <Text style={styles.appliedDate}>Applied: {request.appliedDate}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Leave Request Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Leave</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Leave Type</Text>
              <View style={styles.typeButtons}>
                {["Annual Leave", "Sick Leave", "Casual Leave", "Maternity Leave"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, leaveType === type && styles.typeButtonActive]}
                    onPress={() => setLeaveType(type)}
                  >
                    <Text style={[styles.typeButtonText, leaveType === type && styles.typeButtonTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>End Date</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reason</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Enter reason for leave..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={submitLeaveRequest}>
              <Text style={styles.submitButtonText}>Submit Request</Text>
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
  balanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    fontFamily: "Inter-Bold",
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  requestButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    fontFamily: "Inter-SemiBold",
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    fontFamily: "Inter-SemiBold",
  },
  requestDates: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  requestDays: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  requestReason: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontFamily: "Inter-Regular",
  },
  appliedDate: {
    fontSize: 12,
    color: colors.textLight,
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
  typeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Inter-Regular",
  },
  typeButtonTextActive: {
    color: colors.white,
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    fontFamily: "Inter-SemiBold",
  },
})
