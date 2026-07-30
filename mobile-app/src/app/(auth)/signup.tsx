import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { setSignupData } from "../../redux/slices/authSlice";
import { sendOtp } from "../../services/operations/authAPI";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const [accountType, setAccountType] = useState("Student"); // "Student" | "Instructor"
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { loading } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSignup = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const signupDetails = {
      accountType,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    };

    // Save details to redux so we have them after verifying OTP
    dispatch(setSignupData(signupDetails));
    
    // Trigger OTP sending
    dispatch(sendOtp(email, router) as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="px-6 py-4">
          <View className="mb-6 mt-4">
            <Text className="text-3xl font-bold text-richblack-5 mb-2">Join the Future</Text>
            <Text className="text-base text-richblack-100">
              Build skills for today, tomorrow, and beyond.
            </Text>
          </View>

          {/* Account Type Toggle */}
          <View className="flex-row bg-richblack-800 p-1.5 rounded-full mb-6 border border-richblack-700 max-w-[280px]">
            <TouchableOpacity
              onPress={() => setAccountType("Student")}
              className={`flex-1 py-2 rounded-full ${accountType === "Student" ? "bg-richblack-900" : ""}`}
            >
              <Text className={`text-center font-semibold text-sm ${accountType === "Student" ? "text-richblack-5" : "text-richblack-300"}`}>
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAccountType("Instructor")}
              className={`flex-1 py-2 rounded-full ${accountType === "Instructor" ? "bg-richblack-900" : ""}`}
            >
              <Text className={`text-center font-semibold text-sm ${accountType === "Instructor" ? "text-richblack-5" : "text-richblack-300"}`}>
                Instructor
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-richblack-5 mb-2">First Name *</Text>
                <TextInput
                  placeholder="First name"
                  placeholderTextColor="#999DAA"
                  value={firstName}
                  onChangeText={setFirstName}
                  className="bg-richblack-800 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-richblack-5 mb-2">Last Name *</Text>
                <TextInput
                  placeholder="Last name"
                  placeholderTextColor="#999DAA"
                  value={lastName}
                  onChangeText={setLastName}
                  className="bg-richblack-800 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700"
                />
              </View>
            </View>

            <View className="mt-4">
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
              <Text className="text-sm font-medium text-richblack-5 mb-2">Create Password *</Text>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#999DAA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                className="w-full bg-richblack-800 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700"
              />
            </View>

            <View className="mt-4">
              <Text className="text-sm font-medium text-richblack-5 mb-2">Confirm Password *</Text>
              <TextInput
                placeholder="Confirm password"
                placeholderTextColor="#999DAA"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                className="w-full bg-richblack-800 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700"
              />
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className="w-full bg-yellow-50 py-3.5 rounded-lg mt-6 flex-row justify-center items-center"
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-richblack-900 font-bold text-center text-base">Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center items-center mt-6 mb-4">
            <Text className="text-richblack-100 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className="text-yellow-50 text-sm font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
