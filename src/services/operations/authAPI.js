import { toast } from "react-hot-toast";
import { setLoading, setToken } from "../../redux/Slices/authSlice";
import { resetCart } from "../../redux/Slices/cartSlice";
import { setUser } from "../../redux/Slices/profileSlice";
import { apiConnector } from "../apiConnector";
import { endpoints } from "../apis";

const {
  SENDOTP_API,
  SIGNUP_API,
  LOGIN_API,
  RESETPASSTOKEN_API,
  RESETPASSWORD_API,
} = endpoints;

export function sendOtp(email, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", SENDOTP_API, {
        email,
        checkUserPresent: true,
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("OTP Sent Successfully");
      if (typeof navigate === "function") {
        navigate("/verify-email");
      }
    } catch (error) {
      console.error("SENDOTP API ERROR:", error);
      const errorMessage = error.response?.data?.message || error.message || "Could Not Send OTP";
      toast.error(errorMessage);
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
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
  navigate
) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
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

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Signup Successful");
      if (typeof navigate === "function") {
        navigate("/login");
      }
    } catch (error) {
      console.error("SIGNUP API ERROR:", error);
      const errorMessage = error.response?.data?.message || error.message || "Signup Failed";
      toast.error(errorMessage);
      if (typeof navigate === "function") {
        navigate("/signup");
      }
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

export function login(email, password, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", LOGIN_API, {
        email,
        password,
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Login Successful");
      dispatch(setToken(response.data.token));
      const userImage = response.data?.user?.image
        ? response.data.user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.user.firstName} ${response.data.user.lastName}`;
      dispatch(setUser({ ...response.data.user, image: userImage }));
      localStorage.setItem("token", JSON.stringify(response.data.token));
      localStorage.setItem("user", JSON.stringify(response.data.user));
      if (typeof navigate === "function") {
        navigate("/dashboard/my-profile");
      }
    } catch (error) {
      console.error("LOGIN API ERROR:", error);
      const errorMessage = error.response?.data?.message || error.message || "Login Failed";
      toast.error(errorMessage);
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

export function getPasswordResetToken(email, setEmailSent) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", RESETPASSTOKEN_API, { email });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Reset Email Sent");
      setEmailSent(true);
    } catch (error) {
      console.error("RESETPASSTOKEN ERROR:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed To Send Reset Email";
      toast.error(errorMessage);
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

export function resetPassword(password, confirmPassword, token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", RESETPASSWORD_API, {
        password,
        confirmPassword,
        token,
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Password Reset Successfully");
      if (typeof navigate === "function") {
        navigate("/login");
      }
    } catch (error) {
      console.error("RESETPASSWORD ERROR:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed To Reset Password";
      toast.error(errorMessage);
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

export function logout(navigate) {
  return (dispatch) => {
    toast.dismiss();
    dispatch(setToken(null));
    dispatch(setUser(null));
    dispatch(resetCart());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged Out");
    if (typeof navigate === "function") {
      navigate("/");
    }
  };
}
