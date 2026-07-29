import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getFullDetailsOfCourse, markLectureAsComplete } from "../services/operations/courseDetailsAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";

export default function ViewCourseScreen() {
  const { courseId, sectionId: initialSectionId, subSectionId: initialSubSectionId } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<any>(null);
  const [completedLectures, setCompletedLectures] = useState<string[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string>((initialSectionId as string) || "");
  const [currentSubSectionId, setCurrentSubSectionId] = useState<string>((initialSubSectionId as string) || "");
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { token } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (!courseId || !token) return;

    async function loadCourseContent() {
      try {
        const data = await getFullDetailsOfCourse(courseId as string, token);
        if (data && data.courseDetails) {
          setCourseData(data);
          setCompletedLectures(data.completedVideos || []);

          if (!currentSectionId && data.courseDetails.courseContent?.length > 0) {
            const firstSec = data.courseDetails.courseContent[0];
            setCurrentSectionId(firstSec._id);
            if (firstSec.subSection?.length > 0) {
              setCurrentSubSectionId(firstSec.subSection[0]._id);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCourseContent();
  }, [courseId, token]);

  const handleMarkComplete = async () => {
    if (completedLectures.includes(currentSubSectionId)) return;

    try {
      const res = await markLectureAsComplete({
        courseId,
        subSectionId: currentSubSectionId,
      }, token);

      if (res) {
        setCompletedLectures([...completedLectures, currentSubSectionId]);
        Alert.alert("Success", "Lecture marked as completed.");
      }
    } catch (err) {
      console.error(err);
    }
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
        <Text className="text-richblack-5">Course content not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-yellow-50 px-4 py-2 rounded">
          <Text className="text-black font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Find active section/subsection details
  const activeSection = courseData.courseDetails.courseContent?.find((sec: any) => sec._id === currentSectionId);
  const activeSubSection = activeSection?.subSection?.find((sub: any) => sub._id === currentSubSectionId);

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      {/* Custom Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-richblack-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#F1F2FF" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-richblack-5" numberOfLines={1}>
          {courseData.courseDetails?.courseName}
        </Text>
      </View>

      {/* Video Player Display Container */}
      <View className="w-full bg-black aspect-video justify-center items-center relative">
        <Ionicons name="film" size={48} color="#838894" />
        <Text className="text-richblack-5 mt-2 text-sm font-semibold px-4 text-center">
          {activeSubSection?.title || "No lecture selected"}
        </Text>
        
        {/* Play Pause Controls Overlays */}
        <TouchableOpacity 
          onPress={() => setIsPlaying(!isPlaying)}
          className="absolute bg-black/60 p-4 rounded-full"
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={36} color="#FFD60A" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
        {/* Lecture description card */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-bold text-richblack-5">{activeSubSection?.title}</Text>
          <Text className="text-sm text-richblack-200 mt-2">{activeSubSection?.description}</Text>

          <View className="flex-row mt-4 space-x-3 items-center">
            {completedLectures.includes(currentSubSectionId) ? (
              <View className="flex-row items-center bg-caribbeangreen-900 border border-caribbeangreen-600 px-3 py-1.5 rounded-lg mr-2">
                <Ionicons name="checkmark-circle" size={16} color="#06D6A0" />
                <Text className="text-caribbeangreen-100 text-xs font-semibold ml-1.5">Completed</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleMarkComplete}
                className="bg-yellow-50 px-4 py-2 rounded-lg mr-2"
              >
                <Text className="text-black text-xs font-bold">Mark as Completed</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section List Accordion */}
        <View className="px-5 py-4 border-t border-richblack-800">
          <Text className="text-base font-bold text-richblack-5 mb-4">Course Contents</Text>
          {courseData.courseDetails.courseContent?.map((section: any) => (
            <View key={section._id} className="mb-4">
              <View className="bg-richblack-800 px-4 py-3 rounded-lg border border-richblack-700">
                <Text className="text-sm font-bold text-richblack-5">{section.sectionName}</Text>
              </View>
              {section.subSection?.length > 0 && (
                <View className="pl-2 mt-2 space-y-2">
                  {section.subSection.map((sub: any) => {
                    const isActive = sub._id === currentSubSectionId;
                    const isDone = completedLectures.includes(sub._id);
                    return (
                      <TouchableOpacity
                        key={sub._id}
                        onPress={() => {
                          setCurrentSectionId(section._id);
                          setCurrentSubSectionId(sub._id);
                        }}
                        className={`flex-row items-center justify-between p-3.5 rounded-lg border mr-2 mb-1.5 ${
                          isActive ? "bg-richblack-800 border-yellow-50" : "bg-richblack-900 border-richblack-800"
                        }`}
                      >
                        <View className="flex-row items-center space-x-2 flex-1 mr-2">
                          <Ionicons
                            name={isDone ? "checkmark-circle" : "play-circle"}
                            size={16}
                            color={isDone ? "#06D6A0" : isActive ? "#FFD60A" : "#838894"}
                          />
                          <Text
                            className={`text-xs ml-1 flex-1 ${isActive ? "text-yellow-50 font-bold" : "text-richblack-100"}`}
                            numberOfLines={1}
                          >
                            {sub.title}
                          </Text>
                        </View>
                        <Text className="text-xxs text-richblack-300">{sub.timeDuration || "5m"}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
