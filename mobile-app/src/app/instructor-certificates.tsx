import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useRouter } from "../navigation/navigationShim";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useColorScheme } from "nativewind";
import { getInstructorCertificates } from "../services/operations/certificateAPI";
import CertificateModal from "../components/CertificateModal";

export default function InstructorCertificatesScreen() {
  const { token, user } = useSelector((state: any) => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const fetchCerts = async () => {
    setLoading(true);
    const res = await getInstructorCertificates(token);
    if (res) {
      setData(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchCerts();
    }
  }, [token]);

  const stats = data?.stats || { totalCourses: 0, totalStudentsEnrolled: 0, totalCertificatesIssued: 0 };
  const courses = data?.courses || [];
  const certificates = data?.certificates || [];

  const completionRate =
    stats.totalStudentsEnrolled > 0
      ? Math.round((stats.totalCertificatesIssued / stats.totalStudentsEnrolled) * 100)
      : 0;

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row items-center justify-between bg-white dark:bg-richblack-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5">
            Course Certificates
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Stats Grid */}
          <View className="flex-row flex-wrap justify-between mb-4">
            <View className="w-[48%] bg-white dark:bg-richblack-800 p-3.5 rounded-xl border border-pure-greys-25 dark:border-richblack-700 mb-2.5">
              <Text className="text-[10px] text-richblack-400 font-semibold uppercase">Total Courses</Text>
              <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5 mt-1">
                {stats.totalCourses}
              </Text>
            </View>

            <View className="w-[48%] bg-white dark:bg-richblack-800 p-3.5 rounded-xl border border-pure-greys-25 dark:border-richblack-700 mb-2.5">
              <Text className="text-[10px] text-richblack-400 font-semibold uppercase">Enrolled Students</Text>
              <Text className="text-xl font-bold text-emerald-400 mt-1">
                {stats.totalStudentsEnrolled}
              </Text>
            </View>

            <View className="w-[48%] bg-white dark:bg-richblack-800 p-3.5 rounded-xl border border-pure-greys-25 dark:border-richblack-700 mb-2.5">
              <Text className="text-[10px] text-richblack-400 font-semibold uppercase">Certificates Issued</Text>
              <Text className="text-xl font-bold text-yellow-50 mt-1">
                {stats.totalCertificatesIssued}
              </Text>
            </View>

            <View className="w-[48%] bg-white dark:bg-richblack-800 p-3.5 rounded-xl border border-pure-greys-25 dark:border-richblack-700 mb-2.5">
              <Text className="text-[10px] text-richblack-400 font-semibold uppercase">Completion Rate</Text>
              <Text className="text-xl font-bold text-blue-400 mt-1">{completionRate}%</Text>
            </View>
          </View>

          {/* Courses Progress */}
          {courses.length > 0 && (
            <View className="bg-white dark:bg-richblack-800 p-4 rounded-2xl border border-pure-greys-25 dark:border-richblack-700 mb-4 shadow">
              <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5 mb-3">
                Course Completion Rates
              </Text>

              {courses.map((c: any) => {
                const enrolled = Number(c.enrolledCount) || 0;
                const certified = Number(c.certifiedCount) || 0;
                const percent = enrolled > 0 ? Math.round((certified / enrolled) * 100) : 0;

                return (
                  <View key={c.id} className="mb-3.5 last:mb-0">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-xs font-semibold text-richblack-900 dark:text-richblack-100 flex-1 mr-2" numberOfLines={1}>
                        {c.courseName}
                      </Text>
                      <Text className="text-[11px] font-bold text-yellow-50">
                        {certified}/{enrolled} ({percent}%)
                      </Text>
                    </View>
                    <View className="w-full h-2 bg-pure-greys-5 dark:bg-richblack-900 rounded-full overflow-hidden">
                      <View className="h-full bg-yellow-50 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Certified Students List */}
          <View className="bg-white dark:bg-richblack-800 p-4 rounded-2xl border border-pure-greys-25 dark:border-richblack-700 shadow mb-8">
            <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5 mb-3">
              Certified Students Directory ({certificates.length})
            </Text>

            {certificates.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-xs text-richblack-400 text-center">
                  No students have earned certificates in your courses yet.
                </Text>
              </View>
            ) : (
              certificates.map((cert: any) => (
                <View
                  key={cert.id}
                  className="flex-row items-center justify-between py-3 border-b border-pure-greys-25 dark:border-richblack-700/60 last:border-0"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <Image
                      source={{
                        uri:
                          cert.image ||
                          `https://api.dicebear.com/5.x/initials/svg?seed=${cert.firstName} ${cert.lastName}`,
                      }}
                      style={{ width: 38, height: 38, borderRadius: 19 }}
                      className="mr-2.5"
                    />
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-richblack-900 dark:text-richblack-100" numberOfLines={1}>
                        {cert.firstName} {cert.lastName}
                      </Text>
                      <Text className="text-[10px] text-yellow-50 font-semibold" numberOfLines={1}>
                        {cert.courseName}
                      </Text>
                      <Text className="text-[9px] text-richblack-400 font-mono mt-0.5">
                        {cert.certificateId} • {new Date(cert.issueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setSelectedCert({
                        ...cert,
                        instructorFirstName: user?.firstName,
                        instructorLastName: user?.lastName,
                      })
                    }
                    className="bg-yellow-50/10 border border-yellow-50/30 px-3 py-1.5 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="ribbon-outline" size={13} color="#FFD60A" />
                    <Text className="text-yellow-50 text-[11px] font-bold ml-1">View</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
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

