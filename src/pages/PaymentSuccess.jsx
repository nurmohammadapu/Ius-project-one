import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { apiConnector } from "../services/apiConnector"
import { studentEndpoints } from "../services/apis"
import { resetCart } from "../redux/Slices/cartSlice"

const { VERIFY_STRIPE_PAYMENT_API } = studentEndpoints

export default function PaymentSuccess() {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    // Enforce student-only access
    if (user && user.accountType !== "Student") {
      navigate("/dashboard/my-profile")
      return
    }

    const urlParams = new URLSearchParams(location.search)
    const session_id = urlParams.get("session_id")
    
    if (session_id) {
      setSessionId(session_id)
      if (!token) return // Wait for token to load
      
      const verifyPayment = async () => {
        try {
          const response = await apiConnector(
            "POST",
            VERIFY_STRIPE_PAYMENT_API,
            { sessionId: session_id },
            { Authorization: `Bearer ${token}` }
          )

          if (!response.data.success) {
            throw new Error(response.data.message || "Payment verification failed")
          }

          setSuccess(true)
          dispatch(resetCart())
        } catch (error) {
          console.error("Payment Verification Error:", error)
          setErrorMsg(error.response?.data?.message || error.message || "Could not verify payment.")
          setSuccess(false)
        } finally {
          setLoading(false)
        }
      }
      
      verifyPayment()
    } else {
      setLoading(false)
      setErrorMsg("No active payment session found.")
    }
  }, [token, user, location.search])

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-richblack-900 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-richblack-800 bg-richblack-950 p-8 shadow-2xl text-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="spinner"></div>
            <h2 className="text-2xl font-bold text-richblack-5 mt-4">Verifying Payment...</h2>
            <p className="text-sm text-richblack-400">Please do not close this window or click the back button.</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-caribbeangreen-900/30">
              <svg className="h-12 w-12 text-caribbeangreen-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-richblack-5 tracking-tight">Payment Succeeded!</h2>
              <p className="text-sm text-caribbeangreen-100 font-semibold bg-caribbeangreen-900/20 px-3 py-1.5 rounded-full inline-block">
                Enrolled Successfully
              </p>
            </div>

            <div className="w-full rounded-xl border border-richblack-800 bg-richblack-900 p-4 text-left space-y-3">
              <div>
                <p className="text-xs text-richblack-400 uppercase font-semibold">Payment Method</p>
                <p className="text-sm font-medium text-richblack-100">Stripe Checkout</p>
              </div>
              <div className="border-t border-richblack-800 pt-3">
                <p className="text-xs text-richblack-400 uppercase font-semibold">Transaction Session ID</p>
                <p className="text-xs font-mono text-richblack-200 mt-1 break-all bg-richblack-950 p-2 rounded border border-richblack-850">
                  {sessionId}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 mt-2">
              <button
                onClick={() => navigate("/dashboard/enrolled-courses")}
                className="w-full rounded-lg bg-yellow-50 hover:bg-yellow-100 py-3 text-center text-sm font-extrabold text-richblack-900 transition-all duration-200 shadow-md active:scale-95 cursor-pointer"
              >
                Go to Enrolled Courses
              </button>
              <button
                onClick={() => navigate("/dashboard/my-profile")}
                className="w-full rounded-lg bg-richblack-800 hover:bg-richblack-700 py-3 text-center text-sm font-semibold text-richblack-100 transition-all duration-200 border border-richblack-700 cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-900/30">
              <svg className="h-12 w-12 text-pink-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-richblack-5">Verification Failed</h2>
              <p className="text-sm text-richblack-300">
                {errorMsg || "We encountered an issue confirming your payment session."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 mt-4">
              <button
                onClick={() => navigate("/dashboard/cart")}
                className="w-full rounded-lg bg-yellow-50 hover:bg-yellow-100 py-3 text-center text-sm font-bold text-richblack-900 transition-all cursor-pointer"
              >
                Return to Cart
              </button>
              <button
                onClick={() => navigate("/dashboard/my-profile")}
                className="w-full rounded-lg bg-richblack-800 hover:bg-richblack-750 py-3 text-center text-sm font-medium text-richblack-100 transition-all border border-richblack-750 cursor-pointer"
              >
                Go to Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
