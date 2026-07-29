import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cart: [],
  total: 0,
  totalItems: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartData: (state, action) => {
      state.cart = action.payload.cart || [];
      state.total = action.payload.total || 0;
      state.totalItems = action.payload.totalItems || 0;
    },
    addToCart: (state, action) => {
      const course = action.payload;
      const index = state.cart.findIndex((item) => (item.id || item._id) === (course.id || course._id));

      if (index >= 0) {
        return;
      }
      state.cart.push(course);
      state.totalItems++;
      state.total += course.price || 0;
    },
    removeFromCart: (state, action) => {
      const courseId = action.payload;
      const index = state.cart.findIndex((item) => (item.id || item._id) === courseId);

      if (index >= 0) {
        state.totalItems--;
        state.total -= state.cart[index].price || 0;
        state.cart.splice(index, 1);
      }
    },
    resetCart: (state) => {
      state.cart = [];
      state.total = 0;
      state.totalItems = 0;
    },
  },
});

export const { setCartData, addToCart, removeFromCart, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
