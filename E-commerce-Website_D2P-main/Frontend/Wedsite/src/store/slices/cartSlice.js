import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { cartApi } from '../../services/api'

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await cartApi.getCart()
      return response.data
    } catch (error) {
      // Ignore 401/403 errors (user not logged in)
      if (error.response?.status === 401 || error.response?.status === 403) {
        return rejectWithValue(null)
      }
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartApi.addItem({ 
        product_id: parseInt(productId, 10), 
        quantity: parseInt(quantity, 10) 
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartApi.updateItem(itemId, { quantity })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await cartApi.removeItem(itemId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

const initialState = {
  items: [],
  total: 0,
  subtotal: 0,
  discountTotal: 0,
  promotion: null,
  isLoading: false,
  error: null,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = []
      state.total = 0
      state.subtotal = 0
      state.discountTotal = 0
      state.promotion = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload?.items || []
        state.total = action.payload?.grand_total || action.payload?.total || 0
        state.subtotal = action.payload?.subtotal || 0
        state.discountTotal = action.payload?.discount_total || 0
        state.promotion = action.payload?.promotion || null
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        // Keep current items on error instead of clearing
      })
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload?.items || []
        state.total = action.payload?.grand_total || action.payload?.total || 0
        state.subtotal = action.payload?.subtotal || 0
        state.discountTotal = action.payload?.discount_total || 0
        state.promotion = action.payload?.promotion || null
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Update Cart Item
      .addCase(updateCartItem.pending, (state) => {
        state.error = null
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload?.items || []
        state.total = action.payload?.grand_total || action.payload?.total || 0
        state.subtotal = action.payload?.subtotal || 0
        state.discountTotal = action.payload?.discount_total || 0
        state.promotion = action.payload?.promotion || null
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.error = action.payload
      })
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.error = null
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload?.items || []
        state.total = action.payload?.grand_total || action.payload?.total || 0
        state.subtotal = action.payload?.subtotal || 0
        state.discountTotal = action.payload?.discount_total || 0
        state.promotion = action.payload?.promotion || null
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearCart } = cartSlice.actions
export default cartSlice.reducer

