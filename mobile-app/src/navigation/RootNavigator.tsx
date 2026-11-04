import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { setToken } from "../redux/slices/authSlice";
import { setUser } from "../redux/slices/profileSlice";
import { getUserDetails } from "../services/operations/profileAPI";

// Screens
import LoginScreen from "../app/(auth)/login";
import SignupScreen from "../app/(auth)/signup";
import VerifyEmailScreen from "../app/(auth)/verify-email";

import TabNavigator from "./TabNavigator";
import CourseDetailsScreen from "../app/course-details";
import ViewCourseScreen from "../app/view-course";
import MyCoursesScreen from "../app/my-courses";
import AddCourseScreen from "../app/add-course";
import EditCourseScreen from "../app/edit-course";
import MyExamsScreen from "../app/my-exams";
import CreateExamScreen from "../app/create-exam";
import EvaluateExamsScreen from "../app/evaluate-exams";
import PaymentSuccessScreen from "../app/payment-success";

// Certificates & Leaderboards
import MyCertificatesScreen from "../app/my-certificates";
import StudentLeaderboardScreen from "../app/leaderboard";
import InstructorCertificatesScreen from "../app/instructor-certificates";
import InstructorLeaderboardScreen from "../app/instructor-leaderboard";
import DoubtForumScreen from "../app/doubt-forum";

// Admin Screens
import AdminAllStudentsScreen from "../app/admin/all-students";
import AdminAllInstructorsScreen from "../app/admin/all-instructors";
import AdminPendingApprovalsScreen from "../app/admin/pending-approvals";
import AdminAllCoursesScreen from "../app/admin/all-courses";
import AdminFinancialReportScreen from "../app/admin/financial-report";
import AdminAllCertificatesScreen from "../app/admin/all-certificates";
import AdminLeaderboardScreen from "../app/admin/leaderboard";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { token } = useSelector((state: any) => state.auth);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken) {
          const tokenVal = JSON.parse(storedToken);
          dispatch(setToken(tokenVal));

          if (storedUser) {
            dispatch(setUser(JSON.parse(storedUser)));
          }

          dispatch(getUserDetails(tokenVal) as any);
        }
      } catch (error) {
        console.error("Error bootstrapping app:", error);
      } finally {
        setIsBootstrapped(true);
      }
    }
    bootstrap();
  }, [dispatch]);

  if (!isBootstrapped) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000814", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={token ? "Tabs" : "Login"}
        screenOptions={{ headerShown: false }}
      >
        {/* Auth Group */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />

        {/* Main Tabs */}
        <Stack.Screen name="Tabs" component={TabNavigator} />

        {/* App Stack Screens */}
        <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
        <Stack.Screen name="ViewCourse" component={ViewCourseScreen} />
        <Stack.Screen name="MyCourses" component={MyCoursesScreen} />
        <Stack.Screen name="AddCourse" component={AddCourseScreen} />
        <Stack.Screen name="EditCourse" component={EditCourseScreen} />
        <Stack.Screen name="MyExams" component={MyExamsScreen} />
        <Stack.Screen name="CreateExam" component={CreateExamScreen} />
        <Stack.Screen name="EvaluateExams" component={EvaluateExamsScreen} />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />

        {/* New Certificates, Leaderboard & Doubt Forum Screens */}
        <Stack.Screen name="MyCertificates" component={MyCertificatesScreen} />
        <Stack.Screen name="Leaderboard" component={StudentLeaderboardScreen} />
        <Stack.Screen name="InstructorCertificates" component={InstructorCertificatesScreen} />
        <Stack.Screen name="InstructorLeaderboard" component={InstructorLeaderboardScreen} />
        <Stack.Screen name="DoubtForum" component={DoubtForumScreen} />

        {/* Admin Screens */}
        <Stack.Screen name="AdminAllStudents" component={AdminAllStudentsScreen} />
        <Stack.Screen name="AdminAllInstructors" component={AdminAllInstructorsScreen} />
        <Stack.Screen name="AdminPendingApprovals" component={AdminPendingApprovalsScreen} />
        <Stack.Screen name="AdminAllCourses" component={AdminAllCoursesScreen} />
        <Stack.Screen name="AdminFinancialReport" component={AdminFinancialReportScreen} />
        <Stack.Screen name="AdminAllCertificates" component={AdminAllCertificatesScreen} />
        <Stack.Screen name="AdminLeaderboard" component={AdminLeaderboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
