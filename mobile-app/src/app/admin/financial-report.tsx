import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { useSelector } from "react-redux";
import { getFinancialReport } from "../../services/operations/adminAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

export default function FinancialReportScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";

  const fetchReport = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getFinancialReport(token);
      if (data) {
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [fetchReport])
  );

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row items-center bg-white dark:bg-richblack-900">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5">Financial Report</Text>
      </View>

      {loading ? (
        <View className="flex-grow justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : !reportData ? (
        <View className="flex-grow justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF476F" />
          <Text className="text-richblack-900 dark:text-richblack-100 font-semibold text-lg mt-4 text-center">
            Could not retrieve report
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-grow px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Platform Metrics Cards */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="w-[48%] bg-white dark:bg-richblack-800 p-4 rounded-xl border border-pure-greys-25 dark:border-richblack-700 mb-3">
              <Text className="text-xxs font-semibold text-richblack-600 dark:text-richblack-400">Total Revenue</Text>
              <Text className="text-xl font-bold text-yellow-50 mt-1">
                ${reportData.totalRevenue?.toLocaleString() || "0"}
              </Text>
            </View>

            <View className="w-[48%] bg-white dark:bg-richblack-800 p-4 rounded-xl border border-pure-greys-25 dark:border-richblack-700 mb-3">
              <Text className="text-xxs font-semibold text-richblack-600 dark:text-richblack-400">Total Sales</Text>
              <Text className="text-xl font-bold text-caribbeangreen-100 mt-1">
                {reportData.totalSales || "0"}
              </Text>
            </View>

            <View className="w-[48%] bg-white dark:bg-richblack-800 p-4 rounded-xl border border-pure-greys-25 dark:border-richblack-700 mb-3">
              <Text className="text-xxs font-semibold text-richblack-600 dark:text-richblack-400">Active Students</Text>
              <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5 mt-1">
                {reportData.totalStudents || "0"}
              </Text>
            </View>

            <View className="w-[48%] bg-white dark:bg-richblack-800 p-4 rounded-xl border border-pure-greys-25 dark:border-richblack-700 mb-3">
              <Text className="text-xxs font-semibold text-richblack-600 dark:text-richblack-400">Instructors</Text>
              <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5 mt-1">
                {reportData.totalInstructors || "0"}
              </Text>
            </View>
          </View>

          {/* Breakdown Section */}
          <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5 mb-3">Course Breakdown</Text>
          {reportData.courseBreakdown?.length === 0 ? (
            <View className="bg-white dark:bg-richblack-800 p-6 rounded-xl border border-pure-greys-25 dark:border-richblack-700 items-center">
              <Text className="text-richblack-600 dark:text-richblack-300 text-xs italic text-center">
                No courses sold or uploaded yet.
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {reportData.courseBreakdown?.map((course: any, idx: number) => (
                <View
                  key={course.id || idx}
                  className="bg-white dark:bg-richblack-800 border border-pure-greys-25 dark:border-richblack-700 rounded-xl p-4 mb-3"
                >
                  <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5" numberOfLines={1}>
                    {course.courseName}
                  </Text>
                  <Text className="text-xxs text-richblack-600 dark:text-richblack-300 mt-0.5">
                    Instructor: {course.instructor}
                  </Text>

                  {/* Financial Metrics Row */}
                  <View className="flex-row justify-between items-center mt-3 pt-2.5 border-t border-pure-greys-50 dark:border-richblack-700">
                    <View className="items-center flex-1 border-r border-pure-greys-50 dark:border-richblack-700">
                      <Text className="text-xxs text-richblack-600 dark:text-richblack-400 font-medium">Price</Text>
                      <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mt-0.5">${course.price}</Text>
                    </View>
                    <View className="items-center flex-1 border-r border-pure-greys-50 dark:border-richblack-700">
                      <Text className="text-xxs text-richblack-600 dark:text-richblack-400 font-medium">Sales</Text>
                      <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mt-0.5">{course.sales}</Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-xxs text-richblack-600 dark:text-richblack-400 font-medium">Revenue</Text>
                      <Text className="text-xs font-bold text-yellow-50 mt-0.5">${course.revenue?.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
