import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchCourseDetails } from "../services/operations/courseDetailsAPI";
import { BuyCourse, executeDirectMobilePayment } from "../services/operations/studentFeaturesAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";

export default function CourseDetailsScreen() {
  const { courseId } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [paying, setPaying] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();
  const { token } = useSelector((state: any) => state.auth);
  const { user } = useSelector((state: any) => state.profile);

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else if (cleaned.length === 2 && text.length > expiry.length) {
      setExpiry(`${cleaned}/`);
    } else {
      setExpiry(cleaned);
    }
  };

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

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
    setShowPaymentModal(true);
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

  const details = courseData?.courseDetails || courseData || {};
  const {
    courseName,
    courseDescription,
    instructor,
    price,
    thumbnail,
    courseContent,
    ratingAndReviews,
  } = details;

  const isEnrolled = details.studentsEnroled?.some(
    (student: any) =>
      (student.id || student._id || student) === user?.id ||
      (student.id || student._id || student) === user?._id
  );

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
              <Text className="text-2xl font-bold text-yellow-50">${price}</Text>
            </View>
            {isEnrolled ? (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/view-course", params: { courseId: courseId as string } })}
                className="bg-yellow-50 py-3 rounded-lg mt-4 flex-row justify-center items-center"
              >
                <Text className="text-richblack-900 font-bold text-base">Go to Course</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleBuyCourse}
                className="bg-yellow-50 py-3 rounded-lg mt-4 flex-row justify-center items-center"
              >
                <Text className="text-richblack-900 font-bold text-base">Buy Now</Text>
              </TouchableOpacity>
            )}
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

          {/* Student Reviews Section */}
          <View className="mt-6 mb-8 border-t border-richblack-800 pt-6">
            <Text className="text-lg font-bold text-richblack-5 mb-4">Student Reviews</Text>
            {!ratingAndReviews || ratingAndReviews.length === 0 ? (
              <Text className="text-sm italic text-richblack-400">No reviews for this course yet.</Text>
            ) : (
              <View className="space-y-3">
                {ratingAndReviews.map((item: any, rIdx: number) => (
                  <View key={item._id || rIdx} className="bg-richblack-800 p-4 rounded-xl border border-richblack-700 mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-sm font-bold text-richblack-5">
                        {item.user?.firstName} {item.user?.lastName}
                      </Text>
                      <View className="flex-row items-center space-x-1">
                        <Ionicons name="star" size={14} color="#FFD60A" />
                        <Text className="text-xs font-bold text-yellow-50">{item.rating}/5</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-richblack-200 leading-relaxed">{item.review}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Native In-App Payment Gateway Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-richblack-800 p-6 rounded-t-3xl border-t border-richblack-700">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center space-x-2">
                <Ionicons name="shield-checkmark" size={24} color="#06D6A0" />
                <Text className="text-lg font-bold text-richblack-5 ml-2">In-App Payment Gateway</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#AFB2BF" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-richblack-300 mb-4">
              Complete your payment for <Text className="font-bold text-richblack-5">{courseName}</Text>
            </Text>

            {/* Price Badge */}
            <View className="bg-richblack-900 p-4 rounded-xl border border-richblack-700 flex-row justify-between items-center mb-5">
              <Text className="text-sm text-richblack-200">Total Payable</Text>
              <Text className="text-2xl font-bold text-yellow-50">${price}</Text>
            </View>

            {/* Payment Method Selector */}
            <Text className="text-xs font-bold text-richblack-200 mb-2">Payment Method</Text>
            <View className="flex-row space-x-3 mb-5">
              <TouchableOpacity
                onPress={() => setPaymentMethod("card")}
                className={`flex-1 py-3 rounded-xl border flex-row justify-center items-center ${
                  paymentMethod === "card" ? "bg-yellow-50/10 border-yellow-50" : "bg-richblack-900 border-richblack-700"
                }`}
              >
                <Ionicons name="card" size={18} color={paymentMethod === "card" ? "#FFD60A" : "#838894"} />
                <Text className={`text-xs font-bold ml-2 ${paymentMethod === "card" ? "text-yellow-50" : "text-richblack-300"}`}>
                  Credit / Debit Card
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card Inputs */}
            <View className="space-y-3 mb-6">
              <View className="mb-2">
                <Text className="text-xxs text-richblack-300 mb-1">Cardholder Name</Text>
                <TextInput
                  value={cardName}
                  onChangeText={setCardName}
                  className="bg-richblack-900 text-richblack-5 px-4 py-3 rounded-xl border border-richblack-700 text-sm"
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#6E727F"
                />
              </View>

              <View className="mb-2">
                <Text className="text-xxs text-richblack-300 mb-1">Card Number (Max 16 digits)</Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  keyboardType="numeric"
                  maxLength={19}
                  className="bg-richblack-900 text-richblack-5 px-4 py-3 rounded-xl border border-richblack-700 font-mono text-sm"
                  placeholder="4242 4242 4242 4242"
                  placeholderTextColor="#6E727F"
                />
              </View>

              <View className="flex-row space-x-3 mt-1">
                <View className="flex-1 mr-2">
                  <Text className="text-xxs text-richblack-300 mb-1">Expiry Date (MM/YY)</Text>
                  <TextInput
                    value={expiry}
                    onChangeText={handleExpiryChange}
                    keyboardType="numeric"
                    maxLength={5}
                    className="bg-richblack-900 text-richblack-5 px-4 py-3 rounded-xl border border-richblack-700 font-mono text-sm"
                    placeholder="11/27"
                    placeholderTextColor="#6E727F"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xxs text-richblack-300 mb-1">CVC Code</Text>
                  <TextInput
                    value={cvc}
                    onChangeText={setCvc}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    className="bg-richblack-900 text-richblack-5 px-4 py-3 rounded-xl border border-richblack-700 font-mono text-sm"
                    placeholder="123"
                    placeholderTextColor="#6E727F"
                  />
                </View>
              </View>
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              onPress={async () => {
                if (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvc.trim()) {
                  Alert.alert("Card Information Required", "Please enter your cardholder name, card number, expiry date, and CVC code.");
                  return;
                }
                setPaying(true);
                const success = await executeDirectMobilePayment(token, [courseId], router, dispatch);
                setPaying(false);
                if (success) {
                  setShowPaymentModal(false);
                }
              }}
              disabled={paying}
              className="bg-yellow-50 py-4 rounded-xl justify-center items-center flex-row shadow-lg"
            >
              {paying ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={18} color="#000" />
                  <Text className="text-richblack-900 font-bold text-base ml-2">
                    Confirm & Pay ${price}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
