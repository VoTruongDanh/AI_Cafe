import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productsApi } from '../../services/api'
import { getCache, setCache, clearCache } from '../../utils/cacheHelper'

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, limit = 12, search = '', categoryId = '', filters = {}, forceRefresh = false }, { rejectWithValue }) => {
    try {
      // Chỉ cache trang đầu tiên không có filter
      const shouldCache = page === 1 && !search && !categoryId && Object.keys(filters).length === 0
      const cacheKey = 'products_home'
      
      if (shouldCache && !forceRefresh) {
        const cached = getCache(cacheKey)
        if (cached) {
          return cached
        }
      }

      const response = await productsApi.getProducts({ page, limit, search, categoryId, filters })
      const data = response.data
      
      // Lưu cache cho trang home
      if (shouldCache) {
        setCache(cacheKey, data)
      }
      
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

export const fetchProductDetail = createAsyncThunk(
  'products/fetchProductDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await productsApi.getProductDetail(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

const initialState = {
  products: [],
  currentProduct: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
  isLoading: false,
  isInitialized: false, // Để biết đã load lần đầu chưa
  error: null,
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null
    },
    invalidateProducts: (state) => {
      // Mark data as stale to trigger refetch
      state.isInitialized = false
      clearCache('products_home')
    },
    // ✅ Thêm action để cập nhật 1 sản phẩm cụ thể (từ WebSocket)
    updateProduct: (state, action) => {
      const updatedProduct = action.payload
      
      // Cập nhật trong danh sách products
      const index = state.products.findIndex(p => p.id === updatedProduct.id)
      if (index !== -1) {
        state.products[index] = updatedProduct
      }
      
      // Cập nhật currentProduct nếu đang xem chi tiết sản phẩm này
      if (state.currentProduct?.id === updatedProduct.id) {
        state.currentProduct = updatedProduct
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false
        state.isInitialized = true
        state.products = action.payload.data || []
        state.pagination = {
          currentPage: action.payload.current_page || 1,
          totalPages: action.payload.last_page || 1,
          total: action.payload.total || 0,
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false
        state.isInitialized = true
        state.error = action.payload
      })
      .addCase(fetchProductDetail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentProduct = action.payload
      })
      .addCase(fetchProductDetail.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { clearCurrentProduct, invalidateProducts, updateProduct } = productsSlice.actions
export default productsSlice.reducer

