import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { courseId, sessionId } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-richblack-900 justify-center items-center px-6">
      {/* Success Icon */}
      <View className="w-24 h-24 rounded-full bg-caribbeangreen-500/20 border-2 border-caribbeangreen-300 justify-center items-center mb-6">
        <Ionicons name="checkmark-circle" size={64} color="#06D6A0" />
      </View>

      {/* Main Title */}
      <Text className="text-2xl font-bold text-richblack-5 text-center mb-2">
        Payment Successful! 🎉
      </Text>

      <Text className="text-sm text-richblack-300 text-center mb-8 leading-relaxed px-4">
        Thank you for your enrollment. Your course access has been activated. Start learning right away!
      </Text>

      {/* Transaction Details Box */}
      <View className="w-full bg-richblack-800 p-5 rounded-2xl border border-richblack-700 mb-8 space-y-3">
        <View className="flex-row justify-between items-center border-b border-richblack-700 pb-3">
          <Text className="text-xs text-richblack-300">Payment Status</Text>
          <View className="bg-caribbeangreen-500/20 px-2.5 py-1 rounded-full border border-caribbeangreen-400">
            <Text className="text-xxs font-bold text-caribbeangreen-200">VERIFIED & PAID</Text>
          </View>
        </View>

        {sessionId ? (
          <View className="flex-row justify-between items-center pt-1">
            <Text className="text-xs text-richblack-300">Session ID</Text>
            <Text className="text-xs font-mono text-richblack-100" numberOfLines={1}>
              {String(sessionId).slice(0, 16)}...
            </Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      <View className="w-full space-y-3">
        {courseId ? (
          <TouchableOpacity
            onPress={() =>
              router.replace({
                pathname: "/view-course",
                params: { courseId: courseId as string },
              })
            }
            className="w-full bg-yellow-50 py-3.5 rounded-xl justify-center items-center flex-row shadow-lg mb-3"
          >
            <Ionicons name="play" size={18} color="#000" />
            <Text className="text-richblack-900 font-bold text-base ml-2">Start Learning Now</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/dashboard")}
          className="w-full bg-richblack-800 border border-richblack-700 py-3.5 rounded-xl justify-center items-center"
        >
          <Text className="text-richblack-100 font-semibold text-base">Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
