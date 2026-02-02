import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { CircularProgress, Box } from '@mui/material'

// Initialize Echo (Pusher WebSocket)
import './utils/echo'

// Layouts - Load ngay (cần thiết)
import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'

// ✅ CRITICAL PAGES - Load ngay (trang chủ, login)
import Home from './pages/user/Home'
import Login from './pages/auth/Login'

// ✅ LAZY LOAD - Load khi cần (Code Splitting)
// User Pages
const Products = lazy(() => import('./pages/user/Products'))
const ProductDetail = lazy(() => import('./pages/user/ProductDetail'))
const Cart = lazy(() => import('./pages/user/Cart'))
const Checkout = lazy(() => import('./pages/user/Checkout'))
const MoMoPayment = lazy(() => import('./pages/user/MoMoPayment'))
const VNPayPayment = lazy(() => import('./pages/user/VNPayPayment'))
const VNPayReturn = lazy(() => import('./pages/user/VNPayReturn'))
const PaymentResult = lazy(() => import('./pages/user/PaymentResult'))
const Orders = lazy(() => import('./pages/user/Orders'))
const OrderPayment = lazy(() => import('./pages/user/OrderPayment'))
const Profile = lazy(() => import('./pages/user/Profile'))
const Wishlist = lazy(() => import('./pages/user/Wishlist'))
const Contact = lazy(() => import('./pages/user/Contact'))
const FAQ = lazy(() => import('./pages/user/FAQ'))
const PromotionGuide = lazy(() => import('./pages/user/PromotionGuide'))
const ServiceWarranty = lazy(() => import('./pages/user/ServiceWarranty'))
const Promotions = lazy(() => import('./pages/user/Promotions'))
const BusinessSales = lazy(() => import('./pages/user/BusinessSales'))
const AIPage = lazy(() => import('./pages/user/AIPage'))

// Auth Pages
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const OAuthCallback = lazy(() => import('./pages/auth/OAuthCallback'))
const NotFound = lazy(() => import('./pages/common/NotFound'))

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminPromotions = lazy(() => import('./pages/admin/Promotions'))
const AdminInventory = lazy(() => import('./pages/admin/Inventory'))
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'))
const AdminProfile = lazy(() => import('./pages/admin/Profile'))
const AdminAIClassification = lazy(() => import('./pages/admin/AIClassification'))
const AdminFaceRecognition = lazy(() => import('./pages/admin/FaceRecognition'))
const AdminFaceRecognitionV2 = lazy(() => import('./pages/admin/FaceRecognitionV2'))

// Protected Route components
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'

// Preloader
import Preloader from './components/common/Preloader'
// Top Progress Bar
import TopProgressBar from './components/common/TopProgressBar'
// Scroll to Top Button
import ScrollToTop from './components/common/ScrollToTop'
// Auto scroll to top on route change
import ScrollToTopOnNavigate from './components/common/ScrollToTopOnNavigate'

// Preloader Context
import { PreloaderProvider, usePreloader } from './contexts/PreloaderContext'

// Live Chat
import LiveChat from './components/common/LiveChat'

// Hooks
import { useRecentlyViewedSync } from './hooks/useRecentlyViewedSync'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from './store/slices/authSlice'
import { authApi } from './services/api'
// ❌ Removed: import { useProductsWebSocket } from './hooks/useProductsWebSocket'
// ❌ Removed: import { updateProduct } from './store/slices/productsSlice'
// import { useGlobalAutoRefresh } from './hooks/useGlobalAutoRefresh' // ❌ DISABLED: Đã dùng WebSocket thay thế

// ✅ Loading Component cho Lazy Loading
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
    }}
  >
    <CircularProgress size={40} sx={{ color: '#e63946' }} />
  </Box>
)

// Main App Content - Separated to use PreloaderContext
const AppContent = () => {
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const { isDataReady } = usePreloader()
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)

  // Sync recently viewed products when user logs in
  useRecentlyViewedSync()

  // ❌ Removed WebSocket - Không cần realtime updates nữa

  // ✅ Clear session mỗi khi khởi động ứng dụng (đóng/mở trình duyệt)
  useEffect(() => {
    // Kiểm tra xem có phải lần đầu load app không (không phải refresh)
    const isNewSession = !sessionStorage.getItem('app_session_active')
    
    if (isNewSession) {
      // Lần đầu mở app trong session mới → Clear tất cả auth data
      console.log('🔄 New browser session detected, clearing auth data...')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      localStorage.removeItem('user_token')
      localStorage.removeItem('user_user')
      dispatch(logoutUser())
      
      // Đánh dấu session đã active
      sessionStorage.setItem('app_session_active', 'true')
    } else {
      // Đã có session (user refresh trang) → Verify token
      const verifyToken = async () => {
        const token = localStorage.getItem('token')
        if (token && isAuthenticated) {
          try {
            // Thử gọi API để verify token
            await authApi.getCurrentUser()
            console.log('✅ Token is valid')
          } catch (error) {
            // Token không hợp lệ, clear và logout
            console.warn('⚠️ Token is invalid, logging out...')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_user')
            localStorage.removeItem('user_token')
            localStorage.removeItem('user_user')
            dispatch(logoutUser())
          }
        }
      }

      verifyToken()
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    // Check if page is already loaded
    const checkPageLoad = () => {
      if (document.readyState === 'complete') {
        setIsPageLoaded(true)
      }
    }

    checkPageLoad()
    window.addEventListener('load', () => setIsPageLoaded(true))

    // Minimum loading time: 1.5 seconds for smooth UX
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, 1500)

    return () => {
      clearTimeout(minTimer)
      window.removeEventListener('load', () => setIsPageLoaded(true))
    }
  }, [])

  // Show preloader until: page loaded + minimum time elapsed + data ready
  const showPreloader = !isPageLoaded || !minTimeElapsed || !isDataReady

  return (
    <>
      <Preloader isLoading={showPreloader} />
      <TopProgressBar />
      <Router>
        <ScrollToTopOnNavigate />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* User routes */}
          <Route path="/" element={<UserLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="orders/:orderId/payment" element={<ProtectedRoute><OrderPayment /></ProtectedRoute>} />
            <Route path="orders/:orderId/momo" element={<ProtectedRoute><MoMoPayment /></ProtectedRoute>} />
            <Route path="orders/:orderId/vnpay" element={<ProtectedRoute><VNPayPayment /></ProtectedRoute>} />
            <Route path="payment/vnpay/return" element={<VNPayReturn />} />
            <Route path="payment/result" element={<PaymentResult />} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="promotion-guide" element={<PromotionGuide />} />
            <Route path="service-warranty" element={<ServiceWarranty />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="business-sales" element={<BusinessSales />} />
            <Route path="AI" element={<AIPage />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="ai-classification" element={<AdminAIClassification />} />
              <Route path="face-recognition-v2" element={<AdminFaceRecognitionV2 />} />
              <Route path="face-recognition-v1" element={<AdminFaceRecognition />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        
        {/* Scroll to Top Button */}
        <ScrollToTop />
        
        {/* Live Chat Widget */}
        <LiveChat />
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </>
  )
}

function App() {
  return (
    <PreloaderProvider>
      <AppContent />
    </PreloaderProvider>
  )
}

export default App

