import { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../services/operations/authAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiConnector } from "../../services/apiConnector";
import { settingsEndpoints } from "../../services/apis";
import { setUser } from "../../redux/slices/profileSlice";
import { useColorScheme } from "nativewind";

const { UPDATE_PROFILE_API, CHANGE_PASSWORD_API } = settingsEndpoints;

export default function ProfileScreen() {
  const { user } = useSelector((state: any) => state.profile);
  const { token } = useSelector((state: any) => state.auth);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const dispatch = useDispatch();
  const router = useRouter();

  const isDark = colorScheme === "dark";

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [gender, setGender] = useState(user?.additionalDetails?.gender || "Male");
  const [dateOfBirth, setDateOfBirth] = useState(user?.additionalDetails?.dateOfBirth || "");
  const [contactNumber, setContactNumber] = useState(user?.additionalDetails?.contactNumber || "");
  const [about, setAbout] = useState(user?.additionalDetails?.about || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogout = () => {
    dispatch(logout(router) as any);
  };

  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      const response = await apiConnector(
        "PUT",
        UPDATE_PROFILE_API,
        {
          firstName,
          lastName,
          gender,
          dateOfBirth,
          contactNumber,
          about,
        },
        { Authorization: `Bearer ${token}` }
      );

      if (response?.data?.success) {
        dispatch(setUser(response.data.updatedUserDetails || response.data.user || {
          ...user,
          firstName,
          lastName,
          additionalDetails: {
            ...user?.additionalDetails,
            gender,
            dateOfBirth,
            contactNumber,
            about,
          },
        }));
        Alert.alert("Success", "Profile updated successfully!");
        setShowEditModal(false);
      } else {
        Alert.alert("Error", response?.data?.message || "Failed to update profile.");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.response?.data?.message || "Profile update failed.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Error", "Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      const response = await apiConnector(
        "POST",
        CHANGE_PASSWORD_API,
        {
          oldPassword,
          newPassword,
          confirmNewPassword,
        },
        { Authorization: `Bearer ${token}` }
      );

      if (response?.data?.success) {
        Alert.alert("Success", "Password changed successfully!");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        Alert.alert("Error", response?.data?.message || "Failed to change password.");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.response?.data?.message || "Password change failed.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row justify-between items-center bg-white dark:bg-richblack-900">
        <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5">My Profile</Text>
        <TouchableOpacity
          onPress={() => setShowEditModal(true)}
          className="bg-yellow-50 px-3 py-1.5 rounded-lg flex-row items-center"
        >
          <Ionicons name="create-outline" size={16} color="#000" />
          <Text className="text-richblack-900 font-bold text-xs ml-1">Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* User Card info */}
        <View className="bg-white dark:bg-richblack-800 rounded-2xl p-6 border border-pure-greys-25 dark:border-richblack-700 items-center mb-6">
          <Image
            source={{ uri: user?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName}` }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
          <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5 mt-4">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-sm text-richblack-500 dark:text-richblack-300 mt-1">{user?.email}</Text>
          <View className="bg-pure-greys-5 dark:bg-richblack-900 px-3 py-1 rounded-full border border-pure-greys-25 dark:border-richblack-700 mt-3">
            <Text className="text-xs font-semibold text-yellow-50">{user?.accountType}</Text>
          </View>
        </View>

        {/* Details List */}
        <View className="bg-white dark:bg-richblack-800 rounded-2xl p-6 border border-pure-greys-25 dark:border-richblack-700 mb-6">
          <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5 mb-4">Personal Details</Text>

          <View className="flex-row justify-between py-2.5 border-b border-pure-greys-50 dark:border-richblack-700">
            <Text className="text-sm text-richblack-500 dark:text-richblack-300">Gender</Text>
            <Text className="text-sm font-semibold text-richblack-900 dark:text-richblack-5">
              {user?.additionalDetails?.gender || "Not specified"}
            </Text>
          </View>

          <View className="flex-row justify-between py-2.5 border-b border-pure-greys-50 dark:border-richblack-700">
            <Text className="text-sm text-richblack-500 dark:text-richblack-300">Date of Birth</Text>
            <Text className="text-sm font-semibold text-richblack-900 dark:text-richblack-5">
              {user?.additionalDetails?.dateOfBirth || "Not specified"}
            </Text>
          </View>

          <View className="flex-row justify-between py-2.5 border-b border-pure-greys-50 dark:border-richblack-700">
            <Text className="text-sm text-richblack-500 dark:text-richblack-300">Contact Number</Text>
            <Text className="text-sm font-semibold text-richblack-900 dark:text-richblack-5">
              {user?.additionalDetails?.contactNumber || "Not specified"}
            </Text>
          </View>

          <View className="py-2.5">
            <Text className="text-sm text-richblack-500 dark:text-richblack-300 mb-1">About</Text>
            <Text className="text-xs text-richblack-700 dark:text-richblack-100 leading-relaxed">
              {user?.additionalDetails?.about || "Write something about yourself..."}
            </Text>
          </View>
        </View>

        {/* Theme Settings Card */}
        <View className="bg-white dark:bg-richblack-800 rounded-2xl p-5 border border-pure-greys-25 dark:border-richblack-700 mb-6">
          <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5 mb-4">Settings</Text>
          <TouchableOpacity
            onPress={toggleColorScheme}
            className="flex-row justify-between items-center py-2"
          >
            <View className="flex-row items-center">
              <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={isDark ? "#FFD60A" : "#000814"} />
              <Text className="text-sm font-semibold text-richblack-900 dark:text-richblack-5 ml-3">Theme Mode</Text>
            </View>
            <View className="bg-pure-greys-5 dark:bg-richblack-900 px-3 py-1 rounded-full border border-pure-greys-25 dark:border-richblack-700">
              <Text className="text-xxs font-bold text-richblack-900 dark:text-yellow-50">
                {isDark ? "Dark Mode" : "Light Mode"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3 mb-8">
          <TouchableOpacity
            onPress={() => setShowPasswordModal(true)}
            className="bg-white dark:bg-richblack-800 border border-pure-greys-50 dark:border-richblack-700 py-3.5 rounded-xl flex-row justify-center items-center mb-3"
          >
            <Ionicons name="key-outline" size={18} color={isDark ? "#FFD60A" : "#000814"} />
            <Text className="text-richblack-900 dark:text-richblack-5 font-bold text-sm ml-2">Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-pink-300 py-3.5 rounded-xl flex-row justify-center items-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text className="text-white font-bold text-base ml-2">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-center items-center px-5 py-8">
          <ScrollView className="w-full bg-white dark:bg-richblack-800 p-6 rounded-2xl border border-pure-greys-25 dark:border-richblack-700 max-h-[85%]" showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-5 pb-3 border-b border-pure-greys-50 dark:border-richblack-700">
              <Text className="text-lg font-bold text-richblack-900 dark:text-richblack-5">Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mb-1.5">First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#999DAA"
                  className="bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 px-3 py-2.5 rounded-lg border border-pure-greys-50 dark:border-richblack-700"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mb-1.5">Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#999DAA"
                  className="bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 px-3 py-2.5 rounded-lg border border-pure-greys-50 dark:border-richblack-700"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mb-1.5">Gender</Text>
                <View className="flex-row space-x-3">
                  {["Male", "Female", "Other"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGender(g)}
                      className={`flex-1 py-2 rounded-lg border items-center ${
                        gender === g ? "bg-yellow-50 border-yellow-50" : "bg-pure-greys-5 border-pure-greys-50 dark:bg-richblack-900 dark:border-richblack-700"
                      }`}
                    >
                      <Text className={`text-xs font-bold ${gender === g ? "text-richblack-900" : "text-richblack-700 dark:text-richblack-100"}`}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mb-1.5">Date of Birth</Text>
                <TextInput
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999DAA"
                  className="bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 px-3 py-2.5 rounded-lg border border-pure-greys-50 dark:border-richblack-700"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mb-1.5">Contact Number</Text>
                <TextInput
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  placeholder="Phone number"
                  placeholderTextColor="#999DAA"
                  keyboardType="phone-pad"
                  className="bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 px-3 py-2.5 rounded-lg border border-pure-greys-50 dark:border-richblack-700"
                />
              </View>

              <View className="mt-3 mb-4">
                <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mb-1.5">About Bio</Text>
                <TextInput
                  value={about}
                  onChangeText={setAbout}
                  placeholder="Write a short description about yourself..."
                  placeholderTextColor="#999DAA"
                  multiline
                  numberOfLines={3}
                  className="bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 px-3 py-2.5 rounded-lg border border-pure-greys-50 dark:border-richblack-700 min-h-[80px]"
                />
              </View>

              <TouchableOpacity
                onPress={handleUpdateProfile}
                disabled={updatingProfile}
                className="bg-yellow-50 py-3 rounded-lg flex-row justify-center items-center mt-2 mb-4"
              >
                {updatingProfile ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-richblack-900 font-bold text-center">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-center items-center px-5">
          <View className="w-full bg-white dark:bg-richblack-800 p-6 rounded-2xl border border-pure-greys-25 dark:border-richblack-700">
            <View className="flex-row justify-between items-center mb-5 pb-3 border-b border-pure-greys-50 dark:border-richblack-700">
              <Text className="text-lg font-bold text-richblack-900 dark:text-richblack-5">Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mb-1.5">Current Password</Text>
                <View className="w-full relative justify-center">
                  <TextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#999DAA"
                    secureTextEntry={!showOldPassword}
                    className="bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 px-3 py-2.5 pr-10 rounded-lg border border-pure-greys-50 dark:border-richblack-700"
                  />
                  <TouchableOpacity
                    onPress={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3"
                  >
                    <Ionicons
                      name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#AFB2BF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mb-1.5">New Password</Text>
                <View className="w-full relative justify-center">
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#999DAA"
                    secureTextEntry={!showNewPassword}
                    className="bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 px-3 py-2.5 pr-10 rounded-lg border border-pure-greys-50 dark:border-richblack-700"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3"
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#AFB2BF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mt-3 mb-5">
                <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-100 mb-1.5">Confirm New Password</Text>
                <View className="w-full relative justify-center">
                  <TextInput
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#999DAA"
                    secureTextEntry={!showConfirmNewPassword}
                    className="bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 px-3 py-2.5 pr-10 rounded-lg border border-pure-greys-50 dark:border-richblack-700"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3"
                  >
                    <Ionicons
                      name={showConfirmNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#AFB2BF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={changingPassword}
                className="bg-yellow-50 py-3 rounded-lg flex-row justify-center items-center"
              >
                {changingPassword ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-richblack-900 font-bold text-center">Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
