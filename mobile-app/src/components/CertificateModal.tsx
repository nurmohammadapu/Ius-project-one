import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";

interface CertificateModalProps {
  visible: boolean;
  certificate: any;
  onClose: () => void;
}

export default function CertificateModal({ visible, certificate, onClose }: CertificateModalProps) {
  if (!certificate) return null;

  const studentName = `${certificate.studentFirstName || certificate.firstName || "Student"} ${
    certificate.studentLastName || certificate.lastName || ""
  }`.trim();

  const instructorName = `${certificate.instructorFirstName || "Course"} ${
    certificate.instructorLastName || "Instructor"
  }`.trim();

  const verifyUrl = `https://studynotion.vercel.app/verify-certificate/${certificate.certificateId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    verifyUrl
  )}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my official verified course certificate for "${certificate.courseName}" issued by StudyNotion!\nVerify at: ${verifyUrl}`,
        url: verifyUrl,
        title: "StudyNotion Official Certificate",
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const formattedDate = new Date(certificate.issueDate || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="w-full max-w-md bg-richblack-900 border border-richblack-700 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header Action Bar */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-richblack-800 bg-richblack-800/80">
            <View className="flex-row items-center">
              <Ionicons name="ribbon-outline" size={20} color="#FFD60A" />
              <Text className="text-white font-bold text-sm ml-2">Official Certificate</Text>
            </View>
            <View className="flex-row items-center space-x-2">
              <TouchableOpacity
                onPress={handleShare}
                className="bg-yellow-50 px-3 py-1.5 rounded-lg flex-row items-center mr-2"
              >
                <Ionicons name="share-social-outline" size={14} color="#000" />
                <Text className="text-richblack-900 text-xs font-bold ml-1">Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} className="p-1 rounded-lg bg-richblack-700">
                <Ionicons name="close" size={18} color="#AFB2BF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Certificate Body */}
          <ScrollView className="max-h-[80vh] p-5" showsVerticalScrollIndicator={false}>
            <View className="border-4 border-yellow-500/80 rounded-xl p-5 bg-[#020617] items-center relative">
              {/* Branding */}
              <View className="flex-row items-center mb-1">
                <View className="h-6 w-6 rounded-full bg-yellow-50 items-center justify-center mr-1.5">
                  <Text className="text-richblack-900 font-extrabold text-xs">SN</Text>
                </View>
                <Text className="text-base font-black tracking-widest text-white">
                  STUDY<Text className="text-yellow-50">NOTION</Text>
                </Text>
              </View>

              <Text className="text-[10px] uppercase tracking-widest text-yellow-500/90 font-semibold mb-3">
                Verified Academic Certificate
              </Text>

              <Text className="text-xl font-bold text-white text-center mb-2">
                Certificate of Completion
              </Text>

              <Text className="text-xs text-richblack-400 italic mb-2">
                This is proudly presented to
              </Text>

              <Text className="text-lg font-bold text-yellow-50 text-center mb-3">
                {studentName}
              </Text>

              <Text className="text-xs text-richblack-300 text-center mb-4 leading-relaxed px-2">
                for successfully completing 100% of the lectures, practical modules, and examination requirements for:
              </Text>

              {/* Course Title Box */}
              <View className="w-full bg-richblack-800/80 border border-yellow-500/30 rounded-lg p-2.5 mb-4">
                <Text className="text-sm font-bold text-white text-center">
                  {certificate.courseName}
                </Text>
              </View>

              {/* Meta Grid */}
              <View className="w-full flex-row justify-between border-t border-richblack-800 pt-3 mb-4">
                <View className="items-center flex-1">
                  <Text className="text-[10px] text-richblack-400">Instructor</Text>
                  <Text className="text-xs font-semibold text-richblack-100 mt-0.5" numberOfLines={1}>
                    {instructorName}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-[10px] text-richblack-400">Issue Date</Text>
                  <Text className="text-xs font-semibold text-richblack-100 mt-0.5">
                    {formattedDate}
                  </Text>
                </View>
              </View>

              {/* QR Code Verification */}
              <View className="items-center mt-1 bg-white p-2 rounded-lg">
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={{ width: 85, height: 85 }}
                  resizeMode="contain"
                />
              </View>

              <Text className="text-[10px] font-mono font-bold text-yellow-50 mt-2">
                ID: {certificate.certificateId}
              </Text>
              <Text className="text-[9px] text-richblack-400 mt-0.5">
                Scan QR or visit site to verify authenticity
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

