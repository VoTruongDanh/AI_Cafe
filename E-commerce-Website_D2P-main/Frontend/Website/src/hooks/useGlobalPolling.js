import { useProductsPolling } from './useProductsPolling';
import { useOrdersPolling } from './useOrdersPolling';
import { useInventoryPolling } from './useInventoryPolling';
import { useCategoriesPolling } from './useCategoriesPolling';
import { useUsersPolling } from './useUsersPolling';
import { usePromotionsPolling } from './usePromotionsPolling';

/**
 * Hook tổng quát để bật auto-refresh cho toàn bộ hệ thống
 * Sử dụng polling thay vì WebSocket
 * 
 * @param {Object} options - Tùy chọn cho từng module
 * @param {boolean} options.products - Bật/tắt polling cho products
 * @param {boolean} options.orders - Bật/tắt polling cho orders
 * @param {boolean} options.inventory - Bật/tắt polling cho inventory
 * @param {boolean} options.categories - Bật/tắt polling cho categories
 * @param {boolean} options.users - Bật/tắt polling cho users (admin only)
 * @param {boolean} options.promotions - Bật/tắt polling cho promotions
 * @param {number} options.interval - Thời gian polling chung (ms)
 * 
 * @example
 * // Trong Admin Layout - bật tất cả
 * useGlobalPolling({
 *   products: true,
 *   orders: true,
 *   inventory: true,
 *   categories: true,
 *   users: true,
 *   promotions: true,
 *   interval: 5000
 * });
 * 
 * // Trong Customer Layout - chỉ bật products và orders
 * useGlobalPolling({
 *   products: true,
 *   orders: true,
 *   interval: 5000
 * });
 */
export const useGlobalPolling = ({
  products = false,
  orders = false,
  inventory = false,
  categories = false,
  users = false,
  promotions = false,
  interval = 5000,
  filters = {}
} = {}) => {
  // Products polling
  const productsPolling = useProductsPolling({
    enabled: products,
    interval,
    filters: filters.products || {}
  });

  // Orders polling
  const ordersPolling = useOrdersPolling({
    enabled: orders,
    interval,
    filters: filters.orders || {}
  });

  // Inventory polling
  const inventoryPolling = useInventoryPolling({
    enabled: inventory,
    interval,
    filters: filters.inventory || {}
  });

  // Categories polling (ít thay đổi hơn, interval dài hơn)
  const categoriesPolling = useCategoriesPolling({
    enabled: categories,
    interval: interval * 2 // Categories ít thay đổi, polling chậm hơn
  });

  // Users polling (admin only)
  const usersPolling = useUsersPolling({
    enabled: users,
    interval,
    filters: filters.users || {}
  });

  // Promotions polling
  const promotionsPolling = usePromotionsPolling({
    enabled: promotions,
    interval,
    filters: filters.promotions || {}
  });

  // Return manual refresh functions
  return {
    refreshProducts: productsPolling.refresh,
    refreshOrders: ordersPolling.refresh,
    refreshInventory: inventoryPolling.refresh,
    refreshCategories: categoriesPolling.refresh,
    refreshUsers: usersPolling.refresh,
    refreshPromotions: promotionsPolling.refresh,
    refreshAll: () => {
      if (products) productsPolling.refresh();
      if (orders) ordersPolling.refresh();
      if (inventory) inventoryPolling.refresh();
      if (categories) categoriesPolling.refresh();
      if (users) usersPolling.refresh();
      if (promotions) promotionsPolling.refresh();
    }
  };
};

export default useGlobalPolling;
