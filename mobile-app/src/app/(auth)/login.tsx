import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { login } from "../../services/operations/authAPI";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogin = () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }
    dispatch(login(email, password, router) as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 justify-center">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-richblack-5 mb-2">Welcome Back</Text>
            <Text className="text-base text-richblack-100">
              Discover your passion, <Text className="italic text-blue-200">Be unstoppable</Text>
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-richblack-5 mb-2">Email Address *</Text>
              <TextInput
                placeholder="Enter email address"
                placeholderTextColor="#999DAA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="w-full bg-richblack-800 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700"
              />
            </View>

            <View className="mt-4">
              <Text className="text-sm font-medium text-richblack-5 mb-2">Password *</Text>
              <TextInput
                placeholder="Enter Password"
                placeholderTextColor="#999DAA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                className="w-full bg-richblack-800 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700"
              />
            </View>

            <TouchableOpacity
              onPress={() => alert("Password reset link is sent via web frontend")}
              className="align-self-end mt-2"
            >
              <Text className="text-xs text-blue-200 text-right">Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="w-full bg-yellow-50 py-3.5 rounded-lg mt-6 flex-row justify-center items-center"
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-richblack-900 font-bold text-center text-base">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-richblack-100 text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text className="text-yellow-50 text-sm font-bold">Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
