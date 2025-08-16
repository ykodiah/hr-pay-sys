"use client"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert, RefreshControl, Share } from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { colors } from "../styles/colors"

interface Payslip {
  id: string
  period: string
  date: string
  basicSalary: number
  allowances: number
  grossSalary: number
  ssnit: number
  paye: number
  providentFund: number
  totalDeductions: number
  netPay: number
}

export default function PayslipsScreen() {
  const { user } = useAuth()
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const payslips: Payslip[] = [
    {
      id: "1",
      period: "December 2024",
      date: "2024-12-31",
      basicSalary: 8464.0,
      allowances: 1200.0,
      grossSalary: 9664.0,
      ssnit: 465.52,
      paye: 1248.98,
      providentFund: 973.36,
      totalDeductions: 2687.86,
      netPay: 6976.14,
    },
    {
      id: "2",
      period: "November 2024",
      date: "2024-11-30",
      basicSalary: 8464.0,
      allowances: 800.0,
      grossSalary: 9264.0,
      ssnit: 465.52,
      paye: 1148.98,
      providentFund: 973.36,
      totalDeductions: 2587.86,
      netPay: 6676.14,
    },
  ]

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const viewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip)
    setModalVisible(true)
  }

  const downloadPayslip = async (payslip: Payslip) => {
    try {
      const payslipContent = generatePayslipContent(payslip)
      await Share.share({
        message: payslipContent,
        title: `Payslip - ${payslip.period}`,
      })
    } catch (error) {
      Alert.alert("Error", "Failed to download payslip")
    }
  }

  const generatePayslipContent = (payslip: Payslip) => {
    return `
AKWAABA HOLDINGS LIMITED
Payslip

Date: ${payslip.date}
Period: ${payslip.period}
Employee: ${user?.name}
Position: ${user?.position}

EARNINGS:
Basic Salary: GH₵ ${payslip.basicSalary.toFixed(2)}
Allowances: GH₵ ${payslip.allowances.toFixed(2)}
Gross Salary: GH₵ ${payslip.grossSalary.toFixed(2)}

DEDUCTIONS:
SSNIT Employee (5.5%): GH₵ ${payslip.ssnit.toFixed(2)}
PAYE: GH₵ ${payslip.paye.toFixed(2)}
Provident Fund: GH₵ ${payslip.providentFund.toFixed(2)}
Total Deductions: GH₵ ${payslip.totalDeductions.toFixed(2)}

NET PAY: GH₵ ${payslip.netPay.toFixed(2)}

AkwaabaHRPay - Welcome to Growth
    `
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Latest Payslip</Text>
          <Text style={styles.summaryAmount}>GH₵ {payslips[0]?.netPay.toFixed(2)}</Text>
          <Text style={styles.summaryPeriod}>{payslips[0]?.period}</Text>
        </View>

        {/* Payslips List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payslip History</Text>
          {payslips.map((payslip) => (
            <View key={payslip.id} style={styles.payslipCard}>
              <View style={styles.payslipHeader}>
                <View>
                  <Text style={styles.payslipPeriod}>{payslip.period}</Text>
                  <Text style={styles.payslipDate}>{payslip.date}</Text>
                </View>
                <Text style={styles.payslipAmount}>GH₵ {payslip.netPay.toFixed(2)}</Text>
              </View>

              <View style={styles.payslipActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => viewPayslip(payslip)}>
                  <Ionicons name="eye-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionText}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => downloadPayslip(payslip)}>
                  <Ionicons name="download-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Payslip Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payslip Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {selectedPayslip && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Company Header */}
              <View style={styles.payslipHeader}>
                <Text style={styles.companyName}>AKWAABA HOLDINGS LIMITED</Text>
                <Text style={styles.payslipTitle}>Payslip</Text>
              </View>

              {/* Employee Info */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>{selectedPayslip.date}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Period:</Text>
                  <Text style={styles.infoValue}>{selectedPayslip.period}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Employee:</Text>
                  <Text style={styles.infoValue}>{user?.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Position:</Text>
                  <Text style={styles.infoValue}>{user?.position}</Text>
                </View>
              </View>

              {/* Earnings & Deductions */}
              <View style={styles.payslipTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>EARNINGS</Text>
                  <Text style={styles.tableHeaderText}>AMOUNT (GH₵)</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Basic Salary</Text>
                  <Text style={styles.tableValue}>{selectedPayslip.basicSalary.toFixed(2)}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Allowances</Text>
                  <Text style={styles.tableValue}>{selectedPayslip.allowances.toFixed(2)}</Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Gross Salary</Text>
                  <Text style={styles.totalValue}>{selectedPayslip.grossSalary.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.payslipTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>DEDUCTIONS</Text>
                  <Text style={styles.tableHeaderText}>AMOUNT (GH₵)</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>SSNIT Employee (5.5%)</Text>
                  <Text style={styles.tableValue}>{selectedPayslip.ssnit.toFixed(2)}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>PAYE</Text>
                  <Text style={styles.tableValue}>{selectedPayslip.paye.toFixed(2)}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Provident Fund</Text>
                  <Text style={styles.tableValue}>{selectedPayslip.providentFund.toFixed(2)}</Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Deductions</Text>
                  <Text style={styles.totalValue}>{selectedPayslip.totalDeductions.toFixed(2)}</Text>
                </View>
              </View>

              {/* Net Pay */}
              <View style={styles.netPaySection}>
                <Text style={styles.netPayLabel}>NET PAY</Text>
                <Text style={styles.netPayValue}>GH₵ {selectedPayslip.netPay.toFixed(2)}</Text>
              </View>

              {/* Footer */}
              <View style={styles.payslipFooter}>
                <Text style={styles.footerText}>AkwaabaHRPay - Welcome to Growth</Text>
                <Text style={styles.printDate}>Print date: {new Date().toLocaleDateString()}</Text>
              </View>
            </ScrollView>
          )}
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
  summaryCard: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    fontFamily: "Inter-Regular",
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    marginTop: 8,
    fontFamily: "Inter-Bold",
  },
  summaryPeriod: {
    fontSize: 14,
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
  payslipCard: {
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
  payslipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  payslipPeriod: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    fontFamily: "Inter-SemiBold",
  },
  payslipDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  payslipAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    fontFamily: "Inter-Bold",
  },
  payslipActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
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
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    fontFamily: "Inter-Bold",
  },
  payslipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginTop: 4,
    fontFamily: "Inter-SemiBold",
  },
  infoSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: "Inter-Regular",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    fontFamily: "Inter-SemiBold",
  },
  payslipTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    fontFamily: "Inter-Bold",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tableLabel: {
    fontSize: 14,
    color: colors.text,
    fontFamily: "Inter-Regular",
  },
  tableValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    fontFamily: "Inter-SemiBold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    fontFamily: "Inter-Bold",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    fontFamily: "Inter-Bold",
  },
  netPaySection: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  netPayLabel: {
    fontSize: 16,
    color: colors.white,
    fontFamily: "Inter-SemiBold",
  },
  netPayValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    marginTop: 4,
    fontFamily: "Inter-Bold",
  },
  payslipFooter: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Inter-Regular",
  },
  printDate: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
})
