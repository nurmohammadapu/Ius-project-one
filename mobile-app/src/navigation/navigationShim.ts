import { useNavigation, useRoute, useFocusEffect as useNavFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export function parseRouteString(routeInput: string | { pathname: string; params?: any }, directParams?: any) {
  let path = typeof routeInput === "string" ? routeInput : routeInput?.pathname || "";
  let params: any = typeof routeInput === "object" && routeInput?.params ? { ...routeInput.params } : {};
  if (directParams) {
    params = { ...params, ...directParams };
  }

  // Parse query params if present, e.g. "/course-details?courseId=WEB-1234"
  if (path.includes("?")) {
    const [cleanPath, queryString] = path.split("?");
    path = cleanPath;
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
  }

  // Clean path
  path = path.trim().replace(/^\//, ""); // remove leading slash

  let screenName = path;
  let tabScreen: string | undefined = undefined;

  switch (path) {
    case "(auth)/login":
    case "login":
      screenName = "Login";
      break;
    case "(auth)/signup":
    case "signup":
      screenName = "Signup";
      break;
    case "(auth)/verify-email":
    case "verify-email":
      screenName = "VerifyEmail";
      break;
    case "(tabs)":
    case "(tabs)/index":
      screenName = "Tabs";
      tabScreen = "Home";
      break;
    case "(tabs)/catalog":
      screenName = "Tabs";
      tabScreen = "Catalog";
      break;
    case "(tabs)/dashboard":
      screenName = "Tabs";
      tabScreen = "Dashboard";
      break;
    case "(tabs)/profile":
      screenName = "Tabs";
      tabScreen = "Profile";
      break;
    case "course-details":
      screenName = "CourseDetails";
      break;
    case "view-course":
      screenName = "ViewCourse";
      break;
    case "my-courses":
      screenName = "MyCourses";
      break;
    case "add-course":
      screenName = "AddCourse";
      break;
    case "edit-course":
      screenName = "EditCourse";
      break;
    case "my-exams":
      screenName = "MyExams";
      break;
    case "create-exam":
      screenName = "CreateExam";
      break;
    case "evaluate-exams":
      screenName = "EvaluateExams";
      break;
    case "payment-success":
      screenName = "PaymentSuccess";
      break;
    case "my-certificates":
      screenName = "MyCertificates";
      break;
    case "leaderboard":
      screenName = "Leaderboard";
      break;
    case "instructor-certificates":
      screenName = "InstructorCertificates";
      break;
    case "instructor-leaderboard":
      screenName = "InstructorLeaderboard";
      break;
    case "doubt-forum":
      screenName = "DoubtForum";
      break;
    case "admin/all-students":
      screenName = "AdminAllStudents";
      break;
    case "admin/all-instructors":
      screenName = "AdminAllInstructors";
      break;
    case "admin/pending-approvals":
      screenName = "AdminPendingApprovals";
      break;
    case "admin/all-courses":
      screenName = "AdminAllCourses";
      break;
    case "admin/financial-report":
      screenName = "AdminFinancialReport";
      break;
    case "admin/all-certificates":
      screenName = "AdminAllCertificates";
      break;
    case "admin/leaderboard":
      screenName = "AdminLeaderboard";
      break;
    default:
      // In case path was already screen name
      screenName = path;
  }

  return { screenName, tabScreen, params };
}

export function useRouter() {
  const navigation = useNavigation<any>();

  const push = useCallback(
    (routeInput: string | { pathname: string; params?: any }, extraParams?: any) => {
      const { screenName, tabScreen, params } = parseRouteString(routeInput, extraParams);
      if (screenName === "Tabs" && tabScreen) {
        navigation.navigate("Tabs", { screen: tabScreen, params });
      } else {
        navigation.navigate(screenName, params);
      }
    },
    [navigation]
  );

  const replace = useCallback(
    (routeInput: string | { pathname: string; params?: any }, extraParams?: any) => {
      const { screenName, tabScreen, params } = parseRouteString(routeInput, extraParams);
      if (screenName === "Tabs" && tabScreen) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Tabs", params: { screen: tabScreen, params } }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: screenName, params }],
        });
      }
    },
    [navigation]
  );

  const back = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  return {
    push,
    replace,
    back,
    navigate: push,
  };
}

export function useLocalSearchParams<T = any>(): T {
  const route = useRoute<any>();
  return ((route && route.params) || {}) as T;
}

export const useFocusEffect = useNavFocusEffect;
