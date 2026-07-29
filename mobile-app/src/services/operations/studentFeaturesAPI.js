import { Alert } from "react-native";
import { resetCart } from "../../redux/slices/cartSlice";
import { setPaymentLoading } from "../../redux/slices/courseSlice";

export async function BuyCourse(token, courses, user_details, router, dispatch) {
  dispatch(setPaymentLoading(true));
  try {
    // For mobile client testing, we simulate the payment flow and enroll the user.
    // We call the payment verification API with a mocked response or simulate local enrollment confirmation.
    
    // Attempting to register enrollment on the server:
    // If the server requires full payment Gateway integration, we can mock it, 
    // or call the verification directly if the endpoint allows.
    Alert.alert(
      "Confirm Purchase",
      "Do you want to enroll in these courses?",
      [
        { text: "Cancel", onPress: () => dispatch(setPaymentLoading(false)), style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              // Simulate backend verification
              // In a real app with SSLCommerz, this would open a WebView to the payment gateway
              // and redirect to the verify endpoint. Here we directly trigger success.
              dispatch(resetCart());
              Alert.alert("Success", "Enrollment Successful! Welcome to the course.");
              if (router && typeof router.replace === "function") {
                router.replace("/(tabs)/dashboard");
              }
            } catch (err) {
              Alert.alert("Error", "Could not complete enrollment.");
            } finally {
              dispatch(setPaymentLoading(false));
            }
          },
        },
      ]
    );
  } catch (error) {
    console.log("PAYMENT SIMULATION ERROR:", error);
    Alert.alert("Error", "Could not process enrollment.");
    dispatch(setPaymentLoading(false));
  }
}
