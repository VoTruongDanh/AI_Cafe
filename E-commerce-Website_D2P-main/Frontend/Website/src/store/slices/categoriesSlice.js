import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { categoriesApi } from '../../services/api'
import { getCache, setCache, clearCache } from '../../utils/cacheHelper'

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (forceRefresh = false, { rejectWithValue }) => {
    try {
      // Kiểm tra cache trước (nếu không force refresh)
      if (!forceRefresh) {
        const cached = getCache('categories')
        if (cached) {
          return cached
        }
      }

      const response = await categoriesApi.getCategories()
      const data = response.data
      
      // Lưu vào cache
      setCache('categories', data)
      
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

const initialState = {
  categories: [],
  isLoading: false,
  error: null,
}

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    invalidateCategories: (state) => {
      // Mark data as stale to trigger refetch
      state.categories = []
      clearCache('categories')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false
        state.categories = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { invalidateCategories } = categoriesSlice.actions
export default categoriesSlice.reducer

