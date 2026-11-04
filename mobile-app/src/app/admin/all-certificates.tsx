import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useRouter } from "../../navigation/navigationShim";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useColorScheme } from "nativewind";
import { getAdminAllCertificates } from "../../services/operations/certificateAPI";
import CertificateModal from "../../components/CertificateModal";

export default function AdminAllCertificatesScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const fetchCerts = async () => {
    setLoading(true);
    const res = await getAdminAllCertificates(token);
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

  const stats = data?.stats || {
    totalCertificates: 0,
    totalDistinctStudents: 0,
    totalDistinctCourses: 0,
  };
  const certificates = data?.certificates || [];

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row items-center justify-between bg-white dark:bg-richblack-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5">
            Platform Certificates
          </Text>
        </View>
        <View className="bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-50/20">
          <Text className="text-yellow-50 text-xxs font-bold">{stats.totalCertificates} Total</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Stats Row */}
          <View className="flex-row space-x-2 mb-4">
            <View className="flex-1 bg-white dark:bg-richblack-800 p-3 rounded-xl border border-pure-greys-25 dark:border-richblack-700 items-center">
              <Text className="text-[10px] text-richblack-400 font-semibold uppercase">Total Issued</Text>
              <Text className="text-lg font-bold text-yellow-50 mt-0.5">{stats.totalCertificates}</Text>
            </View>
            <View className="flex-1 bg-white dark:bg-richblack-800 p-3 rounded-xl border border-pure-greys-25 dark:border-richblack-700 items-center">
              <Text className="text-[10px] text-richblack-400 font-semibold uppercase">Graduates</Text>
              <Text className="text-lg font-bold text-emerald-400 mt-0.5">
                {stats.totalDistinctStudents}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-richblack-800 p-3 rounded-xl border border-pure-greys-25 dark:border-richblack-700 items-center">
              <Text className="text-[10px] text-richblack-400 font-semibold uppercase">Courses</Text>
              <Text className="text-lg font-bold text-blue-400 mt-0.5">
                {stats.totalDistinctCourses}
              </Text>
            </View>
          </View>

          {/* Certificates List */}
          <View className="bg-white dark:bg-richblack-800 p-4 rounded-2xl border border-pure-greys-25 dark:border-richblack-700 shadow mb-8">
            <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5 mb-3">
              All Issued Certificates
            </Text>

            {certificates.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-xs text-richblack-400">No certificates generated yet.</Text>
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
                      <Text className="text-[9px] text-richblack-400 mt-0.5">
                        Inst: {cert.instructorFirstName} {cert.instructorLastName} • {cert.certificateId}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedCert(cert)}
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

