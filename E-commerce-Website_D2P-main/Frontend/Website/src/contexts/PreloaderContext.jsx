import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const PreloaderContext = createContext()

export const PreloaderProvider = ({ children }) => {
  const [isDataReady, setIsDataReady] = useState(false)
  const fallbackTimerRef = useRef(null)

  const markDataReady = useCallback(() => {
    // Clear fallback timer khi data ready
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    setIsDataReady(true)
  }, [])

  const resetDataReady = useCallback(() => {
    setIsDataReady(false)
  }, [])

  // Fallback: Nếu sau 3 giây vẫn chưa có trang nào gọi markDataReady, 
  // tự động đánh dấu là ready (cho các trang không cần load dữ liệu hoặc API bị lỗi)
  useEffect(() => {
    // Chỉ set timeout nếu chưa ready
    if (!isDataReady && !fallbackTimerRef.current) {
      fallbackTimerRef.current = setTimeout(() => {
        console.log('⏱️ Preloader fallback: marking as ready after 3s timeout')
        setIsDataReady(true)
        fallbackTimerRef.current = null
      }, 3000) // 3 giây
    }

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
  }, [isDataReady]) // Theo dõi isDataReady để tránh set multiple timers

  return (
    <PreloaderContext.Provider value={{ isDataReady, markDataReady, resetDataReady }}>
      {children}
    </PreloaderContext.Provider>
  )
}

export const usePreloader = () => {
  const context = useContext(PreloaderContext)
  if (!context) {
    throw new Error('usePreloader must be used within a PreloaderProvider')
  }
  return context
}

export default PreloaderContext
