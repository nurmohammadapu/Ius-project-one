import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { signUp } from "../../services/operations/authAPI";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const [otp, setOtp] = useState("");
  const { signupData, loading } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleVerifyAndSignup = () => {
    if (!otp) {
      alert("Please enter the OTP");
      return;
    }
    if (!signupData) {
      alert("Signup data missing. Please fill in registration details again.");
      router.push("/(auth)/signup");
      return;
    }

    const {
      accountType,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    } = signupData;

    dispatch(
      signUp(
        accountType,
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        otp,
        router
      ) as any
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="px-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-richblack-900 dark:text-richblack-5 mb-2">Verify Email</Text>
            <Text className="text-base text-richblack-700 dark:text-richblack-100 mb-2">
              A verification code has been sent to your email.
            </Text>
            {signupData?.email && (
              <Text className="text-sm font-semibold text-blue-200">{signupData.email}</Text>
            )}
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-richblack-900 dark:text-richblack-5 mb-2">Verification Code (OTP) *</Text>
              <TextInput
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#999DAA"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                className="w-full bg-white text-richblack-900 border border-pure-greys-50 dark:bg-richblack-800 dark:text-richblack-5 dark:border-richblack-700 px-4 py-3 rounded-lg text-center font-bold tracking-widest text-lg"
              />
            </View>

            <TouchableOpacity
              onPress={handleVerifyAndSignup}
              disabled={loading}
              className="w-full bg-yellow-50 py-3.5 rounded-lg mt-6 flex-row justify-center items-center"
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-richblack-900 font-bold text-center text-base">Verify & Register</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center items-center mt-8">
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className="text-yellow-50 text-sm font-bold">Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
