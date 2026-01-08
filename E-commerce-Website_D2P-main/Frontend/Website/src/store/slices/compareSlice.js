import { createSlice } from '@reduxjs/toolkit'

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    products: JSON.parse(localStorage.getItem('compareProducts')) || [],
  },
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload
      const exists = state.products.find(p => p.id === product.id)
      
      if (!exists && state.products.length < 4) {
        state.products.push(product)
        localStorage.setItem('compareProducts', JSON.stringify(state.products))
      }
    },
    removeFromCompare: (state, action) => {
      state.products = state.products.filter(p => p.id !== action.payload)
      localStorage.setItem('compareProducts', JSON.stringify(state.products))
    },
    clearCompare: (state) => {
      state.products = []
      localStorage.removeItem('compareProducts')
    },
  },
})

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions
export default compareSlice.reducer
