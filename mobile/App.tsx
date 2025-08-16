"use client"
import { StatusBar } from "expo-status-bar"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import "./src/components/NotificationManager" // Adding missing dependency import for AsyncStorage functionality

import LoginScreen from "./src/screens/LoginScreen"
import MainTabNavigator from "./src/navigation/MainTabNavigator"
import { AuthProvider, useAuth } from "./src/context/AuthContext"

const Stack = createStackNavigator()

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

function AppNavigator() {
  const { isAuthenticated } = useAuth()

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("./assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("./assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="light" backgroundColor="#10b981" />
    </AuthProvider>
  )
}
