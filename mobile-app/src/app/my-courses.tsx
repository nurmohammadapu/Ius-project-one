import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { fetchInstructorCourses, deleteCourse } from "../services/operations/courseDetailsAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function MyCoursesScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getCourses = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchInstructorCourses(token);
      setCourses(result || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      getCourses();
    }, [getCourses])
  );

  const handleCourseDelete = async (courseId: string) => {
    Alert.alert(
      "Delete Course",
      "Do you want to delete this course? All the data related to this course will be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await deleteCourse({ courseId }, token);
            if (success) {
              const result = await fetchInstructorCourses(token);
              setCourses(result || []);
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
      <View className="px-4 py-3 border-b border-richblack-800 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#F1F2FF" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-richblack-5">My Courses</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/add-course")}
          className="bg-yellow-50 px-3 py-1.5 rounded-lg flex-row items-center"
        >
          <Ionicons name="add" size={16} color="#000" />
          <Text className="text-richblack-900 font-bold text-xs ml-1">New Course</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : courses.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="folder-open-outline" size={64} color="#AFB2BF" />
          <Text className="text-richblack-100 font-semibold text-lg mt-4 text-center">
            No courses found
          </Text>
          <Text className="text-richblack-300 text-sm text-center mt-2">
            Get started by creating your very first course.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/add-course")}
            className="bg-yellow-50 px-6 py-2.5 rounded-lg mt-6"
          >
            <Text className="text-richblack-900 font-bold text-sm">Add Course</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {courses.map((course, idx) => (
            <View
              key={course._id || course.id || `course-${idx}`}
              className="bg-richblack-800 rounded-xl overflow-hidden border border-richblack-700 mb-5"
            >
              <Image
                source={{ uri: course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500" }}
                style={{ height: 160, width: "100%" }}
                resizeMode="cover"
              />
              <View className="p-4">
                <View className="flex-row justify-between items-start">
                  <Text className="text-base font-bold text-richblack-5 flex-1 mr-2">{course.courseName}</Text>
                  <Text className="text-base font-bold text-yellow-50">${course.price}</Text>
                </View>

                <Text className="text-xs text-richblack-300 mt-1" numberOfLines={2}>
                  {course.courseDescription}
                </Text>

                <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-richblack-700">
                  <View className="flex-row items-center space-x-3">
                    {course.status === "Published" ? (
                      <View className="flex-row items-center bg-caribbeangreen-900/45 border border-caribbeangreen-500 px-2 py-0.5 rounded-full mr-2">
                        <Ionicons name="checkmark-circle" size={10} color="#06D6A0" />
                        <Text className="text-xxs font-bold text-[#06D6A0] ml-1">Published</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center bg-richblack-700/60 border border-richblack-400 px-2 py-0.5 rounded-full mr-2">
                        <Ionicons name="time" size={10} color="#AFB2BF" />
                        <Text className="text-xxs font-bold text-richblack-300 ml-1">Draft</Text>
                      </View>
                    )}
                    <Text className="text-xxs text-richblack-400">Created: {formatDate(course.createdAt)}</Text>
                  </View>

                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: "/edit-course",
                          params: { courseId: course._id || course.id },
                        });
                      }}
                      className="p-1.5 bg-yellow-50 rounded-lg mr-2"
                    >
                      <Ionicons name="create-outline" size={16} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCourseDelete(course._id || course.id)}
                      className="p-1.5 bg-pink-600/30 border border-pink-400 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF476F" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
