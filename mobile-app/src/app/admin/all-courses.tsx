import { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Modal, Alert } from "react-native";
import { useSelector } from "react-redux";
import { getAllCourses, toggleCoursePublish } from "../../services/operations/adminAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AllCoursesScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingCourse, setViewingCourse] = useState<any | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAllCourses(token);
      setCourses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [fetchCourses])
  );

  const handleTogglePublish = async (courseId: string, currentStatus: string) => {
    const willPublish = currentStatus !== "Published";
    const success = await toggleCoursePublish(courseId, willPublish, token);
    if (success) {
      const updatedStatus = willPublish ? "Published" : "Draft";
      setCourses((prev) =>
        prev.map((course) =>
          (course.id === courseId || course._id === courseId)
            ? { ...course, status: updatedStatus }
            : course
        )
      );

      // Update modal state if active
      if (viewingCourse && (viewingCourse.id === courseId || viewingCourse._id === courseId)) {
        setViewingCourse((prev: any) => ({
          ...prev,
          status: updatedStatus,
        }));
      }
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-richblack-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#F1F2FF" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-richblack-5">All Courses</Text>
      </View>

      {/* Search Filter */}
      <View className="px-4 py-3 border-b border-richblack-800 bg-richblack-900">
        <View className="flex-row items-center bg-richblack-800 rounded-lg px-3 py-2 border border-richblack-700">
          <Ionicons name="search" size={18} color="#AFB2BF" />
          <TextInput
            placeholder="Search by title, instructor, category..."
            placeholderTextColor="#999DAA"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 text-richblack-5 ml-2 text-sm"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <Ionicons name="close" size={18} color="#AFB2BF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-grow justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : filteredCourses.length === 0 ? (
        <View className="flex-grow justify-center items-center px-6">
          <Ionicons name="book-outline" size={64} color="#AFB2BF" />
          <Text className="text-richblack-100 font-semibold text-lg mt-4 text-center">
            No courses found
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-grow px-4 py-4" showsVerticalScrollIndicator={false}>
          {filteredCourses.map((course, idx) => {
            const courseId = course.id || course._id;
            return (
              <View
                key={courseId || `course-${idx}`}
                className="bg-richblack-800 border border-richblack-700 rounded-xl p-4 mb-4"
              >
                <View className="flex-row items-center mb-3">
                  <Image
                    source={{ uri: course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500" }}
                    style={{ width: 80, height: 50, borderRadius: 6 }}
                    resizeMode="cover"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-bold text-richblack-5" numberOfLines={1}>
                      {course.courseName}
                    </Text>
                    <Text className="text-xxs text-richblack-300 mt-0.5">
                      Instructor: {course.instructor?.firstName} {course.instructor?.lastName}
                    </Text>
                    <Text className="text-xxs text-richblack-400">
                      Category: {course.category?.name || "N/A"}
                    </Text>
                  </View>
                </View>

                {/* Info row */}
                <View className="flex-row justify-between items-center py-2.5 border-t border-richblack-700">
                  <Text className="text-xs text-richblack-200">Price: ${course.price}</Text>
                  <Text className="text-xs text-richblack-200">Students: {course.studentsEnroled?.length || 0}</Text>
                  <View
                    className={`px-2 py-0.5 rounded-full border ${
                      course.status === "Published"
                        ? "bg-caribbeangreen-900/40 border-caribbeangreen-500"
                        : "bg-pink-900/40 border-pink-500"
                    }`}
                  >
                    <Text className={`text-xxs font-bold ${course.status === "Published" ? "text-[#06D6A0]" : "text-[#EF476F]"}`}>
                      {course.status === "Published" ? "Published" : "Draft"}
                    </Text>
                  </View>
                </View>

                {/* Action buttons */}
                <View className="flex-row justify-end space-x-3 pt-2.5 border-t border-richblack-700">
                  <TouchableOpacity
                    onPress={() => setViewingCourse(course)}
                    className="bg-richblack-900 border border-richblack-700 px-3 py-1.5 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="eye-outline" size={16} color="#AFB2BF" />
                    <Text className="text-richblack-100 font-bold text-xs ml-1.5">Review</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleTogglePublish(courseId, course.status)}
                    className={`px-4 py-1.5 rounded-lg border ${
                      course.status === "Published"
                        ? "bg-pink-700/30 border-pink-500"
                        : "bg-yellow-50 border-yellow-50"
                    }`}
                  >
                    <Text className={`font-bold text-xs ${course.status === "Published" ? "text-pink-100" : "text-richblack-900"}`}>
                      {course.status === "Published" ? "Unpublish" : "Publish"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Course Detail Modal */}
      {viewingCourse && (
        <Modal visible={!!viewingCourse} transparent animationType="slide">
          <View className="flex-1 bg-black/80 justify-center items-center px-4 py-8">
            <ScrollView className="w-full bg-richblack-800 rounded-2xl border border-richblack-700 max-h-[90%]" showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View className="flex-row justify-between items-center px-5 py-4 bg-richblack-700 rounded-t-2xl border-b border-richblack-600">
                <Text className="text-base font-bold text-richblack-5">Course Outline & Review</Text>
                <TouchableOpacity onPress={() => setViewingCourse(null)}>
                  <Ionicons name="close" size={24} color="#F1F2FF" />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <View className="p-5">
                {/* Visual outline */}
                <View className="flex-row items-center mb-4 pb-4 border-b border-richblack-700">
                  <Image
                    source={{ uri: viewingCourse.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500" }}
                    style={{ width: 100, height: 60, borderRadius: 6 }}
                    resizeMode="cover"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold text-richblack-5">{viewingCourse.courseName}</Text>
                    <Text className="text-xs text-richblack-300 mt-0.5">
                      Instructor: {viewingCourse.instructor?.firstName} {viewingCourse.instructor?.lastName}
                    </Text>
                    <Text className="text-xs text-richblack-400">
                      Category: {viewingCourse.category?.name || "N/A"} • Price: ${viewingCourse.price}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-xs font-bold text-richblack-200 uppercase mb-1">Description</Text>
                  <Text className="text-xs text-richblack-100 leading-relaxed">
                    {viewingCourse.courseDescription || "No description provided."}
                  </Text>
                </View>

                {/* What you will learn */}
                <View className="mb-4">
                  <Text className="text-xs font-bold text-richblack-200 uppercase mb-1">What you will learn</Text>
                  <Text className="text-xs text-richblack-100 leading-relaxed">
                    {viewingCourse.whatYouWillLearn || "No benefits listed."}
                  </Text>
                </View>

                {/* Section Accordions */}
                <View className="mb-4">
                  <Text className="text-xs font-bold text-richblack-200 uppercase mb-2">Sections & Lectures</Text>
                  {!viewingCourse.courseContent || viewingCourse.courseContent.length === 0 ? (
                    <Text className="text-xs text-richblack-400 italic">No content has been uploaded.</Text>
                  ) : (
                    viewingCourse.courseContent.map((section: any, sIdx: number) => (
                      <View key={section.id || sIdx} className="bg-richblack-900 border border-richblack-700 rounded-lg p-3 mb-3">
                        <Text className="text-xs font-bold text-richblack-5 mb-1.5">
                          Section {sIdx + 1}: {section.sectionName}
                        </Text>
                        {section.subSection?.map((sub: any, subIdx: number) => (
                          <View key={sub.id || subIdx} className="pl-4 py-1 flex-row justify-between items-center border-l border-richblack-700 mt-1">
                            <Text className="text-xxs text-richblack-100 flex-1 mr-2" numberOfLines={1}>
                              {sIdx + 1}.{subIdx + 1} {sub.title}
                            </Text>
                            <Text className="text-xxs text-richblack-400 font-mono">{sub.timeDuration}s</Text>
                          </View>
                        ))}
                      </View>
                    ))
                  )}
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setViewingCourse(null)}
                  className="bg-richblack-700 py-2.5 rounded-lg flex-row justify-center items-center mt-6"
                >
                  <Text className="text-richblack-5 font-bold text-xs">Close Review</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
