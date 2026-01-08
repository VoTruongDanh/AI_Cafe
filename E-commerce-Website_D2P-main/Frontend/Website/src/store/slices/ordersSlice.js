import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { ordersApi } from '../../services/api'

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ordersApi.getOrders()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (data, { rejectWithValue }) => {
    try {
      const response = await ordersApi.createOrder(data)
      return response.data
    } catch (error) {
      // Extract error message from Laravel validation errors
      const errorResponse = error.response?.data
      if (errorResponse?.errors) {
        // Laravel validation errors format
        const errorMessages = Object.values(errorResponse.errors).flat()
        return rejectWithValue(errorMessages.join(', ') || errorResponse.message || 'Đặt hàng thất bại')
      }
      return rejectWithValue(errorResponse?.message || 'Đặt hàng thất bại')
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, cancelReason }, { rejectWithValue }) => {
    try {
      const response = await ordersApi.cancelOrder(orderId, { cancel_reason: cancelReason })
      return { 
        orderId, 
        order: response.data.order, // Order đã cập nhật từ backend
        refund_required: response.data.refund_required,
        refund_status: response.data.refund_status,
        pending_cancel: response.data.pending_cancel 
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Không thể hủy đơn hàng')
    }
  }
)

export const fetchOrderDetail = createAsyncThunk(
  'orders/fetchOrderDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ordersApi.getOrderById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

const initialState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false
        // Backend returns paginated response, extract data array
        state.orders = action.payload.data || action.payload || []
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        // Ensure orders is an array before adding new order
        if (!Array.isArray(state.orders)) {
          state.orders = []
        }
        state.orders.unshift(action.payload)
      })
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false
        // Update the order with data from backend response
        const index = state.orders.findIndex(o => o.id === action.payload.orderId)
        if (index !== -1 && action.payload.order) {
          // Cập nhật toàn bộ order từ response
          state.orders[index] = action.payload.order
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.currentOrder = action.payload
      })
  },
})

export default ordersSlice.reducer

