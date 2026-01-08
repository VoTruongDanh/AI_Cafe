// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

// Payment methods
export const PAYMENT_METHODS = {
  COD: 'cod',
  BANK: 'bank',
  CARD: 'card',
}

// Product filters
export const PRODUCT_FILTERS = {
  NEWEST: 'newest',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  NAME_ASC: 'name_asc',
  POPULAR: 'popular',
}

// Price ranges
export const PRICE_RANGES = [
  { label: 'Tất cả', value: '' },
  { label: 'Dưới 5 triệu', value: '0-5000000' },
  { label: '5 - 10 triệu', value: '5000000-10000000' },
  { label: '10 - 20 triệu', value: '10000000-20000000' },
  { label: 'Trên 20 triệu', value: '20000000' },
]

// Routes
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
}

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:id',
    SEARCH: '/products/search',
  },
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: '/cart/items/:id',
    REMOVE_ITEM: '/cart/items/:id',
  },
  ORDERS: {
    LIST: '/orders',
    DETAIL: '/orders/:id',
    CREATE: '/orders',
  },
}

