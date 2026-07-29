import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchCourseDetails } from "../services/operations/courseDetailsAPI";
import { BuyCourse } from "../services/operations/studentFeaturesAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";

export default function CourseDetailsScreen() {
  const { courseId } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch();
  const { token } = useSelector((state: any) => state.auth);
  const { user } = useSelector((state: any) => state.profile);

  useEffect(() => {
    if (!courseId) return;

    async function loadDetails() {
      try {
        const res = await fetchCourseDetails(courseId as string);
        if (res && res.success) {
          setCourseData(res.data);
        } else {
          Alert.alert("Error", res?.message || "Failed to load course details");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [courseId]);

  const handleBuyCourse = () => {
    if (!token) {
      Alert.alert("Authentication Required", "Please log in to buy this course.", [
        { text: "Login", onPress: () => router.push("/(auth)/login") },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }
    BuyCourse(token, [courseId], user, router, dispatch);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000814", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </View>
    );
  }

  if (!courseData) {
    return (
      <SafeAreaView className="flex-1 bg-richblack-900 justify-center items-center">
        <Text className="text-richblack-5">Course not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-yellow-50 px-4 py-2 rounded">
          <Text className="text-black font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const {
    courseName,
    courseDescription,
    instructor,
    price,
    thumbnail,
    courseContent,
    ratingAndReviews,
  } = courseData.courseDetails;

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      {/* Custom Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-richblack-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#F1F2FF" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-richblack-5" numberOfLines={1}>
          Course Details
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500" }}
          style={{ height: 200, width: "100%" }}
          resizeMode="cover"
        />

        <View className="p-5">
          <Text className="text-2xl font-bold text-richblack-5">{courseName}</Text>
          <Text className="text-sm text-richblack-100 mt-2 leading-relaxed">{courseDescription}</Text>

          <View className="flex-row items-center mt-3 space-x-2">
            <Ionicons name="star" size={16} color="#FFD60A" />
            <Text className="text-sm font-semibold text-yellow-50">
              {ratingAndReviews?.length || 0} reviews
            </Text>
            <Text className="text-sm text-richblack-300 ml-2">
              Instructor: {instructor?.firstName} {instructor?.lastName}
            </Text>
          </View>

          <View className="mt-5 p-4 bg-richblack-800 rounded-xl border border-richblack-700">
            <View className="flex-row justify-between items-center">
              <Text className="text-base text-richblack-100">Course Price</Text>
              <Text className="text-2xl font-bold text-yellow-50">BDT {price}</Text>
            </View>
            <TouchableOpacity
              onPress={handleBuyCourse}
              className="bg-yellow-50 py-3 rounded-lg mt-4 flex-row justify-center items-center"
            >
              <Text className="text-richblack-900 font-bold text-base">Buy Now</Text>
            </TouchableOpacity>
          </View>

          {/* Curriculum Section */}
          <View className="mt-8 mb-6">
            <Text className="text-lg font-bold text-richblack-5 mb-4">Course Curriculum</Text>
            {courseContent?.length === 0 ? (
              <Text className="text-sm italic text-richblack-400">No content uploaded yet.</Text>
            ) : (
              <View className="space-y-4">
                {courseContent.map((section: any, idx: number) => (
                  <View key={section._id || idx} className="bg-richblack-800 rounded-xl border border-richblack-700 p-4 mb-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm font-bold text-richblack-5">{section.sectionName}</Text>
                      <Text className="text-xs text-yellow-50 font-medium">
                        {section.subSection?.length || 0} Lectures
                      </Text>
                    </View>
                    {section.subSection?.length > 0 && (
                      <View className="mt-3 space-y-2.5 border-t border-richblack-700 pt-3">
                        {section.subSection.map((sub: any, sIdx: number) => (
                          <View key={sub._id || sIdx} className="flex-row items-center space-x-2 mr-2 mb-1">
                            <Ionicons name="play-circle-outline" size={16} color="#FFD60A" />
                            <Text className="text-xs text-richblack-100 ml-1">{sub.title}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
