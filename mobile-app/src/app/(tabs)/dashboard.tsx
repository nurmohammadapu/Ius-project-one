import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSelector } from "react-redux";
import { getUserEnrolledCourses } from "../../services/operations/profileAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardScreen() {
  const { user } = useSelector((state: any) => state.profile);
  const { token } = useSelector((state: any) => state.auth);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchEnrolledCourses = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const list = await getUserEnrolledCourses(token);
      setEnrolledCourses(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchEnrolledCourses();
    }, [fetchEnrolledCourses])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000814", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View className="flex-row items-center py-6 border-b border-richblack-800">
          <Image
            source={{ uri: user?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName}` }}
            style={{ width: 60, height: 60, borderRadius: 30 }}
          />
          <View className="ml-4">
            <Text className="text-xl font-bold text-richblack-5">
              Hello, {user?.firstName || "Student"} 👋
            </Text>
            <Text className="text-xs text-richblack-300 mt-1">{user?.email}</Text>
          </View>
        </View>

        {/* Enrolled Courses */}
        <View className="mt-6 mb-8">
          <Text className="text-lg font-bold text-richblack-5 mb-4">My Enrolled Courses</Text>
          {enrolledCourses.length === 0 ? (
            <View className="p-8 bg-richblack-800 rounded-2xl border border-richblack-700 items-center justify-center">
              <Ionicons name="book-outline" size={48} color="#AFB2BF" />
              <Text className="text-richblack-100 font-semibold mt-4 text-center">
                You have not enrolled in any courses yet.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/catalog")}
                className="bg-yellow-50 px-6 py-2.5 rounded-lg mt-4"
              >
                <Text className="text-richblack-900 font-bold text-sm">Explore Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-4">
              {enrolledCourses.map((course, idx) => {
                // Calculate progress
                const progressPercentage = course.progressPercentage || 0;
                return (
                  <TouchableOpacity
                    key={course._id || course.id || `ecourse-${idx}`}
                    onPress={() => {
                      router.push({
                        pathname: "/view-course",
                        params: { courseId: course._id || course.id },
                      });
                    }}
                    className="bg-richblack-800 rounded-xl overflow-hidden border border-richblack-700 mb-4"
                  >
                    <Image
                      source={{ uri: course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500" }}
                      style={{ height: 140, width: "100%" }}
                      resizeMode="cover"
                    />
                    <View className="p-4">
                      <Text className="text-base font-bold text-richblack-5">{course.courseName}</Text>
                      <Text className="text-xs text-richblack-300 mt-1" numberOfLines={2}>
                        {course.courseDescription}
                      </Text>

                      {/* Progress Bar */}
                      <View className="mt-4">
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="text-xxs text-richblack-200">Progress</Text>
                          <Text className="text-xxs font-bold text-yellow-50">{progressPercentage}%</Text>
                        </View>
                        <View className="w-full h-1.5 bg-richblack-700 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-yellow-50"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
