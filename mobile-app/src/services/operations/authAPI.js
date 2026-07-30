import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setLoading, setToken } from "../../redux/slices/authSlice";
import { resetCart } from "../../redux/slices/cartSlice";
import { setUser } from "../../redux/slices/profileSlice";
import { apiConnector } from "../apiConnector";
import { endpoints } from "../apis";

const {
  SENDOTP_API,
  SIGNUP_API,
  LOGIN_API,
} = endpoints;

export function sendOtp(email, router) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", SENDOTP_API, {
        email,
        checkUserPresent: true,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Could not send OTP");
      }

      Alert.alert("Success", "OTP Sent Successfully");
      if (router && typeof router.push === "function") {
        router.push("/(auth)/verify-email");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Could Not Send OTP. Please check network connection.";
      console.log("SENDOTP API ERROR:", errorMessage);
      Alert.alert("OTP Error", errorMessage);
    }
    dispatch(setLoading(false));
  };
}

export function signUp(
  accountType,
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  otp,
  router
) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", SIGNUP_API, {
        accountType,
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        otp,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Signup failed");
      }

      Alert.alert("Success", "Signup Successful. Please Login.");
      if (router && typeof router.replace === "function") {
        router.replace("/(auth)/login");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Signup Failed. Please try again.";
      console.log("SIGNUP API ERROR:", errorMessage);
      Alert.alert("Registration Error", errorMessage);
    }
    dispatch(setLoading(false));
  };
}

export function login(email, password, router) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", LOGIN_API, {
        email,
        password,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Login failed");
      }

      const token = response.data.token;
      const user = response.data.user;
      const userImage = user?.image
        ? user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName || "User"} ${user?.lastName || ""}`;
      
      const fullUser = { ...user, image: userImage };

      dispatch(setToken(token));
      dispatch(setUser(fullUser));

      await AsyncStorage.setItem("token", JSON.stringify(token));
      await AsyncStorage.setItem("user", JSON.stringify(fullUser));

      Alert.alert("Success", "Login Successful");

      if (router && typeof router.replace === "function") {
        router.replace("/(tabs)");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        (error.response?.status === 401
          ? "Invalid email or password"
          : error.message || "Login Failed");
      console.log("LOGIN API ERROR:", errorMessage);
      Alert.alert("Login Failed", errorMessage);
    }
    dispatch(setLoading(false));
  };
}

export function logout(router) {
  return async (dispatch) => {
    dispatch(setToken(null));
    dispatch(setUser(null));
    dispatch(resetCart());
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    Alert.alert("Logged Out", "You have been logged out successfully.");
    if (router && typeof router.replace === "function") {
      router.replace("/(auth)/login");
    }
  };
}
