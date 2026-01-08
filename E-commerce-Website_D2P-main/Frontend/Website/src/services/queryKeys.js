// Query keys for TanStack Query (React Query)
// Giúp quản lý cache và refetch data một cách hiệu quả

export const queryKeys = {
  // Auth
  auth: {
    currentUser: ['auth', 'currentUser'],
  },

  // Products
  products: {
    all: ['products'],
    list: (params) => ['products', 'list', params],
    detail: (id) => ['products', 'detail', id],
    search: (query) => ['products', 'search', query],
  },

  // Categories
  categories: {
    all: ['categories'],
    detail: (id) => ['categories', 'detail', id],
  },

  // Cart
  cart: {
    all: ['cart'],
  },

  // Orders
  orders: {
    all: ['orders'],
    detail: (id) => ['orders', 'detail', id],
  },

  // Admin Products
  adminProducts: {
    all: ['admin', 'products'],
    list: (params) => ['admin', 'products', 'list', params],
    detail: (id) => ['admin', 'products', 'detail', id],
  },

  // Admin Orders
  adminOrders: {
    all: ['admin', 'orders'],
    list: (params) => ['admin', 'orders', 'list', params],
    detail: (id) => ['admin', 'orders', 'detail', id],
    statistics: ['admin', 'orders', 'statistics'],
  },

  // Admin Users
  adminUsers: {
    all: ['admin', 'users'],
    list: (params) => ['admin', 'users', 'list', params],
    detail: (id) => ['admin', 'users', 'detail', id],
  },

  // Admin Dashboard
  adminDashboard: {
    statistics: ['admin', 'dashboard', 'statistics'],
    recentOrders: ['admin', 'dashboard', 'recent-orders'],
    topProducts: ['admin', 'dashboard', 'top-products'],
    salesChart: (period) => ['admin', 'dashboard', 'sales-chart', period],
  },
}

