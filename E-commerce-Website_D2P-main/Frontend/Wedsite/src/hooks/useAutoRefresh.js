import { useEffect, useRef, useCallback } from 'react'
import { useDispatch } from 'react-redux'

/**
 * Custom hook for automatic data refresh with smart polling
 * Features:
 * - Auto refresh when tab becomes visible
 * - Configurable polling interval
 * - Pause polling when tab is hidden
 * - Manual refresh trigger
 * 
 * @param {Function} refreshFn - Function to call for refreshing data
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Polling interval in milliseconds (default: 60000 = 1 minute)
 * @param {boolean} options.enabled - Enable/disable auto refresh (default: true)
 * @param {boolean} options.refreshOnFocus - Refresh when tab becomes visible (default: true)
 * @param {boolean} options.refreshOnMount - Refresh on component mount (default: false)
 */
export const useAutoRefresh = (refreshFn, options = {}) => {
  const {
    interval = 60000, // 1 minute default
    enabled = true,
    refreshOnFocus = true,
    refreshOnMount = false,
  } = options

  const dispatch = useDispatch()
  const intervalRef = useRef(null)
  const lastRefreshRef = useRef(Date.now())
  const isRefreshingRef = useRef(false)
  const refreshFnRef = useRef(refreshFn)

  // Update ref when refreshFn changes
  useEffect(() => {
    refreshFnRef.current = refreshFn
  }, [refreshFn])

  // Wrap refresh function to prevent concurrent calls
  const safeRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    
    try {
      isRefreshingRef.current = true
      lastRefreshRef.current = Date.now()
      
      if (typeof refreshFnRef.current === 'function') {
        await refreshFnRef.current()
      } else if (refreshFnRef.current?.type) {
        // Redux action
        await dispatch(refreshFnRef.current)
      }
    } catch (error) {
      console.error('Auto refresh error:', error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [dispatch]) // Only depends on dispatch, not refreshFn

  // Handle visibility change
  useEffect(() => {
    if (!enabled || !refreshOnFocus) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastRefresh = Date.now() - lastRefreshRef.current
        
        // Only refresh if more than 30 seconds have passed
        if (timeSinceLastRefresh > 30000) {
          safeRefresh()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled, refreshOnFocus, safeRefresh])

  // Setup polling interval
  useEffect(() => {
    if (!enabled || !interval) return

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Only poll when tab is visible
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        safeRefresh()
      }
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, safeRefresh])

  // Refresh on mount if enabled
  useEffect(() => {
    if (refreshOnMount && enabled) {
      safeRefresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshOnMount, enabled]) // Run when mount options change

  // Return manual refresh function
  return {
    refresh: safeRefresh,
    lastRefresh: lastRefreshRef.current,
  }
}

/**
 * Hook for admin pages - refresh after mutations
 * Automatically refreshes data after create/update/delete operations
 * 
 * @param {Function} refreshFn - Function to refresh data
 * @returns {Function} - Function to call after successful mutation
 */
export const useAdminRefresh = (refreshFn) => {
  const dispatch = useDispatch()

  return useCallback(async () => {
    try {
      if (typeof refreshFn === 'function') {
        await refreshFn()
      } else if (refreshFn?.type) {
        await dispatch(refreshFn)
      }
    } catch (error) {
      console.error('Admin refresh error:', error)
    }
  }, [refreshFn, dispatch])
}

export default useAutoRefresh
