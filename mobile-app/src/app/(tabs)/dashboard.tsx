import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSelector } from "react-redux";
import { getUserEnrolledCourses, getInstructorData } from "../../services/operations/profileAPI";
import { fetchInstructorCourses } from "../../services/operations/courseDetailsAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardScreen() {
  const { user } = useSelector((state: any) => state.profile);
  const { token } = useSelector((state: any) => state.auth);
  const router = useRouter();

  // Student states
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  
  // Instructor states
  const [instructorCourses, setInstructorCourses] = useState<any[]>([]);
  const [instructorStats, setInstructorStats] = useState<any[]>([]);
  const [currChart, setCurrChart] = useState<"students" | "income">("students");

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      if (user?.accountType === "Instructor") {
        const stats = await getInstructorData(token);
        const coursesList = await fetchInstructorCourses(token);
        setInstructorStats(stats || []);
        setInstructorCourses(coursesList || []);
      } else {
        const list = await getUserEnrolledCourses(token);
        setEnrolledCourses(list || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, user?.accountType]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000814", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </View>
    );
  }

  // Instructor Stats Calculation
  const totalAmount = instructorStats?.reduce((acc, curr) => acc + curr.totalAmountGenerated, 0) || 0;
  const totalStudents = instructorStats?.reduce((acc, curr) => acc + curr.totalStudentsEnrolled, 0) || 0;

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View className="flex-row items-center py-6 border-b border-richblack-800">
          <Image
            source={{ uri: user?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName}` }}
            style={{ width: 60, height: 60, borderRadius: 30 }}
          />
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-richblack-5">
              Hello, {user?.firstName || "User"} 👋
            </Text>
            <Text className="text-xs text-richblack-300 mt-1">{user?.email}</Text>
          </View>
          <View className="bg-richblack-800 px-3 py-1 rounded-full border border-richblack-700">
            <Text className="text-xxs font-semibold text-yellow-50">{user?.accountType}</Text>
          </View>
        </View>

        {user?.accountType === "Instructor" ? (
          /* =========================================================================
             INSTRUCTOR DASHBOARD VIEW
             ========================================================================= */
          <View className="mt-6 mb-8">
            {/* Quick Actions */}
            <View className="flex-row justify-between mb-6 space-x-3">
              <TouchableOpacity
                onPress={() => router.push("/add-course")}
                className="flex-1 bg-yellow-50 py-3.5 rounded-xl flex-row justify-center items-center"
              >
                <Ionicons name="add-circle-outline" size={20} color="#000" />
                <Text className="text-richblack-900 font-bold text-sm ml-2">Add Course</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/my-courses")}
                className="flex-1 bg-richblack-800 border border-richblack-700 py-3.5 rounded-xl flex-row justify-center items-center"
              >
                <Ionicons name="list" size={20} color="#FFD60A" />
                <Text className="text-richblack-5 font-bold text-sm ml-2">My Courses</Text>
              </TouchableOpacity>
            </View>

            {/* Statistics */}
            <Text className="text-lg font-bold text-richblack-5 mb-4">Your Statistics</Text>
            <View className="flex-row space-x-3 mb-6">
              <View className="flex-1 bg-richblack-800 p-4 rounded-xl border border-richblack-700">
                <Text className="text-xxs font-medium text-richblack-400">Total Courses</Text>
                <Text className="text-xl font-bold text-richblack-50 mt-1">{instructorCourses.length}</Text>
              </View>
              <View className="flex-1 bg-richblack-800 p-4 rounded-xl border border-richblack-700">
                <Text className="text-xxs font-medium text-richblack-400">Total Students</Text>
                <Text className="text-xl font-bold text-richblack-50 mt-1">{totalStudents}</Text>
              </View>
              <View className="flex-1 bg-richblack-800 p-4 rounded-xl border border-richblack-700">
                <Text className="text-xxs font-medium text-richblack-400">Total Income</Text>
                <Text className="text-xl font-bold text-yellow-50 mt-1">${totalAmount}</Text>
              </View>
            </View>

            {/* Visualization */}
            {instructorCourses.length > 0 && (totalStudents > 0 || totalAmount > 0) ? (
              <View className="bg-richblack-800 p-5 rounded-xl border border-richblack-700 mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-base font-bold text-richblack-5">Visual Distribution</Text>
                  {/* Toggle buttons */}
                  <View className="flex-row bg-richblack-900 p-1 rounded-lg border border-richblack-700">
                    <TouchableOpacity
                      onPress={() => setCurrChart("students")}
                      className={`px-3 py-1 rounded ${currChart === "students" ? "bg-richblack-700" : ""}`}
                    >
                      <Text className={`text-xxs font-bold ${currChart === "students" ? "text-yellow-50" : "text-richblack-300"}`}>
                        Students
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setCurrChart("income")}
                      className={`px-3 py-1 rounded ${currChart === "income" ? "bg-richblack-700" : ""}`}
                    >
                      <Text className={`text-xxs font-bold ${currChart === "income" ? "text-yellow-50" : "text-richblack-300"}`}>
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress bars list for distribution */}
                <View className="space-y-4">
                  {instructorStats.map((courseStat, idx) => {
                    const value = currChart === "students" ? courseStat.totalStudentsEnrolled : courseStat.totalAmountGenerated;
                    const total = currChart === "students" ? totalStudents : totalAmount;
                    const percentage = total > 0 ? (value / total) * 100 : 0;
                    
                    return (
                      <View key={courseStat._id || `stat-${idx}`} className="mb-3">
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="text-xs text-richblack-100 font-medium flex-1 mr-2" numberOfLines={1}>
                            {courseStat.courseName}
                          </Text>
                          <Text className="text-xs font-bold text-yellow-50">
                            {currChart === "students" ? `${value} students` : `$${value}`} ({percentage.toFixed(1)}%)
                          </Text>
                        </View>
                        <View className="w-full h-2.5 bg-richblack-900 rounded-full overflow-hidden border border-richblack-700">
                          <View
                            className="h-full bg-yellow-50 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : instructorCourses.length > 0 ? (
              <View className="bg-richblack-800 p-6 rounded-xl border border-richblack-700 items-center mb-6">
                <Ionicons name="stats-chart-outline" size={32} color="#AFB2BF" />
                <Text className="text-richblack-200 text-sm mt-3 text-center">
                  No sales data yet to visualize.
                </Text>
              </View>
            ) : null}

            {/* Courses list */}
            <View className="bg-richblack-800 p-5 rounded-xl border border-richblack-700">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-base font-bold text-richblack-5">Your Courses</Text>
                <TouchableOpacity onPress={() => router.push("/my-courses")}>
                  <Text className="text-xs font-bold text-yellow-50">View All</Text>
                </TouchableOpacity>
              </View>

              {instructorCourses.length === 0 ? (
                <View className="items-center py-6">
                  <Ionicons name="journal-outline" size={40} color="#AFB2BF" />
                  <Text className="text-richblack-200 text-sm mt-3 text-center">
                    You have not created any courses yet.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/add-course")}
                    className="bg-yellow-50 px-5 py-2 rounded-lg mt-4"
                  >
                    <Text className="text-richblack-900 font-bold text-xs">Create Course</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="space-y-4">
                  {instructorCourses.slice(0, 3).map((course, idx) => (
                    <TouchableOpacity
                      key={course._id || course.id || `icourse-${idx}`}
                      onPress={() => {
                        router.push({
                          pathname: "/edit-course",
                          params: { courseId: course._id || course.id },
                        });
                      }}
                      className="flex-row items-center py-3 border-b border-richblack-700 last:border-0 mb-3"
                    >
                      <Image
                        source={{ uri: course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500" }}
                        style={{ width: 80, height: 50, borderRadius: 6 }}
                        resizeMode="cover"
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-semibold text-richblack-5" numberOfLines={1}>
                          {course.courseName}
                        </Text>
                        <Text className="text-xs text-richblack-300 mt-1">
                          {course.status} • ${course.price}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#838894" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          /* =========================================================================
             STUDENT DASHBOARD VIEW
             ========================================================================= */
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
