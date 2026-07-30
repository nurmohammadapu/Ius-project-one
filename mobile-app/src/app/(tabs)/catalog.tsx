import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from "react-native";
import { fetchCourseCategories } from "../../services/operations/courseDetailsAPI";
import { apiConnector } from "../../services/apiConnector";
import { catalogData } from "../../services/apis";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CatalogScreen() {
  const params = useLocalSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categoryPageData, setCategoryPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const router = useRouter();

  // Load all categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const list = await fetchCourseCategories();
        setCategories(list || []);
        if (list && list.length > 0) {
          // If categoryId is passed as param, use it; otherwise use the first one
          const initialId = (params.categoryId as string) || list[0]._id;
          setSelectedCategoryId(initialId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [params.categoryId]);

  // Load courses when selectedCategory changes
  useEffect(() => {
    if (!selectedCategoryId) return;

    async function loadPageDetails() {
      setPageLoading(true);
      try {
        const response = await apiConnector("POST", catalogData.CATALOGPAGEDATA_API, {
          categoryId: selectedCategoryId,
        });
        if (response.data.success) {
          setCategoryPageData(response.data.data);
        }
      } catch (err) {
        console.error("Error loading catalog details:", err);
      } finally {
        setPageLoading(false);
      }
    }
    loadPageDetails();
  }, [selectedCategoryId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000814", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      <View className="px-4 py-3 border-b border-richblack-800">
        <Text className="text-xl font-bold text-richblack-5">Course Catalog</Text>
      </View>

      {/* Horizontal Category Selector */}
      <View className="py-3 px-4 border-b border-richblack-800">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {categories.map((cat, idx) => {
            const catId = cat.id || cat._id;
            const isSelected = catId === selectedCategoryId;
            return (
              <TouchableOpacity
                key={catId || `cat-${idx}`}
                onPress={() => setSelectedCategoryId(catId)}
                className={`px-4 py-2.5 rounded-full mr-2 border ${
                  isSelected ? "bg-yellow-50 border-yellow-50" : "bg-richblack-800 border-richblack-700"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    isSelected ? "text-richblack-900" : "text-richblack-100"
                  }`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {pageLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {categoryPageData ? (
            <View className="space-y-6">
              {/* Category Header */}
              <View className="mb-4">
                <Text className="text-lg font-bold text-richblack-5">
                  Courses in {categoryPageData.selectedCategory?.name}
                </Text>
                <Text className="text-xs text-richblack-300 mt-1">
                  {categoryPageData.selectedCategory?.description}
                </Text>
              </View>

              {/* Render Selected Category Courses */}
              <View className="space-y-4">
                {(!categoryPageData.selectedCategory?.courses ||
                  categoryPageData.selectedCategory?.courses.length === 0) ? (
                  <Text className="text-richblack-400 text-sm italic py-4">No courses available in this category yet.</Text>
                ) : (
                  categoryPageData.selectedCategory?.courses.map((course: any, idx: number) => (
                    <TouchableOpacity
                      key={course.id || course._id || `scourse-${idx}`}
                      onPress={() => router.push({ pathname: "/course-details", params: { courseId: course.id || course._id } })}
                      className="bg-richblack-800 rounded-xl overflow-hidden border border-richblack-700 mb-4 flex-row"
                    >
                      <Image
                        source={{ uri: course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300" }}
                        className="w-24 h-24"
                        resizeMode="cover"
                      />
                      <View className="flex-1 p-3 justify-between">
                        <View>
                          <Text className="text-sm font-bold text-richblack-5" numberOfLines={1}>
                            {course.courseName}
                          </Text>
                          <Text className="text-xs text-richblack-300 mt-1" numberOfLines={2}>
                            {course.courseDescription}
                          </Text>
                        </View>
                        <View className="flex-row justify-between items-center mt-2">
                          <Text className="text-xs font-semibold text-richblack-200">
                            By {course.instructor?.firstName}
                          </Text>
                          <Text className="text-sm font-bold text-yellow-50">${course.price}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Render Different Category Courses */}
              {categoryPageData.differentCategory?.courses?.length > 0 && (
                <View className="mt-6 mb-8">
                  <Text className="text-base font-bold text-richblack-5 mb-3">Other Courses You Might Like</Text>
                  {categoryPageData.differentCategory.courses.slice(0, 3).map((course: any, idx: number) => (
                    <TouchableOpacity
                      key={course.id || course._id || `dcourse-${idx}`}
                      onPress={() => router.push({ pathname: "/course-details", params: { courseId: course.id || course._id } })}
                      className="bg-richblack-800 rounded-xl overflow-hidden border border-richblack-700 mb-3 flex-row"
                    >
                      <Image
                        source={{ uri: course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300" }}
                        className="w-20 h-20"
                        resizeMode="cover"
                      />
                      <View className="flex-1 p-3 justify-between">
                        <Text className="text-xs font-bold text-richblack-5" numberOfLines={1}>
                          {course.courseName}
                        </Text>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-xxs text-richblack-300">By {course.instructor?.firstName}</Text>
                          <Text className="text-xs font-bold text-yellow-50">${course.price}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text className="text-richblack-300 text-sm italic">Select a category to view courses.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
