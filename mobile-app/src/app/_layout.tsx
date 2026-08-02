import { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Stack, useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../redux/store";
import { setToken } from "../redux/slices/authSlice";
import { setUser } from "../redux/slices/profileSlice";
import { getUserDetails } from "../services/operations/profileAPI";
import { View, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";
import { StatusBar } from "expo-status-bar";

function AppContent() {
  const dispatch = useDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { colorScheme } = useColorScheme();
  const { token } = useSelector((state: any) => state.auth);
  const { user } = useSelector((state: any) => state.profile);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  // Load credentials on startup
  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken) {
          const tokenVal = JSON.parse(storedToken);
          dispatch(setToken(tokenVal));

          if (storedUser) {
            dispatch(setUser(JSON.parse(storedUser)));
          }

          // Fetch fresh details from server to verify token
          dispatch(getUserDetails(tokenVal, router) as any);
        }
      } catch (error) {
        console.error("Error bootstrapping app:", error);
      } finally {
        setIsBootstrapped(true);
      }
    }
    bootstrap();
  }, []);

  // Simple auth routing logic
  useEffect(() => {
    if (!isBootstrapped) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth screens
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      // Redirect to main tabs/dashboard based on role
      if (user?.accountType === "Admin" || user?.accountType === "Instructor") {
        router.replace("/(tabs)/dashboard");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [token, user?.accountType, isBootstrapped, segments]);

  if (!isBootstrapped) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000814", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course-details" />
        <Stack.Screen name="view-course" />
        <Stack.Screen name="my-courses" />
        <Stack.Screen name="add-course" />
        <Stack.Screen name="edit-course" />
        <Stack.Screen name="admin/all-students" />
        <Stack.Screen name="admin/all-instructors" />
        <Stack.Screen name="admin/pending-approvals" />
        <Stack.Screen name="admin/all-courses" />
        <Stack.Screen name="admin/financial-report" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
