import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts } from '../store/slices/productsSlice'
import { fetchCategories } from '../store/slices/categoriesSlice'
import { fetchCart } from '../store/slices/cartSlice'
import { fetchOrders } from '../store/slices/ordersSlice'
import { useAutoRefresh } from './useAutoRefresh'

/**
 * Global Auto-Refresh Hook
 * Tự động refresh toàn bộ dữ liệu quan trọng trên website
 * 
 * Features:
 * - Refresh products, categories, cart, orders
 * - Chỉ refresh khi user đã login (cho cart & orders)
 * - Tự động refresh khi tab trở lại visible
 * - Polling interval: 60 giây
 */
export const useGlobalAutoRefresh = () => {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)

  // Refresh function cho tất cả dữ liệu public (không cần login)
  const refreshPublicData = useCallback(async () => {
    console.log('🔄 [Global Auto-Refresh] Refreshing public data...')
    
    try {
      await Promise.all([
        // Refresh products (tất cả sản phẩm, bao gồm flash sale)
        dispatch(fetchProducts({ limit: 100 })),
        // Refresh categories
        dispatch(fetchCategories()),
      ])
      
      console.log('✅ [Global Auto-Refresh] Public data refreshed successfully')
    } catch (error) {
      console.error('❌ [Global Auto-Refresh] Error refreshing public data:', error)
    }
  }, [dispatch])

  // Refresh function cho dữ liệu user (cần login)
  const refreshUserData = useCallback(async () => {
    if (!isAuthenticated) return

    console.log('🔄 [Global Auto-Refresh] Refreshing user data...')
    
    try {
      await Promise.all([
        // Refresh cart
        dispatch(fetchCart()),
        // Refresh orders
        dispatch(fetchOrders()),
      ])
      
      console.log('✅ [Global Auto-Refresh] User data refreshed successfully')
    } catch (error) {
      console.error('❌ [Global Auto-Refresh] Error refreshing user data:', error)
    }
  }, [dispatch, isAuthenticated])

  // Refresh tất cả dữ liệu
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      refreshPublicData(),
      refreshUserData(),
    ])
  }, [refreshPublicData, refreshUserData])

  // Setup auto-refresh cho public data (luôn chạy)
  useAutoRefresh(refreshPublicData, {
    interval: 60000, // 60 giây
    enabled: true,
    refreshOnFocus: true,
    refreshOnMount: false, // Không refresh khi mount (tránh duplicate với initial load)
  })

  // Setup auto-refresh cho user data (chỉ khi đã login)
  useAutoRefresh(refreshUserData, {
    interval: 120000, // 120 giây (user data ít thay đổi hơn)
    enabled: isAuthenticated,
    refreshOnFocus: true,
    refreshOnMount: false,
  })

  // Refresh user data khi user vừa login
  useEffect(() => {
    if (isAuthenticated) {
      console.log('👤 [Global Auto-Refresh] User logged in, refreshing user data...')
      refreshUserData()
    }
  }, [isAuthenticated, refreshUserData])

  return {
    refreshAllData,
    refreshPublicData,
    refreshUserData,
  }
}

export default useGlobalAutoRefresh
