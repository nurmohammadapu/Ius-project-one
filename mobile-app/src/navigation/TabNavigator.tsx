import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useColorScheme } from "nativewind";

import HomeScreen from "../app/(tabs)/index";
import CatalogScreen from "../app/(tabs)/catalog";
import DashboardScreen from "../app/(tabs)/dashboard";
import ProfileScreen from "../app/(tabs)/profile";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const bottomPadding = Platform.OS === "ios" ? (insets.bottom > 0 ? insets.bottom : 8) : Math.max(insets.bottom, 8);
  const tabHeight = 56 + bottomPadding;
  const isDark = colorScheme === "dark";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#000814" : "#FFFFFF",
          borderTopColor: isDark ? "#161D29" : "#DBDDEA",
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: tabHeight,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: isDark ? "#FFD60A" : "#000814",
        tabBarInactiveTintColor: isDark ? "#838894" : "#6E727F",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{
          title: "Catalog",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

