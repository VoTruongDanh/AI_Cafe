import { createSlice } from '@reduxjs/toolkit'

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: JSON.parse(localStorage.getItem('notifications')) || [],
    unreadCount: 0,
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        ...action.payload,
        read: false,
        createdAt: new Date().toISOString(),
      }
      state.items.unshift(notification)
      state.unreadCount += 1
      localStorage.setItem('notifications', JSON.stringify(state.items))
    },
    markAsRead: (state, action) => {
      const notification = state.items.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
        localStorage.setItem('notifications', JSON.stringify(state.items))
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => n.read = true)
      state.unreadCount = 0
      localStorage.setItem('notifications', JSON.stringify(state.items))
    },
    clearNotifications: (state) => {
      state.items = []
      state.unreadCount = 0
      localStorage.removeItem('notifications')
    },
  },
})

export const { addNotification, markAsRead, markAllAsRead, clearNotifications } = notificationsSlice.actions
export default notificationsSlice.reducer
