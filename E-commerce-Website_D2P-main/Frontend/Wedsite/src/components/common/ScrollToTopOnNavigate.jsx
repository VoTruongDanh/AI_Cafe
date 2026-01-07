import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Component tự động scroll lên đầu trang khi chuyển route
 * Đặt component này bên trong Router
 */
const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll lên đầu trang khi pathname thay đổi
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

export default ScrollToTopOnNavigate
