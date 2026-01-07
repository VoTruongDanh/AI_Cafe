import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../../services/api'

// Helper functions for token management
const getStorageKey = (key, role) => {
  return role === 'admin' ? `admin_${key}` : `user_${key}`
}

const getTokenFromStorage = () => {
  // Try admin token first, then user token
  return localStorage.getItem('admin_token') || localStorage.getItem('user_token') || localStorage.getItem('token')
}

const getUserFromStorage = () => {
  const adminUser = localStorage.getItem('admin_user')
  const userUser = localStorage.getItem('user_user')
  const legacyUser = localStorage.getItem('user')
  
  const user = adminUser || userUser || legacyUser
  return user ? JSON.parse(user) : null
}

const saveToStorage = (token, user) => {
  const role = user?.role || 'user'
  const tokenKey = getStorageKey('token', role)
  const userKey = getStorageKey('user', role)
  
  localStorage.setItem(tokenKey, token)
  localStorage.setItem(userKey, JSON.stringify(user))
  
  // Keep legacy keys for backward compatibility
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

const clearStorage = (role) => {
  if (role === 'admin') {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  } else {
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_user')
  }
  // Clear legacy keys
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(email, password)
      const { token, user } = response.data
      saveToStorage(token, user)
      return { user, token }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Đăng nhập thất bại')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    { name, email, password, phone, address, city, ward },
    { rejectWithValue }
  ) => {
    try {
      // Map address to address_line as backend expects
      const registerData = {
        name,
        email,
        password,
        phone: phone && phone.trim() ? phone.trim() : null,
        address_line: address && address.trim() ? address.trim() : null,
        city: city && city.trim() ? city.trim() : null,
        ward: ward && ward.trim() ? ward.trim() : null,
      }
      const response = await authApi.register(registerData)
      const { token, user } = response.data
      saveToStorage(token, user)
      return { user, token }
    } catch (error) {
      // Prefer structured validation errors when available
      const errors = error.response?.data?.errors
      const message = error.response?.data?.message || 'Đăng ký thất bại'
      return rejectWithValue(errors ? { message, errors } : message)
    }
  }
)

export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const { user } = getState().auth
  clearStorage(user?.role || 'user')
})

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getCurrentUser()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Không thể lấy thông tin người dùng')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(data)
      const user = response.data
      localStorage.setItem('user', JSON.stringify(user))
      return user
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Cập nhật thông tin thất bại')
    }
  }
)

const initialState = {
  user: getUserFromStorage(),
  token: getTokenFromStorage(),
  isLoading: false,
  isAuthenticated: !!getTokenFromStorage(),
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    syncAuthState: (state) => {
      // Sync state with localStorage (for cross-tab communication)
      const token = getTokenFromStorage()
      const user = getUserFromStorage()
      
      if (token && user) {
        state.token = token
        state.user = user
        state.isAuthenticated = true
      } else {
        state.token = null
        state.user = null
        state.isAuthenticated = false
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
      // Get current user
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
      })
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
  },
})

export const { clearError, syncAuthState } = authSlice.actions
export default authSlice.reducer

