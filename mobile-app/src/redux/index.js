import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import cartSlice from "./slices/cartSlice";
import profileSlice from "./slices/profileSlice";
import courseSlice from "./slices/courseSlice";
import viewCourseReducer from "./slices/viewCourseSlice";

const rootReducer = combineReducers({
  auth: authSlice,
  cart: cartSlice,
  profile: profileSlice,
  course: courseSlice,
  viewCourse: viewCourseReducer,
});

export default rootReducer;
