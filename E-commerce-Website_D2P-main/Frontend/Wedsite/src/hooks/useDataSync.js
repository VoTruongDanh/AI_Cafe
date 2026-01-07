import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { fetchProducts, invalidateProducts } from '../store/slices/productsSlice'
import { fetchCategories, invalidateCategories } from '../store/slices/categoriesSlice'
import { useAdminRefresh } from './useAutoRefresh'

/**
 * DEPRECATED: useHomeDataSync, useProductsDataSync, useCategoriesDataSync
 * 
 * Global auto-refresh đã được implement ở App level (useGlobalAutoRefresh)
 * Không cần sử dụng các hooks này nữa vì dữ liệu đã tự động refresh toàn bộ website
 * 
 * Chỉ giữ lại các hooks cho Admin pages (manual refresh after CRUD)
 */

/**
 * Hook for Admin Pages - Manual refresh after CRUD operations
 * Call the returned function after successful create/update/delete
 */

// For Admin Products Management
export const useAdminProductsSync = () => {
  const dispatch = useDispatch()
  
  const refreshProducts = useCallback(async () => {
    dispatch(invalidateProducts())
    // You can pass specific filters if needed
    await dispatch(fetchProducts({ limit: 100 }))
  }, [dispatch])

  return useAdminRefresh(refreshProducts)
}

// For Admin Categories Management
export const useAdminCategoriesSync = () => {
  const dispatch = useDispatch()
  
  const refreshCategories = useCallback(async () => {
    dispatch(invalidateCategories())
    await dispatch(fetchCategories())
  }, [dispatch])

  return useAdminRefresh(refreshCategories)
}

// For Admin Users Management
export const useAdminUsersSync = (refreshCallback) => {
  return useAdminRefresh(refreshCallback)
}

/**
 * Manual invalidation - force refresh on next render
 */
export const useInvalidateCache = () => {
  const dispatch = useDispatch()

  return {
    invalidateProducts: useCallback(() => {
      dispatch(invalidateProducts())
    }, [dispatch]),
    invalidateCategories: useCallback(() => {
      dispatch(invalidateCategories())
    }, [dispatch]),
    invalidateAll: useCallback(() => {
      dispatch(invalidateProducts())
      dispatch(invalidateCategories())
    }, [dispatch]),
  }
}

export default {
  useAdminProductsSync,
  useAdminCategoriesSync,
  useAdminUsersSync,
  useInvalidateCache,
}
