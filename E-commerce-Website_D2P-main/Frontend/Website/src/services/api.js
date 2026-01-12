import axios from 'axios'

/**
 * Lấy API URL đúng cách:
 * - Development: sử dụng absolute URL để bypass Vite proxy (tránh lỗi 404 với HTTPS)
 * - Production: sử dụng VITE_API_URL từ .env
 */
export const getApiUrl = () => {
  return import.meta.env.DEV 
    ? 'http://localhost:8000/api'  // Development: dùng absolute URL để bypass proxy
    : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api')  // Production
}

const API_URL = getApiUrl()

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',  // Quan trọng: Báo cho Laravel biết đây là API request
  },
})

// Track active requests
let activeRequests = 0

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Nếu data là FormData, để axios tự động set Content-Type với boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    // Show progress bar for non-React Query requests
    // React Query will handle its own requests via hooks
    // Only track if not explicitly skipped
    if (!config.metadata?.skipProgressBar && !config.metadata?.isReactQuery) {
      activeRequests++
      if (activeRequests === 1) {
        window.dispatchEvent(new CustomEvent('axios:loading:start'))
      }
    }

    return config
  },
  (error) => {
    // Hide progress bar on request error
    if (!error.config?.metadata?.skipProgressBar && !error.config?.metadata?.isReactQuery) {
      activeRequests = Math.max(0, activeRequests - 1)
      if (activeRequests === 0) {
        window.dispatchEvent(new CustomEvent('axios:loading:end'))
      }
    }
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Hide progress bar when request completes
    if (!response.config.metadata?.skipProgressBar && !response.config.metadata?.isReactQuery) {
      activeRequests = Math.max(0, activeRequests - 1)
      if (activeRequests === 0) {
        window.dispatchEvent(new CustomEvent('axios:loading:end'))
      }
    }
    return response
  },
  (error) => {
    // Hide progress bar on response error
    if (!error.config?.metadata?.skipProgressBar && !error.config?.metadata?.isReactQuery) {
      activeRequests = Math.max(0, activeRequests - 1)
      if (activeRequests === 0) {
        window.dispatchEvent(new CustomEvent('axios:loading:end'))
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Chỉ redirect đến login nếu đang ở trang cần auth (không phải trang public)
      const publicPaths = ['/', '/products', '/login', '/register', '/forgot-password', '/reset-password']
      const currentPath = window.location.pathname
      const isPublicPage = publicPaths.some(path => currentPath === path || currentPath.startsWith('/products'))
      
      if (!isPublicPage) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/password/forgot', data),
  verifyResetToken: (token, email) => api.get('/password/verify-token', { params: { token, email } }),
  resetPassword: (data) => api.post('/password/reset', data),
}

// Products API
export const productsApi = {
  getProducts: (params) => {
    // Map frontend params to backend expected format
    const {
      page,
      limit,
      search,
      categoryId,
      filters = {},
      sort,
      _t, // Cache busting timestamp
    } = params || {}

    const query = {
      page,
      per_page: limit,
      sort,
      search: search || undefined,
    }

    // Chỉ thêm filter khi có giá trị
    if (categoryId != null && categoryId !== '') {
      query['filter[category_id]'] = categoryId
    }
    if (filters.price_min != null) {
      query['filter[price_min]'] = filters.price_min
    }
    if (filters.price_max != null) {
      query['filter[price_max]'] = filters.price_max
    }
    if (filters.is_featured != null) {
      query['filter[is_featured]'] = filters.is_featured
    }
    if (filters.has_promotion != null) {
      query['filter[has_promotion]'] = filters.has_promotion
    }
    if (filters.is_flash_sale != null) {
      query['filter[is_flash_sale]'] = filters.is_flash_sale
    }
    if (_t != null) {
      query._t = _t
    }

    console.log('📤 [API] getProducts query:', query);

    return api.get('/products', { params: query })
  },
  getProductDetail: (id) => api.get(`/products/${id}`, { 
    params: { _t: Date.now() } // Cache busting
  }),
  searchProducts: (query) => api.get('/products', { params: { search: query } }),
}

// Categories API
export const categoriesApi = {
  getCategories: () => api.get('/categories'),
  getCategoryById: (id) => api.get(`/categories/${id}`),
}

// Cart API
export const cartApi = {
  getCart: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (id, data) => api.patch(`/cart/items/${id}`, data),
  removeItem: (id) => api.delete(`/cart/items/${id}`),
  clearCart: () => api.delete('/cart'),
  applyPromotion: (code) => api.post('/cart/apply-promotion', { code }),
  removePromotion: () => api.post('/cart/remove-promotion'),
}

// Orders API
export const ordersApi = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  cancelOrder: (id, data) => api.put(`/orders/${id}/cancel`, data),
  getQRCode: (id) => api.get(`/orders/${id}/payment/qr-code`),
  getMoMoQRCode: (id) => api.get(`/orders/${id}/payment/momo-qr-code`),
  confirmTransfer: (id, data) => api.post(`/orders/${id}/confirm-transfer`, data),
  // MoMo Payment API (thanh toán tự động với webhook)
  createMoMoPayment: (id) => api.post(`/orders/${id}/momo/create`),
  checkMoMoStatus: (id) => api.get(`/orders/${id}/momo/status`),
}

// Payments API
export const paymentsApi = {
  getQrCode: (orderId) => api.get(`/orders/${orderId}/payment/qr-code`),
  checkPaymentStatus: (orderId) => api.get(`/orders/${orderId}/payment/status`),
  // MoMo Payment
  createMoMoPayment: (orderId) => api.post(`/orders/${orderId}/momo/create`),
  checkMoMoStatus: (orderId) => api.get(`/orders/${orderId}/momo/status`),
  // VNPay Payment
  createVNPayPayment: (orderId) => api.post(`/payments/vnpay/create/${orderId}`),
  checkVNPayStatus: (txnRef) => api.get(`/payments/vnpay/status/${txnRef}`),
  getVNPayInfo: () => api.get('/payments/vnpay/info'),
  // VNPay verify return (gọi backend để xác thực và cập nhật order)
  verifyVNPayReturn: (params) => api.get('/payments/vnpay/verify', { params }),
}

// Payment Methods API
export const paymentMethodsApi = {
  getPaymentMethods: () => api.get('/payment-methods'),
  getPaymentMethodById: (id) => api.get(`/payment-methods/${id}`),
}

// Promotions API
export const promotionsApi = {
  getPromotions: (params) => {
    console.log('📤 [API] getPromotions params:', params);
    return api.get('/promotions', { params });
  },
  getPromotionById: (id) => api.get(`/promotions/${id}`),
  validatePromotion: (data) => api.post('/promotions/validate', data),
}

// Admin Products API
export const adminProductsApi = {
  getAll: (params) => api.get('/admin/products', { params }),
  getById: (id) => api.get(`/admin/products/${id}`),
  create: (data) => {
    // Nếu data là FormData, cần set header multipart/form-data
    if (data instanceof FormData) {
      return api.post('/admin/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/admin/products', data);
  },
  update: (id, data) => {
    // Nếu data là FormData, cần set header multipart/form-data
    // Sử dụng POST với _method=PUT vì multipart không hỗ trợ PUT trực tiếp trong PHP
    if (data instanceof FormData) {
      return api.post(`/admin/products/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/admin/products/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/products/${id}`),
  generateSku: (data) => api.post('/admin/products/generate-sku', data),
  uploadImage: (id, file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post(`/admin/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Admin Orders API
export const adminOrdersApi = {
  getAll: (params) => api.get('/admin/orders', { params }),
  getById: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  getStatistics: () => api.get('/admin/orders/statistics'),
  verifyPayment: (id) => api.post(`/admin/orders/${id}/verify-payment`),
  rejectPayment: (id, reason) => api.post(`/admin/orders/${id}/reject-payment`, { reason }),
  processRefund: (id, data) => api.post(`/admin/orders/${id}/process-refund`, data),
  confirmCancel: (id, data) => api.post(`/admin/orders/${id}/confirm-cancel`, data),
  rejectCancel: (id, reason) => api.post(`/admin/orders/${id}/reject-cancel`, { reject_reason: reason }),
}

// Admin Users API
export const adminUsersApi = {
  getAll: (params) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
  uploadAvatar: (id, data) => api.post(`/admin/users/${id}/upload-avatar`, data),
}

// Face Recognition API
export const faceRecognitionApi = {
  checkStatus: () => api.get('/admin/face/status'),
  getCustomers: () => api.get('/admin/face/customers'),
  recognize: (imageBase64) => {
    const url = `${API_URL}/admin/face/recognize`;
    console.log('[API] Calling recognize:', url);
    console.log('[API] Token exists:', !!localStorage.getItem('token'));
    return api.post('/admin/face/recognize', { image_base64: imageBase64 });
  },
  detect: (imageBase64) => api.post('/admin/face/detect', { image_base64: imageBase64 }), // Debug
  clearCache: () => api.post('/admin/face/clear-cache'),
  updateAvatar: (customerId, croppedFace) => api.post('/admin/face/update-avatar', { 
    customer_id: customerId, 
    cropped_face: croppedFace 
  }), // NV update avatar thủ công
}

// Face Recognition V2 API (ArcFace)
export const faceRecognitionV2Api = {
  checkStatus: () => api.get('/admin/face/v2/status'),
  getCustomers: () => api.get('/admin/face/v2/customers'),
  recognize: (imageBase64) => {
    const url = `${API_URL}/admin/face/v2/recognize`;
    console.log('[API V2] Calling recognize:', url);
    return api.post('/admin/face/v2/recognize', { image_base64: imageBase64 });
  },
}

// Admin Categories API
export const adminCategoriesApi = {
  getAll: () => api.get('/admin/categories'),
  getById: (id) => api.get(`/admin/categories/${id}`),
  create: (data) => api.post('/admin/categories', data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  delete: (id) => api.delete(`/admin/categories/${id}`),
}

// Admin Dashboard API
export const adminDashboardApi = {
  getStatistics: () => api.get('/admin/dashboard/statistics'),
  getTodayStatistics: () => api.get('/admin/dashboard/today-statistics'),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getTopProducts: () => api.get('/admin/dashboard/top-products'),
  getSalesChart: (period) => api.get('/admin/dashboard/sales-chart', { params: { period } }),
}

// Admin Promotions API
export const adminPromotionsApi = {
  getAll: (params) => api.get('/admin/promotions', { params }),
  getById: (id) => api.get(`/admin/promotions/${id}`),
  create: (data) => api.post('/admin/promotions', data),
  update: (id, data) => api.put(`/admin/promotions/${id}`, data),
  delete: (id) => api.delete(`/admin/promotions/${id}`),
}

// Admin Inventory API
export const adminInventoryApi = {
  getAll: (params) => api.get('/admin/inventory-imports', { params }),
  getById: (id) => api.get(`/admin/inventory-imports/${id}`),
  create: (data) => api.post('/admin/inventory-imports', data),
  update: (id, data) => api.put(`/admin/inventory-imports/${id}`, data),
  updateStatus: (id, status) => api.put(`/admin/inventory-imports/${id}/status`, { status }),
  delete: (id) => api.delete(`/admin/inventory-imports/${id}`),
}

// Suppliers API
export const suppliersApi = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
}

// Admin Suppliers API
export const adminSuppliersApi = {
  getAll: () => api.get('/admin/suppliers'),
  getById: (id) => api.get(`/admin/suppliers/${id}`),
  create: (data) => api.post('/admin/suppliers', data),
  update: (id, data) => api.put(`/admin/suppliers/${id}`, data),
  delete: (id) => api.delete(`/admin/suppliers/${id}`),
}

// Reviews API
export const reviewsApi = {
  getProductReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
  createReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
}

// Return Requests API
export const returnRequestsApi = {
  getAll: (params) => api.get('/return-requests', { params }),
  create: (data) => api.post('/return-requests', data),
  update: (id, data) => api.put(`/return-requests/${id}`, data),
}

// Stock Alerts API
export const stockAlertsApi = {
  subscribe: (productId, email) => api.post('/stock-alerts/subscribe', { product_id: productId, email }),
  unsubscribe: (productId) => api.delete(`/stock-alerts/unsubscribe/${productId}`),
  myAlerts: () => api.get('/stock-alerts/my-alerts'),
  checkSubscription: (productId) => api.get(`/stock-alerts/check/${productId}`),
}

// Wishlist API
export const wishlistApi = {
  getAll: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist', { product_id: productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  clear: () => api.post('/wishlist/clear'),
  check: (productId) => api.get(`/wishlist/check/${productId}`),
  count: () => api.get('/wishlist/count'),
  sync: (productIds) => api.post('/wishlist/sync', { product_ids: productIds }),
}

// Recently Viewed API
export const recentlyViewedApi = {
  getAll: (limit = 12) => api.get('/recently-viewed', { params: { limit } }),
  add: (productId) => api.post('/recently-viewed', { product_id: productId }),
  remove: (productId) => api.delete(`/recently-viewed/${productId}`),
  clear: () => api.delete('/recently-viewed/clear'),
  sync: (productIds) => api.post('/recently-viewed/sync', { product_ids: productIds }),
}

export default api

