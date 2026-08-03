import './App.css'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Navbar from './components/Common/Navbar';
import OpenRoute from './components/core/Auth/OpenRoute';
import UpdatePassword from './pages/UpdatePassword';
import VerifyEmail from './pages/VerifyEmail';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivateRoute from './components/core/Auth/PrivateRoute';
import Dashboard from './pages/Dashboard';
import MyProfile from './components/core/Dashboard/MyProfile';
import Settings from './components/core/Dashboard/Settings/index';
import EnrolledCourses from './components/core/Dashboard/EnrolledCourses';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ACCOUNT_TYPE } from "./utils/constants"
import { getUserDetails } from './services/operations/profileAPI'
import Cart from './components/core/Dashboard/Cart/index';
import AddCourse from './components/core/Dashboard/AddCourse/index';
import MyCourses from './components/core/Dashboard/MyCourses';
import EditCourse from './components/core/Dashboard/EditCourse/index';
import Error from './pages/Error';
import Catalog from './pages/Catalog';
import CourseDetails from './pages/CourseDetails';
import PaymentSuccess from './pages/PaymentSuccess';
import ViewCourse from './pages/ViewCourse';
import VideoDetails from './components/core/ViewCourse/VideoDetails';
import Instructor from './components/core/Dashboard/Instructor';
import AllStudents from './components/core/Dashboard/Admin/AllStudents';
import AllInstructors from './components/core/Dashboard/Admin/AllInstructors';
import AllCourses from './components/core/Dashboard/Admin/AllCourses';
import PendingApprovals from './components/core/Dashboard/Admin/PendingApprovals';
import FinancialReport from './components/core/Dashboard/Admin/FinancialReport';







function App() {
  
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.profile)

  useEffect(() => {
    if (localStorage.getItem("token")) {
      const token = JSON.parse(localStorage.getItem("token"))
      dispatch(getUserDetails(token, navigate))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='w-screen min-h-screen bg-richblack-900 flex flex-col font-inter'>
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path="catalog/:catalogName" element={<Catalog />} />
        <Route path="courses/:courseId" element={<CourseDetails />} />



        <Route path='/login' 
        element={
          <OpenRoute>
            <Login/>
          </OpenRoute>   
        }
        />
        <Route path='/signup'
        element={
        <OpenRoute>
          <SignUp/>
        </OpenRoute>   
        }
        />
        <Route path='/forgot-password' 
        element={
          <OpenRoute>
            <ForgotPassword/>
          </OpenRoute>
        }
        />
        
      <Route
          path="/update-password/:id"
          element={
            <OpenRoute>
              <UpdatePassword />
            </OpenRoute>
          }
        /> 

        <Route
          path="verify-email"
          element={
            <OpenRoute>
               <VerifyEmail />
            </OpenRoute>
          }
        />

        <Route
          path="payment-success"
          element={
            <PrivateRoute>
              <PaymentSuccess />
            </PrivateRoute>
          }
        />

        <Route
          path="about"
          element={
            <About />
          }
        />


        <Route
          path="contact"
          element={
            <Contact />
          }
        />

    <Route 
      element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      }
    >
      <Route path="dashboard/my-profile" element={<MyProfile />} />
      
      <Route path="dashboard/Settings" element={<Settings />} />
      

      {
        user?.accountType === ACCOUNT_TYPE.STUDENT && (
          <>
          <Route path="dashboard/cart" element={<Cart />} />
          <Route path="dashboard/enrolled-courses" element={<EnrolledCourses />} />
          </>
        )
      }

      {
        user?.accountType === ACCOUNT_TYPE.INSTRUCTOR && (
          <>
          <Route path="dashboard/instructor" element={<Instructor />} />
          <Route path="dashboard/add-course" element={<AddCourse />} />
          <Route path="dashboard/my-courses" element={<MyCourses />} />
          <Route path="dashboard/edit-course/:courseId" element={<EditCourse />} />
          
          </>
        )
      }

      {
        user?.accountType === ACCOUNT_TYPE.ADMIN && (
          <>
          <Route path="dashboard/all-students" element={<AllStudents />} />
          <Route path="dashboard/all-instructors" element={<AllInstructors />} />
          <Route path="dashboard/pending-approvals" element={<PendingApprovals />} />
          <Route path="dashboard/all-courses" element={<AllCourses />} />
          <Route path="dashboard/financial-report" element={<FinancialReport />} />
          </>
        )
      }


    </Route>

    {/* For the watching course lectures */}
    <Route
          element={
            <PrivateRoute>
              <ViewCourse />
            </PrivateRoute>
          }
        >
          {user?.accountType === ACCOUNT_TYPE.STUDENT && (
            <>
              <Route
                path="view-course/:courseId/section/:sectionId/sub-section/:subSectionId"
                element={<VideoDetails />}
              />
            </>
          )}
    </Route>



    {/* 404 Page */}
    <Route path="*" element={<Error />} />


    </Routes>



    </div>
  )
}

export default App
