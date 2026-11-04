import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useRouter } from "../navigation/navigationShim";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useColorScheme } from "nativewind";
import { getMyCertificates } from "../services/operations/certificateAPI";
import CertificateModal from "../components/CertificateModal";

export default function MyCertificatesScreen() {
  const { token, user } = useSelector((state: any) => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const fetchCerts = async () => {
    setLoading(true);
    const res = await getMyCertificates(token);
    if (res) {
      setCertificates(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchCerts();
    }
  }, [token]);

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row items-center justify-between bg-white dark:bg-richblack-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5">
            My Certificates
          </Text>
        </View>
        <View className="bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-50/20">
          <Text className="text-yellow-50 text-xxs font-bold">{certificates.length} Earned</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : certificates.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <View className="h-20 w-20 rounded-full bg-richblack-800 items-center justify-center mb-4">
            <Ionicons name="ribbon-outline" size={40} color="#FFD60A" />
          </View>
          <Text className="text-lg font-bold text-richblack-900 dark:text-richblack-5 text-center">
            No Certificates Yet
          </Text>
          <Text className="text-xs text-richblack-500 dark:text-richblack-300 text-center mt-2 max-w-xs leading-relaxed">
            Certificates are automatically awarded when you complete 100% of all lectures in your enrolled courses.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/dashboard")}
            className="bg-yellow-50 px-6 py-2.5 rounded-xl mt-6 flex-row items-center"
          >
            <Ionicons name="school-outline" size={16} color="#000" />
            <Text className="text-richblack-900 font-bold text-xs ml-1.5">View Enrolled Courses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          <Text className="text-xs text-richblack-500 dark:text-richblack-400 mb-3 font-semibold uppercase tracking-wider">
            Verified Course Credentials
          </Text>

          {certificates.map((cert) => (
            <View
              key={cert.id}
              className="bg-white dark:bg-richblack-800 border border-pure-greys-25 dark:border-richblack-700 rounded-2xl overflow-hidden mb-4 shadow"
            >
              {/* Thumbnail */}
              <View className="relative h-32 w-full bg-richblack-900">
                {cert.thumbnail ? (
                  <Image
                    source={{ uri: cert.thumbnail }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="school" size={40} color="#838894" />
                  </View>
                )}
                <View className="absolute top-2 right-2 bg-richblack-900/90 border border-emerald-500/50 px-2.5 py-1 rounded-full flex-row items-center">
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text className="text-[10px] font-bold text-emerald-400 ml-1">Completed</Text>
                </View>
              </View>

              <View className="p-4">
                <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5" numberOfLines={1}>
                  {cert.courseName}
                </Text>
                <Text className="text-xs text-richblack-500 dark:text-richblack-300 mt-1">
                  Instructor: {cert.instructorFirstName} {cert.instructorLastName}
                </Text>

                {/* ID & Date Box */}
                <View className="bg-pure-greys-5 dark:bg-richblack-900 p-2.5 rounded-xl border border-pure-greys-25 dark:border-richblack-700 my-3 flex-row justify-between items-center">
                  <View>
                    <Text className="text-[10px] text-richblack-400">Certificate ID</Text>
                    <Text className="text-xs font-mono font-bold text-yellow-50">{cert.certificateId}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-richblack-400">Issue Date</Text>
                    <Text className="text-xs text-richblack-300">
                      {new Date(cert.issueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  onPress={() =>
                    setSelectedCert({
                      ...cert,
                      firstName: cert.firstName || user?.firstName,
                      lastName: cert.lastName || user?.lastName,
                    })
                  }
                  className="bg-yellow-50 py-2.5 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="ribbon-outline" size={16} color="#000" />
                  <Text className="text-richblack-900 font-bold text-xs ml-1.5">View / Share Certificate</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          visible={!!selectedCert}
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </SafeAreaView>
  );
}

