import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { getAllCourses, fetchCourseCategories } from "../../services/operations/courseDetailsAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadHomeData() {
      try {
        const fetchedCourses = await getAllCourses();
        const fetchedCategories = await fetchCourseCategories();
        setCourses(fetchedCourses || []);
        setCategories(fetchedCategories || []);
      } catch (err) {
        console.error("Home loading error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000814", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header bar */}
        <View className="flex-row justify-between items-center py-4 px-4 border-b border-pure-greys-25 dark:border-richblack-800 bg-white dark:bg-richblack-900">
          <View className="flex-row items-center">
            <Ionicons name="school" size={26} color="#FFD60A" />
            <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5 ml-2">StudyNotion</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <Ionicons name="person-circle-outline" size={28} color="#AFB2BF" />
          </TouchableOpacity>
        </View>

        <View className="px-4">
          {/* Hero Card */}
          <View className="bg-white dark:bg-richblack-800 rounded-2xl p-6 mt-6 border border-pure-greys-25 dark:border-richblack-700">
            <Text className="text-2xl font-extrabold text-richblack-900 dark:text-richblack-5 leading-tight">
              Empower Your Future with <Text className="text-yellow-50 font-extrabold">Coding Skills</Text>
            </Text>
            <Text className="text-sm text-richblack-700 dark:text-richblack-100 mt-2 mb-4 leading-relaxed">
              With our online coding courses, you can learn at your own pace, from anywhere in the world, and get access to a wealth of resources.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/catalog")}
              className="bg-yellow-50 py-3 rounded-lg flex-row justify-center items-center"
            >
              <Text className="text-richblack-900 font-bold text-center">Start Learning Now</Text>
              <Ionicons name="arrow-forward-outline" size={16} color="#000" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          {/* Categories Section */}
          <View className="mt-8">
            <Text className="text-lg font-bold text-richblack-900 dark:text-richblack-5 mb-4">Browse Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3 flex-row">
              {categories.map((item, idx) => (
                <TouchableOpacity
                  key={item._id || item.id || `cat-${idx}`}
                  onPress={() => router.push({ pathname: "/(tabs)/catalog", params: { categoryId: item.id || item._id } })}
                  className="bg-white dark:bg-richblack-800 border border-pure-greys-50 dark:border-richblack-700 px-4 py-2.5 rounded-full mr-2"
                >
                  <Text className="text-richblack-700 dark:text-richblack-100 font-semibold text-xs">{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Featured Courses Section */}
          <View className="mt-8 mb-8">
            <Text className="text-lg font-bold text-richblack-900 dark:text-richblack-5 mb-4">Recommended Courses</Text>
            {courses.length === 0 ? (
              <Text className="text-richblack-500 dark:text-richblack-300 text-sm italic">No courses found.</Text>
            ) : (
              <View className="space-y-4">
                {courses.map((item, idx) => (
                  <TouchableOpacity
                    key={item._id || item.id || `course-${idx}`}
                    onPress={() => router.push({ pathname: "/course-details", params: { courseId: item.id || item._id } })}
                    className="bg-white dark:bg-richblack-800 rounded-xl overflow-hidden border border-pure-greys-25 dark:border-richblack-700 mb-4"
                  >
                    <Image
                      source={{ uri: item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500" }}
                      style={{ height: 160, width: "100%" }}
                      resizeMode="cover"
                    />
                    <View className="p-4">
                      <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5">{item.courseName}</Text>
                      <Text className="text-xs text-richblack-600 dark:text-richblack-300 mt-1" numberOfLines={2}>
                        {item.courseDescription}
                      </Text>
                      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-pure-greys-50 dark:border-richblack-700">
                        <Text className="text-sm font-semibold text-richblack-700 dark:text-richblack-100">
                          By {item.instructor?.firstName} {item.instructor?.lastName}
                        </Text>
                        <Text className="text-base font-bold text-yellow-50">${item.price}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
