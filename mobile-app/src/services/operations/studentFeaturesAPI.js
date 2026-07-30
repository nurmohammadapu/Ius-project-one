import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { resetCart } from "../../redux/slices/cartSlice";
import { setPaymentLoading } from "../../redux/slices/courseSlice";
import { apiConnector } from "../apiConnector";
import { sslStudentEndpoints } from "../apis";

const { CREATE_STRIPE_SESSION_API, VERIFY_STRIPE_PAYMENT_API } = sslStudentEndpoints;

export async function BuyCourse(token, courses, user_details, router, dispatch) {
  dispatch(setPaymentLoading(true));
  try {
    // 1. Call backend to create Stripe Checkout session with mobile success URL
    const response = await apiConnector(
      "POST",
      CREATE_STRIPE_SESSION_API,
      {
        courses,
        success_url: "http://192.168.1.167:5001/api/v1/payment/mobile-success?session_id={CHECKOUT_SESSION_ID}",
      },
      { Authorization: `Bearer ${token}` }
    );

    if (response?.data?.success && response?.data?.data?.sessionUrl) {
      const { sessionUrl, sessionId } = response.data.data;
      
      // 2. Open Stripe Checkout page in native WebBrowser
      await WebBrowser.openBrowserAsync(sessionUrl);

      // 3. Verify Stripe Payment with backend when returning to app
      try {
        const verifyRes = await apiConnector(
          "POST",
          VERIFY_STRIPE_PAYMENT_API,
          { sessionId },
          { Authorization: `Bearer ${token}` }
        );

        if (verifyRes?.data?.success) {
          dispatch(resetCart());
          if (router && typeof router.replace === "function") {
            router.replace({
              pathname: "/payment-success",
              params: {
                courseId: Array.isArray(courses) ? courses[0] : courses,
                sessionId,
              },
            });
          }
        } else {
          Alert.alert("Payment Pending", verifyRes?.data?.message || "Stripe payment was not completed.");
        }
      } catch (vErr) {
        console.log("STRIPE VERIFY ERROR:", vErr);
        const errMsg = vErr?.response?.data?.message || "Stripe payment was not completed.";
        Alert.alert("Payment Status", errMsg);
      }
    } else {
      Alert.alert("Payment Error", response?.data?.message || "Could not initiate Stripe checkout session.");
    }
  } catch (error) {
    console.log("STRIPE PAYMENT ERROR:", error);
    const msg = error?.response?.data?.message || error?.message || "Stripe checkout failed.";
    Alert.alert("Payment Error", msg);
  } finally {
    dispatch(setPaymentLoading(false));
  }
}

export async function executeDirectMobilePayment(token, courses, router, dispatch) {
  dispatch(setPaymentLoading(true));
  try {
    const response = await apiConnector(
      "POST",
      sslStudentEndpoints.DIRECT_MOBILE_PAYMENT_API,
      { courses },
      { Authorization: `Bearer ${token}` }
    );

    if (response?.data?.success) {
      dispatch(resetCart());
      const courseId = Array.isArray(courses) ? courses[0] : courses;
      if (router && typeof router.replace === "function") {
        router.replace({
          pathname: "/payment-success",
          params: {
            courseId,
            sessionId: "MOB-" + Math.floor(100000 + Math.random() * 900000),
          },
        });
      }
      return true;
    } else {
      Alert.alert("Payment Failed", response?.data?.message || "Could not process mobile payment.");
      return false;
    }
  } catch (error) {
    console.log("DIRECT MOBILE PAYMENT ERROR:", error);
    const msg = error?.response?.data?.message || error?.message || "Payment process failed.";
    Alert.alert("Payment Error", msg);
    return false;
  } finally {
    dispatch(setPaymentLoading(false));
  }
}
