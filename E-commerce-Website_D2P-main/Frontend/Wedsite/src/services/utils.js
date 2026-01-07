// Format currency
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫'
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

// Format date
export const formatDate = (date, format = 'dd/MM/yyyy') => {
  const d = new Date(date)
  return d.toLocaleDateString('vi-VN')
}

// Format date time
export const formatDateTime = (date) => {
  if (!date) return 'N/A'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (e) {
    return 'N/A'
  }
}

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Calculate discount percentage
export const calculateDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    pending: '#ff9800',
    pending_cancel: '#e65100', // Dark orange - chờ xác nhận hủy
    processing: '#2196f3',
    confirmed: '#2196f3',
    shipped: '#9c27b0',
    delivered: '#4caf50',
    cancelled: '#f44336',
    completed: '#4caf50',
    failed: '#f44336',
    returned: '#9c27b0',
  }
  return colors[status?.toLowerCase()] || '#757575'
}

// Get status text
export const getStatusText = (status) => {
  const texts = {
    pending: 'Chờ xử lý',
    pending_cancel: 'Chờ xác nhận hủy',
    processing: 'Đang xử lý',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang giao hàng',
    delivered: 'Đã giao hàng',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
    failed: 'Thất bại',
    returned: 'Đã trả hàng',
  }
  return texts[status?.toLowerCase()] || status || 'Chưa xác định'
}

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Validate phone
export const validatePhone = (phone) => {
  const re = /^[0-9]{10,11}$/
  return re.test(phone)
}

// Validate password
export const validatePassword = (password) => {
  return password.length >= 6
}

// Scroll to top
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Copy to clipboard
export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
}

// Generate unique ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

// Get image URL - Add API base URL if path is relative
export const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300x300?text=No+Image'
  
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // Get API URL from env
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
  const baseUrl = apiUrl.replace('/api', '')
  
  // Add base URL to relative path
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`
}

