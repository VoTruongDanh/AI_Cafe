import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setRecentlyViewed, markSynced } from '../store/slices/recentlyViewedSlice'
import { recentlyViewedApi } from '../services/api'

/**
 * Hook to sync recently viewed products between LocalStorage and Backend
 * - Guest users: Use LocalStorage only
 * - Authenticated users: Sync to backend and fetch from backend
 */
export const useRecentlyViewedSync = () => {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const { products, synced } = useSelector((state) => state.recentlyViewed)
  const hasSynced = useRef(false)

  useEffect(() => {
    // Chỉ sync 1 lần khi đã đăng nhập và chưa sync
    if (!isAuthenticated || synced || hasSynced.current) return
    
    // Kiểm tra token thực sự tồn tại
    const token = localStorage.getItem('token')
    if (!token) return

    hasSynced.current = true

    const syncRecentlyViewed = async () => {
      try {
        // Step 1: Sync LocalStorage to backend if there are products
        if (products.length > 0) {
          const productIds = products.map(p => p.id)
          await recentlyViewedApi.sync(productIds)
          
          // Clear LocalStorage after sync
          localStorage.removeItem('recentlyViewed')
        }

        // Step 2: Fetch from backend
        const response = await recentlyViewedApi.getAll(12)
        dispatch(setRecentlyViewed(response.data.data || []))
      } catch (error) {
        console.error('Failed to sync recently viewed:', error)
        // Keep LocalStorage data if sync fails
        dispatch(markSynced())
      }
    }

    syncRecentlyViewed()
  }, [isAuthenticated, synced, dispatch])
}
