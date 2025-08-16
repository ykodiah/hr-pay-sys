"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { useAuth } from "../context/AuthContext"
import { colors } from "../styles/colors"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    setLoading(true)
    const success = await login(email, password)

    if (!success) {
      Alert.alert(
        "Login Failed",
        "Invalid email or password. Try the demo credentials:\nemail: employee@demo.akwaabahr.com\npassword: Employee123!",
      )
    }

    setLoading(false)
  }

  const fillDemoCredentials = () => {
    setEmail("employee@demo.akwaabahr.com")
    setPassword("Employee123!")
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>A</Text>
            </View>
          </View>
          <Text style={styles.title}>AkwaabaHRPay</Text>
          <Text style={styles.subtitle}>Welcome to Growth</Text>
          <Text style={styles.description}>Access your HR portal on the go</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginButtonText}>{loading ? "Signing In..." : "Sign In"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoButton} onPress={fillDemoCredentials}>
            <Text style={styles.demoButtonText}>Use Demo Credentials</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made for Ghana 🇬🇭</Text>
          <Text style={styles.footerSubtext}>Secure • Compliant • Reliable</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.primary,
    fontFamily: "Inter-Bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 8,
    fontFamily: "Inter-Bold",
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 4,
    fontFamily: "Inter-Medium",
  },
  description: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
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
    padding: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.backgroundGray,
    fontFamily: "Inter-Regular",
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  demoButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  demoButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  footer: {
    alignItems: "center",
    marginTop: 48,
  },
  footerText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 4,
    fontFamily: "Inter-Medium",
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.7,
    fontFamily: "Inter-Regular",
  },
})
