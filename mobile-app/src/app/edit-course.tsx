import { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Modal, Alert } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { setStep, setCourse, setEditCourse, resetCourseState } from "../redux/slices/courseSlice";
import { getFullDetailsOfCourse, fetchCourseDetails, fetchCourseCategories, editCourseDetails, createSection, updateSection, deleteSection, createSubSection, updateSubSection, deleteSubSection } from "../services/operations/courseDetailsAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function EditCourseScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { courseId } = useLocalSearchParams();
  const { token } = useSelector((state: any) => state.auth);
  const { step, course, editCourse } = useSelector((state: any) => state.course);

  const [loading, setLoading] = useState(true);

  // Initialize and load details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!courseId || !token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await getFullDetailsOfCourse(courseId as string, token);
        if (result?.courseDetails) {
          dispatch(setEditCourse(true));
          dispatch(setCourse(result.courseDetails));
          dispatch(setStep(1));
        } else {
          const fallbackResult = await fetchCourseDetails(courseId as string);
          if (fallbackResult?.data?.courseDetails) {
            dispatch(setEditCourse(true));
            dispatch(setCourse(fallbackResult.data.courseDetails));
            dispatch(setStep(1));
          } else {
            Alert.alert("Error", "Could not fetch course details.");
          }
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "An error occurred while loading course.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [courseId, token]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000814", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD60A" />
        <Text className="text-richblack-100 text-sm font-semibold mt-4">Loading course details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-richblack-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#F1F2FF" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-richblack-5">
          Edit Course
        </Text>
      </View>

      {/* Steps Indicator */}
      <View className="flex-row justify-between items-center px-8 py-5 border-b border-richblack-800 bg-richblack-900">
        {[
          { id: 1, label: "Info" },
          { id: 2, label: "Builder" },
          { id: 3, label: "Publish" },
        ].map((s, idx) => (
          <View key={s.id} className="flex-row items-center flex-1 last:flex-initial">
            <View className="items-center">
              <View
                className={`w-8 h-8 rounded-full justify-center items-center ${
                  step === s.id
                    ? "bg-yellow-900 border border-yellow-50"
                    : step > s.id
                    ? "bg-yellow-50"
                    : "bg-richblack-800 border border-richblack-700"
                }`}
              >
                {step > s.id ? (
                  <Ionicons name="checkmark" size={16} color="#000" />
                ) : (
                  <Text
                    className={`text-xs font-bold ${
                      step === s.id ? "text-yellow-50" : "text-richblack-300"
                    }`}
                  >
                    {s.id}
                  </Text>
                )}
              </View>
              <Text
                className={`text-xxs mt-1 font-semibold ${
                  step >= s.id ? "text-richblack-5" : "text-richblack-400"
                }`}
              >
                {s.label}
              </Text>
            </View>
            {idx < 2 && (
              <View
                className={`flex-1 h-0.5 mx-2 ${
                  step > s.id ? "bg-yellow-50" : "bg-richblack-700"
                }`}
              />
            )}
          </View>
        ))}
      </View>

      <ScrollView className="flex-grow" contentContainerStyle={{ paddingBottom: 40 }}>
        {step === 1 && <CourseInfoStep />}
        {step === 2 && <CourseBuilderStep />}
        {step === 3 && <PublishStep />}
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================================
   STEP 1: COURSE INFORMATION FORM
   ========================================================================= */
function CourseInfoStep() {
  const dispatch = useDispatch();
  const { token } = useSelector((state: any) => state.auth);
  const { course } = useSelector((state: any) => state.course);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState(course?.courseName || "");
  const [description, setDescription] = useState(course?.courseDescription || "");
  const [price, setPrice] = useState(String(course?.price || ""));
  const [selectedCategory, setSelectedCategory] = useState<any>(course?.category || null);
  const [benefits, setBenefits] = useState(course?.whatYouWillLearn || "");
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(course?.thumbnail || null);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>(course?.tag || []);
  const [newReq, setNewReq] = useState("");
  const [requirements, setRequirements] = useState<string[]>(course?.instructions || []);

  useEffect(() => {
    const fetchCats = async () => {
      const res = await fetchCourseCategories();
      setCategories(res || []);
    };
    fetchCats();
  }, []);

  const selectThumbnail = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Allow access to gallery to pick image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, idx) => idx !== index));
  };

  const addRequirement = () => {
    const trimmed = newReq.trim();
    if (trimmed && !requirements.includes(trimmed)) {
      setRequirements([...requirements, trimmed]);
      setNewReq("");
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, idx) => idx !== index));
  };

  const handleNext = async () => {
    if (!title || !description || !price || !selectedCategory || !benefits || !thumbnailUri) {
      Alert.alert("Error", "Please fill in all mandatory fields.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("courseId", course._id || course.id);
      
      // Only append fields that changed or simply re-append all for consistency
      formData.append("courseName", title);
      formData.append("courseDescription", description);
      formData.append("price", price);
      formData.append("tag", JSON.stringify(tags));
      formData.append("whatYouWillLearn", benefits);
      formData.append("category", selectedCategory._id || selectedCategory.id || selectedCategory);
      formData.append("instructions", JSON.stringify(requirements));

      if (thumbnailUri.startsWith("file://") || thumbnailUri.startsWith("content://")) {
        const fileObj: any = {
          uri: thumbnailUri,
          name: thumbnailUri.split("/").pop() || "thumbnail.jpg",
          type: "image/jpeg",
        };
        formData.append("thumbnailImage", fileObj);
      }

      const result = await editCourseDetails(formData, token);
      if (result) {
        dispatch(setCourse(result));
        dispatch(setStep(2));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="px-4 py-5">
      {/* Course Title */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-richblack-5 mb-1.5">Course Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter Course Title"
          placeholderTextColor="#999DAA"
          className="bg-richblack-800 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700"
        />
      </View>

      {/* Short Description */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-richblack-5 mb-1.5">Course Short Description *</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Enter Description"
          placeholderTextColor="#999DAA"
          multiline
          numberOfLines={3}
          className="bg-richblack-800 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700 min-h-[80px]"
        />
      </View>

      {/* Price */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-richblack-5 mb-1.5">Course Price *</Text>
        <View className="flex-row items-center bg-richblack-800 rounded-lg border border-richblack-700 relative">
          <Text className="absolute left-4 text-richblack-400 text-base font-bold">$</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            placeholderTextColor="#999DAA"
            keyboardType="numeric"
            className="w-full text-richblack-5 py-3 pl-9 pr-4 rounded-lg"
          />
        </View>
      </View>

      {/* Category Dropdown */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-richblack-5 mb-1.5">Course Category *</Text>
        <TouchableOpacity
          onPress={() => setShowCategoryModal(true)}
          className="bg-richblack-800 px-4 py-3.5 rounded-lg border border-richblack-700 flex-row justify-between items-center"
        >
          <Text className={selectedCategory ? "text-richblack-5" : "text-richblack-400"}>
            {selectedCategory ? (selectedCategory.name || "Selected Category") : "Choose a Category"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#AFB2BF" />
        </TouchableOpacity>
      </View>

      {/* Tag Inputs */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-richblack-5 mb-1.5">Tags</Text>
        <View className="flex-row mb-2">
          <TextInput
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add tag"
            placeholderTextColor="#999DAA"
            className="flex-1 bg-richblack-800 text-richblack-5 px-4 py-2.5 rounded-l-lg border border-richblack-700 border-r-0"
          />
          <TouchableOpacity
            onPress={addTag}
            className="bg-yellow-50 px-4 justify-center items-center rounded-r-lg"
          >
            <Text className="text-richblack-900 font-bold text-xs">Add</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap mt-1">
          {tags.map((t, idx) => (
            <View key={idx} className="bg-yellow-50 px-2 py-1 rounded-full flex-row items-center m-1">
              <Text className="text-richblack-900 text-xs font-semibold mr-1">{t}</Text>
              <TouchableOpacity onPress={() => removeTag(idx)}>
                <Ionicons name="close-circle" size={14} color="#000" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Course Benefits */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-richblack-5 mb-1.5">Benefits of the Course *</Text>
        <TextInput
          value={benefits}
          onChangeText={setBenefits}
          placeholder="What will students learn from this course?"
          placeholderTextColor="#999DAA"
          multiline
          numberOfLines={3}
          className="bg-richblack-800 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700 min-h-[80px]"
        />
      </View>

      {/* Requirements/Instructions */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-richblack-5 mb-1.5">Requirements/Instructions</Text>
        <View className="flex-row mb-2">
          <TextInput
            value={newReq}
            onChangeText={setNewReq}
            placeholder="Add instruction"
            placeholderTextColor="#999DAA"
            className="flex-1 bg-richblack-800 text-richblack-5 px-4 py-2.5 rounded-l-lg border border-richblack-700 border-r-0"
          />
          <TouchableOpacity
            onPress={addRequirement}
            className="bg-yellow-50 px-4 justify-center items-center rounded-r-lg"
          >
            <Text className="text-richblack-900 font-bold text-xs">Add</Text>
          </TouchableOpacity>
        </View>
        {requirements.map((r, idx) => (
          <View key={idx} className="flex-row justify-between items-center py-1.5 border-b border-richblack-800">
            <Text className="text-xs text-richblack-100 flex-1">{r}</Text>
            <TouchableOpacity onPress={() => removeRequirement(idx)} className="ml-2">
              <Text className="text-pink-200 text-xxs font-bold">Clear</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Thumbnail Upload */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-richblack-5 mb-1.5">Course Thumbnail *</Text>
        <TouchableOpacity
          onPress={selectThumbnail}
          className="bg-richblack-800 aspect-[16/9] rounded-xl border-2 border-dashed border-richblack-700 justify-center items-center overflow-hidden"
        >
          {thumbnailUri ? (
            <Image source={{ uri: thumbnailUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View className="items-center p-6">
              <Ionicons name="cloud-upload-outline" size={32} color="#FFD60A" />
              <Text className="text-xs text-richblack-200 text-center mt-2">
                Click to browse image
              </Text>
              <Text className="text-xxs text-richblack-400 mt-1">Recommended ratio: 16:9</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleNext}
        disabled={loading}
        className="bg-yellow-50 py-3.5 rounded-xl flex-row justify-center items-center"
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Text className="text-richblack-900 font-bold text-sm">Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#000" style={{ marginLeft: 6 }} />
          </>
        )}
      </TouchableOpacity>

      {/* Category picker Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-richblack-800 border-t border-richblack-700 rounded-t-2xl p-5 max-h-[70%]">
            <View className="flex-row justify-between items-center pb-4 border-b border-richblack-700">
              <Text className="text-lg font-bold text-richblack-5">Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#F1F2FF" />
              </TouchableOpacity>
            </View>
            <ScrollView className="py-2">
              {categories.map((c) => (
                <TouchableOpacity
                  key={c._id || c.id}
                  onPress={() => {
                    setSelectedCategory(c);
                    setShowCategoryModal(false);
                  }}
                  className="py-4 border-b border-richblack-700 flex-row justify-between items-center"
                >
                  <Text className="text-richblack-5 font-semibold text-sm">{c.name}</Text>
                  {selectedCategory?._id === c._id && (
                    <Ionicons name="checkmark" size={18} color="#FFD60A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================================================================
   STEP 2: COURSE BUILDER FORM & LECTURES LIST
   ========================================================================= */
function CourseBuilderStep() {
  const dispatch = useDispatch();
  const { token } = useSelector((state: any) => state.auth);
  const { course } = useSelector((state: any) => state.course);

  const [loading, setLoading] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [editSectionId, setEditSectionId] = useState<string | null>(null);

  // Subsection Modal States
  const [showSubModal, setShowSubModal] = useState(false);
  const [subModalMode, setSubModalMode] = useState<"add" | "edit" | "view">("add");
  const [activeSectionId, setActiveSectionId] = useState("");
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const handleCreateOrUpdateSection = async () => {
    if (!sectionName.trim()) {
      Alert.alert("Error", "Section name is required.");
      return;
    }
    setLoading(true);
    try {
      let result;
      if (editSectionId) {
        result = await updateSection(
          {
            sectionName,
            sectionId: editSectionId,
            courseId: course._id || course.id,
          },
          token
        );
      } else {
        result = await createSection(
          {
            sectionName,
            courseId: course._id || course.id,
          },
          token
        );
      }
      if (result) {
        dispatch(setCourse(result));
        setSectionName("");
        setEditSectionId(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleleSection = async (sectionId: string) => {
    Alert.alert("Delete Section", "All lectures inside this section will also be deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const result = await deleteSection({ sectionId, courseId: course._id || course.id }, token);
          if (result) {
            dispatch(setCourse(result));
          }
          setLoading(false);
        },
      },
    ]);
  };

  const handleDeleteSubSection = async (subSectionId: string, sectionId: string) => {
    Alert.alert("Delete Lecture", "Are you sure you want to delete this lecture?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const result = await deleteSubSection({ subSectionId, sectionId }, token);
          if (result) {
            const updatedContent = course.courseContent.map((section: any) =>
              (section._id || section.id) === sectionId ? result : section
            );
            dispatch(setCourse({ ...course, courseContent: updatedContent }));
          }
          setLoading(false);
        },
      },
    ]);
  };

  const goToNext = () => {
    if (!course?.courseContent || course.courseContent.length === 0) {
      Alert.alert("Error", "Please add at least one section.");
      return;
    }
    if (course.courseContent.some((sec: any) => !sec.subSection || sec.subSection.length === 0)) {
      Alert.alert("Error", "Please add at least one lecture in each section.");
      return;
    }
    dispatch(setStep(3));
  };

  const goBack = () => {
    dispatch(setStep(1));
    dispatch(setEditCourse(true));
  };

  return (
    <View className="px-4 py-5">
      <Text className="text-lg font-bold text-richblack-5 mb-4">Course Builder</Text>

      {/* Add / Edit Section Form */}
      <View className="bg-richblack-850 p-4 border border-richblack-800 rounded-xl mb-6">
        <Text className="text-xs font-semibold text-richblack-100 mb-1.5">Section Name *</Text>
        <TextInput
          value={sectionName}
          onChangeText={setSectionName}
          placeholder="Add a section to build your course"
          placeholderTextColor="#999DAA"
          className="bg-richblack-900 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700"
        />
        <View className="flex-row mt-3 space-x-3">
          <TouchableOpacity
            onPress={handleCreateOrUpdateSection}
            disabled={loading}
            className="flex-1 bg-yellow-50 py-2.5 rounded-lg flex-row justify-center items-center"
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="add-circle" size={16} color="#000" />
                <Text className="text-richblack-900 font-bold text-xs ml-1.5">
                  {editSectionId ? "Edit Section Name" : "Create Section"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {editSectionId && (
            <TouchableOpacity
              onPress={() => {
                setSectionName("");
                setEditSectionId(null);
              }}
              className="px-4 py-2.5 bg-richblack-800 border border-richblack-700 rounded-lg justify-center items-center"
            >
              <Text className="text-richblack-300 font-semibold text-xs">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sections and lectures listing */}
      <View className="space-y-4 mb-6">
        {course?.courseContent?.map((section: any) => {
          const sectionId = section._id || section.id;
          return (
            <View key={sectionId} className="bg-richblack-800 border border-richblack-700 rounded-xl overflow-hidden mb-4">
              <View className="flex-row justify-between items-center px-4 py-3 bg-richblack-700/50 border-b border-richblack-700">
                <Text className="text-sm font-bold text-richblack-5 flex-1 mr-2" numberOfLines={1}>
                  {section.sectionName}
                </Text>
                <View className="flex-row items-center space-x-3">
                  <TouchableOpacity onPress={() => {
                    setEditSectionId(sectionId);
                    setSectionName(section.sectionName);
                  }}>
                    <Ionicons name="create-outline" size={18} color="#AFB2BF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleleSection(sectionId)}>
                    <Ionicons name="trash-outline" size={18} color="#EF476F" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="px-4 py-3">
                {section.subSection?.map((sub: any) => {
                  const subId = sub._id || sub.id;
                  return (
                    <View key={subId} className="flex-row justify-between items-center py-2.5 border-b border-richblack-700 last:border-0">
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedSub(sub);
                          setSubModalMode("view");
                          setShowSubModal(true);
                        }}
                        className="flex-row items-center flex-1 mr-2"
                      >
                        <Ionicons name="play-circle-outline" size={16} color="#AFB2BF" />
                        <Text className="text-xs text-richblack-50 font-semibold ml-2 flex-1" numberOfLines={1}>
                          {sub.title}
                        </Text>
                      </TouchableOpacity>
                      <View className="flex-row space-x-3">
                        <TouchableOpacity onPress={() => {
                          setSelectedSub(sub);
                          setActiveSectionId(sectionId);
                          setSubModalMode("edit");
                          setShowSubModal(true);
                        }}>
                          <Ionicons name="create-outline" size={16} color="#838894" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteSubSection(subId, sectionId)}>
                          <Ionicons name="trash-outline" size={16} color="#EF476F" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity
                  onPress={() => {
                    setActiveSectionId(sectionId);
                    setSubModalMode("add");
                    setSelectedSub(null);
                    setShowSubModal(true);
                  }}
                  className="flex-row items-center mt-3"
                >
                  <Ionicons name="add" size={16} color="#FFD60A" />
                  <Text className="text-yellow-50 font-bold text-xs ml-1">Add Lecture</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row justify-end space-x-3 mt-4">
        <TouchableOpacity
          onPress={goBack}
          className="bg-richblack-800 border border-richblack-700 px-6 py-2.5 rounded-lg"
        >
          <Text className="text-richblack-5 font-bold text-xs">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goToNext}
          className="bg-yellow-50 px-6 py-2.5 rounded-lg"
        >
          <Text className="text-richblack-900 font-bold text-xs">Next</Text>
        </TouchableOpacity>
      </View>

      {/* SubSectionModal */}
      {showSubModal && (
        <SubSectionModal
          visible={showSubModal}
          onClose={() => setShowSubModal(false)}
          mode={subModalMode}
          sectionId={activeSectionId}
          subsection={selectedSub}
          course={course}
          token={token}
        />
      )}
    </View>
  );
}

/* =========================================================================
   SUB-SECTION LECTURE MODAL COMPONENT (LOCAL VIEW)
   ========================================================================= */
interface SubModalProps {
  visible: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "view";
  sectionId: string;
  subsection: any;
  course: any;
  token: string;
}
function SubSectionModal({ visible, onClose, mode, sectionId, subsection, course, token }: SubModalProps) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUri, setVideoUri] = useState<string | null>(null);

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && subsection) {
      setTitle(subsection.title || "");
      setDescription(subsection.description || "");
      setVideoUri(subsection.videoUrl || null);
    }
  }, [mode, subsection]);

  const selectVideo = async () => {
    if (mode === "view") return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Allow access to gallery to pick video.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title || !description || !videoUri) {
      Alert.alert("Error", "Please fill in all lecture fields.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      if (mode === "add") {
        formData.append("sectionId", sectionId);
        if (videoUri.startsWith("file://") || videoUri.startsWith("content://")) {
          const fileObj: any = {
            uri: videoUri,
            name: videoUri.split("/").pop() || "lecture.mp4",
            type: "video/mp4",
          };
          formData.append("video", fileObj);
        }
        const result = await createSubSection(formData, token);
        if (result) {
          const updatedContent = course.courseContent.map((section: any) =>
            (section._id || section.id) === sectionId ? result : section
          );
          dispatch(setCourse({ ...course, courseContent: updatedContent }));
        }
      } else {
        formData.append("sectionId", sectionId);
        formData.append("subSectionId", subsection._id || subsection.id);
        if (videoUri.startsWith("file://") || videoUri.startsWith("content://")) {
          const fileObj: any = {
            uri: videoUri,
            name: videoUri.split("/").pop() || "lecture.mp4",
            type: "video/mp4",
          };
          formData.append("video", fileObj);
        }
        const result = await updateSubSection(formData, token);
        if (result) {
          const updatedContent = course.courseContent.map((section: any) =>
            (section._id || section.id) === sectionId ? result : section
          );
          dispatch(setCourse({ ...course, courseContent: updatedContent }));
        }
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/80 justify-center items-center px-4 py-8">
        <ScrollView className="w-full bg-richblack-800 rounded-2xl border border-richblack-700 overflow-hidden" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 py-4 bg-richblack-700 border-b border-richblack-700">
            <Text className="text-base font-bold text-richblack-5">
              {mode === "add" ? "Adding" : mode === "edit" ? "Editing" : "Viewing"} Lecture
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#F1F2FF" />
            </TouchableOpacity>
          </View>

          <View className="p-5">
            {/* Video selector */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-richblack-5 mb-1.5">Lecture Video *</Text>
              <TouchableOpacity
                onPress={selectVideo}
                disabled={mode === "view"}
                className="bg-richblack-900 aspect-[16/9] rounded-xl border border-richblack-700 justify-center items-center overflow-hidden"
              >
                {videoUri ? (
                  <View className="w-full h-full justify-center items-center bg-black/60">
                    <Ionicons name="videocam" size={48} color="#FFD60A" />
                    <Text className="text-xxs text-richblack-200 mt-2 px-6 text-center" numberOfLines={1}>
                      {videoUri.startsWith("http") ? "Cloud Video File" : videoUri.split("/").pop()}
                    </Text>
                  </View>
                ) : (
                  <View className="items-center p-6">
                    <Ionicons name="play" size={32} color="#AFB2BF" />
                    <Text className="text-xs text-richblack-200 text-center mt-2">
                      Click to choose video file
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-richblack-5 mb-1.5">Lecture Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter Lecture Title"
                placeholderTextColor="#999DAA"
                editable={mode !== "view" && !loading}
                className="bg-richblack-900 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700"
              />
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-richblack-5 mb-1.5">Lecture Description *</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter Lecture Description"
                placeholderTextColor="#999DAA"
                multiline
                numberOfLines={3}
                editable={mode !== "view" && !loading}
                className="bg-richblack-900 text-richblack-5 px-4 py-3 rounded-lg border border-richblack-700 min-h-[80px]"
              />
            </View>

            {/* Actions */}
            {mode !== "view" && (
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                className="bg-yellow-50 py-3 rounded-xl flex-row justify-center items-center"
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-richblack-900 font-bold text-sm">
                    {mode === "add" ? "Save" : "Save Changes"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* =========================================================================
   STEP 3: PUBLISH COURSE OPTIONS
   ========================================================================= */
function PublishStep() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);
  const { course } = useSelector((state: any) => state.course);

  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (course?.status === "Published") {
      setIsPublic(true);
    }
  }, [course]);

  const goBack = () => {
    dispatch(setStep(2));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("courseId", course._id || course.id);
      formData.append("status", isPublic ? "Published" : "Draft");

      const result = await editCourseDetails(formData, token);
      if (result) {
        dispatch(resetCourseState());
        router.push("/my-courses");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="px-4 py-5">
      <Text className="text-lg font-bold text-richblack-5 mb-4">Publish Settings</Text>

      {/* Public Select option checkbox */}
      <TouchableOpacity
        onPress={() => setIsPublic(!isPublic)}
        className="flex-row items-center bg-richblack-800 p-5 border border-richblack-700 rounded-xl mb-8"
      >
        <View
          className={`w-6 h-6 rounded border justify-center items-center ${
            isPublic ? "bg-yellow-50 border-yellow-50" : "border-richblack-400"
          }`}
        >
          {isPublic && <Ionicons name="checkmark" size={16} color="#000" />}
        </View>
        <Text className="text-sm font-semibold text-richblack-100 ml-3">
          Make this course as public
        </Text>
      </TouchableOpacity>

      {/* Navigation Buttons */}
      <View className="flex-row justify-end space-x-3">
        <TouchableOpacity
          onPress={goBack}
          disabled={loading}
          className="bg-richblack-800 border border-richblack-700 px-6 py-2.5 rounded-lg"
        >
          <Text className="text-richblack-5 font-bold text-xs">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className="bg-yellow-50 px-6 py-2.5 rounded-lg flex-row items-center"
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-richblack-900 font-bold text-xs">Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
