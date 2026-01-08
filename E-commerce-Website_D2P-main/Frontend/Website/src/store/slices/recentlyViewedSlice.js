import { createSlice } from '@reduxjs/toolkit'

const recentlyViewedSlice = createSlice({
  name: 'recentlyViewed',
  initialState: {
    products: JSON.parse(localStorage.getItem('recentlyViewed')) || [],
    synced: false, // Track if synced to backend
  },
  reducers: {
    addRecentlyViewed: (state, action) => {
      const product = action.payload
      state.products = [
        product,
        ...state.products.filter(p => p.id !== product.id)
      ].slice(0, 12) // Keep last 12 products
      
      localStorage.setItem('recentlyViewed', JSON.stringify(state.products))
    },
    setRecentlyViewed: (state, action) => {
      // Set products from backend
      state.products = action.payload
      state.synced = true
    },
    clearRecentlyViewed: (state) => {
      state.products = []
      state.synced = false
      localStorage.removeItem('recentlyViewed')
    },
    markSynced: (state) => {
      state.synced = true
    },
  },
})

export const { addRecentlyViewed, setRecentlyViewed, clearRecentlyViewed, markSynced } = recentlyViewedSlice.actions
export default recentlyViewedSlice.reducer
