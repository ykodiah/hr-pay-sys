"use client"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { colors } from "../styles/colors"
import { useFeatures } from "../../../shared/hooks/useFeatures"

import DashboardScreen from "../screens/DashboardScreen"
import PayslipsScreen from "../screens/PayslipsScreen"
import LeaveScreen from "../screens/LeaveScreen"
import ProfileScreen from "../screens/ProfileScreen"
import MoreScreen from "../screens/MoreScreen"

const Tab = createBottomTabNavigator()

export default function MainTabNavigator() {
  const { isFeatureEnabled } = useFeatures("mobile")

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Payslips") {
            iconName = focused ? "document-text" : "document-text-outline"
          } else if (route.name === "Leave") {
            iconName = focused ? "calendar" : "calendar-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          } else if (route.name === "More") {
            iconName = focused ? "menu" : "menu-outline"
          } else {
            iconName = "home-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Inter-Medium",
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontFamily: "Inter-SemiBold",
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          headerTitle: "AkwaabaHR Dashboard",
        }}
      />
      {isFeatureEnabled("PAYROLL_PROCESSING") && (
        <Tab.Screen
          name="Payslips"
          component={PayslipsScreen}
          options={{
            title: "Payslips",
            headerTitle: "My Payslips",
          }}
        />
      )}
      {isFeatureEnabled("LEAVE_MANAGEMENT") && (
        <Tab.Screen
          name="Leave"
          component={LeaveScreen}
          options={{
            title: "Leave",
            headerTitle: "Leave Requests",
          }}
        />
      )}
      {isFeatureEnabled("PROFILE_MANAGEMENT") && (
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: "Profile",
            headerTitle: "My Profile",
          }}
        />
      )}
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: "More",
          headerTitle: "More Options",
        }}
      />
    </Tab.Navigator>
  )
}
