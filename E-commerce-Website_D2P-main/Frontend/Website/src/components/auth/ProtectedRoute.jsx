import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const location = useLocation()

  if (!isAuthenticated) {
    // Lưu URL hiện tại để quay lại sau khi đăng nhập
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute

