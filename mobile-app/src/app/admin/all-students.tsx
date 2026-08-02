import { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Modal, Alert } from "react-native";
import { useSelector } from "react-redux";
import { getAllStudents, toggleUserStatus, deleteUser, createUser } from "../../services/operations/adminAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AllStudentsScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAllStudents(token);
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents])
  );

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    const success = await toggleUserStatus(userId, !currentActive, token);
    if (success) {
      setStudents((prev) =>
        prev.map((student) =>
          (student.id === userId || student._id === userId) ? { ...student, active: !currentActive } : student
        )
      );
    }
  };

  const handleDelete = async (userId: string) => {
    Alert.alert(
      "Delete Student",
      "Are you sure you want to delete this student account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await deleteUser(userId, token);
            if (success) {
              setStudents((prev) => prev.filter((student) => (student.id !== userId && student._id !== userId)));
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleCreateSubmit = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Error", "Please fill in all mandatory fields.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        firstName,
        lastName,
        email,
        password,
        contactNumber,
        accountType: "Student",
      };
      const newUser = await createUser(payload, token);
      if (newUser) {
        setStudents((prev) => [newUser, ...prev]);
        setShowCreateModal(false);
        // Reset Form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setContactNumber("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-richblack-800 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#F1F2FF" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-richblack-5">All Students</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          className="bg-yellow-50 px-3 py-1.5 rounded-lg flex-row items-center"
        >
          <Ionicons name="add" size={16} color="#000" />
          <Text className="text-richblack-900 font-bold text-xs ml-1">New Student</Text>
        </TouchableOpacity>
      </View>

      {/* Search Filter */}
      <View className="px-4 py-3 border-b border-richblack-800 bg-richblack-900">
        <View className="flex-row items-center bg-richblack-800 rounded-lg px-3 py-2 border border-richblack-700">
          <Ionicons name="search" size={18} color="#AFB2BF" />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor="#999DAA"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 text-richblack-5 ml-2 text-sm"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <Ionicons name="close" size={18} color="#AFB2BF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-grow justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : filteredStudents.length === 0 ? (
        <View className="flex-grow justify-center items-center px-6">
          <Ionicons name="people-outline" size={64} color="#AFB2BF" />
          <Text className="text-richblack-100 font-semibold text-lg mt-4 text-center">
            No students found
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-grow px-4 py-4" showsVerticalScrollIndicator={false}>
          {filteredStudents.map((student, idx) => {
            const studentId = student.id || student._id;
            return (
              <View
                key={studentId || `student-${idx}`}
                className="bg-richblack-800 border border-richblack-700 rounded-xl p-4 mb-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <Image
                    source={{
                      uri: student.image || `https://api.dicebear.com/5.x/initials/svg?seed=${student.firstName}`,
                    }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                  <View className="ml-3 flex-shrink-1">
                    <Text className="text-sm font-bold text-richblack-5">
                      {student.firstName} {student.lastName}
                    </Text>
                    <Text className="text-xs text-richblack-300 mt-0.5">{student.email}</Text>
                    {student.contactNumber ? (
                      <Text className="text-xxs text-richblack-400 mt-0.5">{student.contactNumber}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Actions: Toggle Active Status & Trash */}
                <View className="flex-row items-center space-x-3">
                  <TouchableOpacity
                    onPress={() => handleToggleStatus(studentId, student.active)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      student.active
                        ? "bg-caribbeangreen-900/40 border-caribbeangreen-500"
                        : "bg-pink-900/40 border-pink-500"
                    }`}
                  >
                    <Text className={`text-xxs font-bold ${student.active ? "text-[#06D6A0]" : "text-[#EF476F]"}`}>
                      {student.active ? "Active" : "Inactive"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(studentId)}
                    className="p-2 bg-pink-600/20 border border-pink-400 rounded-lg"
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF476F" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Create User Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-richblack-800 border-t border-richblack-700 rounded-t-2xl p-5 max-h-[90%]">
            <View className="flex-row justify-between items-center pb-4 border-b border-richblack-700">
              <Text className="text-lg font-bold text-richblack-5">Create Student Account</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#F1F2FF" />
              </TouchableOpacity>
            </View>

            <ScrollView className="py-4 space-y-4">
              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-richblack-100 mb-1.5">First Name *</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    placeholderTextColor="#999DAA"
                    className="bg-richblack-900 text-richblack-5 px-3 py-2.5 rounded-lg border border-richblack-700"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-richblack-100 mb-1.5">Last Name *</Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    placeholderTextColor="#999DAA"
                    className="bg-richblack-900 text-richblack-5 px-3 py-2.5 rounded-lg border border-richblack-700"
                  />
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-xs font-semibold text-richblack-100 mb-1.5">Email Address *</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email address"
                  placeholderTextColor="#999DAA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-richblack-900 text-richblack-5 px-3 py-2.5 rounded-lg border border-richblack-700"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-semibold text-richblack-100 mb-1.5">Create Password *</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter Password"
                  placeholderTextColor="#999DAA"
                  secureTextEntry
                  autoCapitalize="none"
                  className="bg-richblack-900 text-richblack-5 px-3 py-2.5 rounded-lg border border-richblack-700"
                />
              </View>

              <View className="mt-3 mb-6">
                <Text className="text-xs font-semibold text-richblack-100 mb-1.5">Contact Number</Text>
                <TextInput
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  placeholder="Contact Number"
                  placeholderTextColor="#999DAA"
                  keyboardType="phone-pad"
                  className="bg-richblack-900 text-richblack-5 px-3 py-2.5 rounded-lg border border-richblack-700"
                />
              </View>

              <TouchableOpacity
                onPress={handleCreateSubmit}
                disabled={submitting}
                className="bg-yellow-50 py-3 rounded-lg flex-row justify-center items-center mt-4"
              >
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-richblack-900 font-bold">Create Account</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
