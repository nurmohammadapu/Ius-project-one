import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../services/operations/authAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user } = useSelector((state: any) => state.profile);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout(router) as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      <View className="px-4 py-3 border-b border-richblack-800">
        <Text className="text-xl font-bold text-richblack-5">My Profile</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* User Card info */}
        <View className="bg-richblack-800 rounded-2xl p-6 border border-richblack-700 items-center mb-6">
          <Image
            source={{ uri: user?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName}` }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
          <Text className="text-xl font-bold text-richblack-5 mt-4">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-sm text-richblack-300 mt-1">{user?.email}</Text>
          <View className="bg-richblack-900 px-3 py-1 rounded-full border border-richblack-700 mt-3">
            <Text className="text-xs font-semibold text-yellow-50">{user?.accountType}</Text>
          </View>
        </View>

        {/* Details List */}
        <View className="bg-richblack-800 rounded-2xl p-6 border border-richblack-700 space-y-4">
          <Text className="text-base font-bold text-richblack-5 mb-2">Profile Details</Text>

          <View className="flex-row justify-between py-2 border-b border-richblack-700 mb-1">
            <Text className="text-sm text-richblack-300">Gender</Text>
            <Text className="text-sm font-semibold text-richblack-5">
              {user?.additionalDetails?.gender || "Not specified"}
            </Text>
          </View>

          <View className="flex-row justify-between py-2 border-b border-richblack-700 mb-1">
            <Text className="text-sm text-richblack-300">Date of Birth</Text>
            <Text className="text-sm font-semibold text-richblack-5">
              {user?.additionalDetails?.dateOfBirth || "Not specified"}
            </Text>
          </View>

          <View className="flex-row justify-between py-2 border-b border-richblack-700 mb-1">
            <Text className="text-sm text-richblack-300">Contact Number</Text>
            <Text className="text-sm font-semibold text-richblack-5">
              {user?.additionalDetails?.contactNumber || "Not specified"}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-pink-300 py-3.5 rounded-xl mt-8 flex-row justify-center items-center"
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text className="text-white font-bold text-base ml-2">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
