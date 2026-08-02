import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from "react-native";
import { useSelector } from "react-redux";
import { getPendingInstructors, manageInstructor } from "../../services/operations/adminAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PendingApprovalsScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getPendingInstructors(token);
      setPendingList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchPending();
    }, [fetchPending])
  );

  const handleAction = async (instructorId: string, action: "approve" | "deny") => {
    Alert.alert(
      `${action === "approve" ? "Approve" : "Deny"} Instructor`,
      `Are you sure you want to ${action} this instructor's application?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "approve" ? "Approve" : "Deny",
          style: action === "approve" ? "default" : "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await manageInstructor(instructorId, action, token);
            if (success) {
              setPendingList((prev) => prev.filter((item) => (item.id !== instructorId && item._id !== instructorId)));
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-richblack-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#F1F2FF" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-richblack-5">Pending Approvals</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : pendingList.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="mail-open-outline" size={64} color="#AFB2BF" />
          <Text className="text-richblack-100 font-semibold text-lg mt-4 text-center">
            No pending approvals
          </Text>
          <Text className="text-richblack-300 text-sm text-center mt-2">
            All registration requests for new Instructors have been processed.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {pendingList.map((item, idx) => {
            const instructorId = item.id || item._id;
            return (
              <View
                key={instructorId || `pending-${idx}`}
                className="bg-richblack-800 border border-richblack-700 rounded-xl p-4 mb-4"
              >
                <View className="flex-row items-center mb-4">
                  <Image
                    source={{
                      uri: item.image || `https://api.dicebear.com/5.x/initials/svg?seed=${item.firstName}`,
                    }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-bold text-richblack-5">
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text className="text-xs text-richblack-300 mt-0.5">{item.email}</Text>
                    <Text className="text-xxs text-richblack-400 mt-0.5">
                      Registered: {formatDate(item.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row justify-end space-x-3 pt-3 border-t border-richblack-700">
                  <TouchableOpacity
                    onPress={() => handleAction(instructorId, "deny")}
                    className="bg-pink-700/35 border border-pink-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-pink-100 font-bold text-xs">Deny</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(instructorId, "approve")}
                    className="bg-caribbeangreen-900/35 border border-caribbeangreen-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-caribbeangreen-100 font-bold text-xs">Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
