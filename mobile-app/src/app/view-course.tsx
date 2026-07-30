import { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getFullDetailsOfCourse, fetchCourseDetails, markLectureAsComplete, createRating } from "../services/operations/courseDetailsAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { Video, ResizeMode } from "expo-av";

export default function ViewCourseScreen() {
  const { courseId, sectionId: initialSectionId, subSectionId: initialSubSectionId } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<any>(null);
  const [completedLectures, setCompletedLectures] = useState<string[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string>((initialSectionId as string) || "");
  const [currentSubSectionId, setCurrentSubSectionId] = useState<string>((initialSubSectionId as string) || "");
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const videoRef = useRef<any>(null);
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);
  const { user } = useSelector((state: any) => state.profile);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    async function loadCourseContent() {
      try {
        let data: any = null;
        if (token) {
          data = await getFullDetailsOfCourse(courseId as string, token);
        }

        const details = data?.courseDetails || data?.data?.courseDetails;
        if (details) {
          setCourseData(data?.courseDetails ? data : data?.data);
          const rawDone = data?.completedVideos || data?.data?.completedVideos || [];
          const normalizedDone = rawDone.map((item: any) => typeof item === "string" ? item : (item.id || item._id));
          setCompletedLectures(normalizedDone);

          if (details.courseContent?.length > 0) {
            const firstSec = details.courseContent[0];
            setCurrentSectionId(firstSec._id || firstSec.id);
            if (firstSec.subSection?.length > 0) {
              setCurrentSubSectionId(firstSec.subSection[0]._id || firstSec.subSection[0].id);
            }
          }
        } else {
          // Fallback to fetchCourseDetails
          const fallbackRes = await fetchCourseDetails(courseId as string);
          if (fallbackRes && (fallbackRes.data || fallbackRes.courseDetails)) {
            const fbData = fallbackRes.data || fallbackRes;
            setCourseData(fbData);
            const fbDetails = fbData.courseDetails || fbData;
            if (fbDetails.courseContent?.length > 0) {
              const firstSec = fbDetails.courseContent[0];
              setCurrentSectionId(firstSec._id || firstSec.id);
              if (firstSec.subSection?.length > 0) {
                setCurrentSubSectionId(firstSec.subSection[0]._id || firstSec.subSection[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.error("View course loading error:", err);
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

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert("Error", "Please write a review message.");
      return;
    }
    setReviewSubmitting(true);
    try {
      const success = await createRating(
        {
          courseId,
          rating,
          review: reviewText,
        },
        token
      );
      if (success) {
        setShowReviewModal(false);
        setReviewText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewSubmitting(false);
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

  // Flatten all subsections to support Next / Previous navigation
  const courseDetails = courseData?.courseDetails || courseData;
  const allSubSections: any[] = [];
  courseDetails?.courseContent?.forEach((section: any) => {
    const secId = section.id || section._id;
    section.subSection?.forEach((sub: any) => {
      const subId = sub.id || sub._id;
      allSubSections.push({ ...sub, id: subId, _id: subId, sectionId: secId });
    });
  });

  const currentIndex = allSubSections.findIndex((sub) => (sub.id || sub._id) === currentSubSectionId);
  const activeSubSection = allSubSections[currentIndex] || allSubSections[0];

  const handleNextLecture = () => {
    if (currentIndex < allSubSections.length - 1) {
      const nextSub = allSubSections[currentIndex + 1];
      setCurrentSectionId(nextSub.sectionId);
      setCurrentSubSectionId(nextSub.id || nextSub._id);
    }
  };

  const handlePrevLecture = () => {
    if (currentIndex > 0) {
      const prevSub = allSubSections[currentIndex - 1];
      setCurrentSectionId(prevSub.sectionId);
      setCurrentSubSectionId(prevSub.id || prevSub._id);
    }
  };

  const isCourseCompleted = allSubSections.length > 0 && completedLectures.length >= allSubSections.length;
  const hasAlreadyReviewed = courseDetails?.ratingAndReviews?.some(
    (rev: any) =>
      (rev.user?.id || rev.user?._id || rev.user) === user?.id ||
      (rev.user?.id || rev.user?._id || rev.user) === user?._id
  );

  const formatDuration = (val: any) => {
    if (!val) return "5m";
    const num = parseFloat(val);
    if (isNaN(num)) return String(val);
    const rounded = Math.round(num);
    if (rounded >= 60) {
      const mins = Math.floor(rounded / 60);
      const secs = rounded % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    return `${rounded}s`;
  };

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-richblack-800">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#F1F2FF" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-richblack-5 flex-1" numberOfLines={1}>
            {courseDetails?.courseName || courseData.courseDetails?.courseName}
          </Text>
        </View>

        {!hasAlreadyReviewed && (
          isCourseCompleted ? (
            <TouchableOpacity
              onPress={() => setShowReviewModal(true)}
              className="bg-yellow-50 px-3 py-1.5 rounded-lg flex-row items-center"
            >
              <Ionicons name="star" size={14} color="#000" />
              <Text className="text-richblack-900 font-bold text-xs ml-1">Add Review</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => Alert.alert("Course Incomplete 🔒", "Please complete all lectures before submitting a review.")}
              className="bg-richblack-800 border border-richblack-700 px-3 py-1.5 rounded-lg flex-row items-center opacity-70"
            >
              <Ionicons name="lock-closed" size={14} color="#AFB2BF" />
              <Text className="text-richblack-300 font-bold text-xs ml-1">Add Review</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Video Player Display Container */}
      <View className="w-full bg-black aspect-video justify-center items-center relative">
        {activeSubSection?.videoUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: activeSubSection.videoUrl }}
            style={{ width: "100%", height: "100%" }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
          />
        ) : (
          <View className="justify-center items-center p-4">
            <Ionicons name="film-outline" size={48} color="#838894" />
            <Text className="text-richblack-5 mt-2 text-sm font-semibold text-center">
              {activeSubSection?.title || "No lecture selected"}
            </Text>
            <Text className="text-richblack-300 text-xs mt-1 text-center">
              Video preview not available for this lecture
            </Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 mt-3" showsVerticalScrollIndicator={false}>
        {/* Lecture description card */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-bold text-richblack-5">{activeSubSection?.title}</Text>
          <Text className="text-sm text-richblack-200 mt-2">{activeSubSection?.description}</Text>

          {/* Controls: Prev / Next / Mark Complete */}
          <View className="flex-row mt-5 items-center justify-between">
            <TouchableOpacity
              onPress={handlePrevLecture}
              disabled={currentIndex <= 0}
              className={`px-3 py-2 rounded-lg flex-row items-center ${
                currentIndex <= 0 ? "bg-richblack-800 opacity-50" : "bg-richblack-800 border border-richblack-700"
              }`}
            >
              <Ionicons name="chevron-back" size={16} color="#F1F2FF" />
              <Text className="text-richblack-5 text-xs font-semibold ml-1">Prev</Text>
            </TouchableOpacity>

            {completedLectures.includes(currentSubSectionId) ? (
              <View className="flex-row items-center bg-caribbeangreen-900 border border-caribbeangreen-600 px-3 py-2 rounded-lg">
                <Ionicons name="checkmark-circle" size={16} color="#06D6A0" />
                <Text className="text-caribbeangreen-100 text-xs font-semibold ml-1.5">Completed</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleMarkComplete}
                className="bg-yellow-50 px-4 py-2 rounded-lg"
              >
                <Text className="text-black text-xs font-bold">Mark Complete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNextLecture}
              disabled={currentIndex >= allSubSections.length - 1}
              className={`px-3 py-2 rounded-lg flex-row items-center ${
                currentIndex >= allSubSections.length - 1 ? "bg-richblack-800 opacity-50" : "bg-richblack-800 border border-richblack-700"
              }`}
            >
              <Text className="text-richblack-5 text-xs font-semibold mr-1">Next</Text>
              <Ionicons name="chevron-forward" size={16} color="#F1F2FF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section List Accordion */}
        <View className="px-5 py-4 border-t border-richblack-800">
          <Text className="text-base font-bold text-richblack-5 mb-4">Course Contents</Text>
          {courseDetails?.courseContent?.map((section: any, sIdx: number) => {
            const secId = section.id || section._id;
            return (
              <View key={secId || `sec-${sIdx}`} className="mb-4">
                <View className="bg-richblack-800 px-4 py-3 rounded-lg border border-richblack-700">
                  <Text className="text-sm font-bold text-richblack-5">{section.sectionName}</Text>
                </View>
                {section.subSection?.length > 0 && (
                  <View className="pl-2 mt-2 space-y-2">
                    {section.subSection.map((sub: any, subIdx: number) => {
                      const subId = sub.id || sub._id;
                      const isActive = subId === currentSubSectionId;
                      const isDone = completedLectures.includes(subId);
                      return (
                        <TouchableOpacity
                          key={subId || `sub-${subIdx}`}
                          onPress={() => {
                            setCurrentSectionId(secId);
                            setCurrentSubSectionId(subId);
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
                        <Text className="text-xxs text-richblack-300">{formatDuration(sub.timeDuration)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-center items-center px-5">
          <View className="w-full bg-richblack-800 p-6 rounded-2xl border border-richblack-700">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-richblack-5">Add Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color="#F1F2FF" />
              </TouchableOpacity>
            </View>

            {/* Star Rating Picker */}
            <Text className="text-sm text-richblack-100 mb-2">Rating</Text>
            <View className="flex-row space-x-2 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} className="px-1">
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color="#FFD60A"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Review Input */}
            <Text className="text-sm text-richblack-100 mb-2">Your Feedback</Text>
            <TextInput
              placeholder="Write your experience with this course..."
              placeholderTextColor="#999DAA"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              style={{ textAlignVertical: "top" }}
              className="w-full bg-richblack-900 text-richblack-5 p-3 rounded-lg border border-richblack-700 min-h-[100px] mb-6"
            />

            <TouchableOpacity
              onPress={handleSubmitReview}
              disabled={reviewSubmitting}
              className="bg-yellow-50 py-3 rounded-lg flex-row justify-center items-center"
            >
              {reviewSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-richblack-900 font-bold text-center">Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
