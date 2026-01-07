import { usePolling } from './usePolling';

/**
 * Hook tổng quát để tự động refresh dữ liệu bằng polling
 * Thay thế cho WebSocket
 * 
 * @param {Function} fetchFunction - Hàm fetch dữ liệu từ API
 * @param {Object} options - Tùy chọn
 * @param {number} options.interval - Thời gian polling (ms), mặc định 5000
 * @param {boolean} options.enabled - Bật/tắt polling, mặc định true
 * @param {boolean} options.onlyWhenVisible - Chỉ poll khi tab đang active, mặc định true
 * @param {Array} options.dependencies - Dependencies để reset polling
 * 
 * @example
 * // Tự động refresh products mỗi 5 giây
 * useAutoRefreshPolling(fetchProducts, { interval: 5000 });
 * 
 * // Chỉ refresh khi tab đang active
 * useAutoRefreshPolling(fetchOrders, { onlyWhenVisible: true });
 * 
 * // Tắt polling khi không cần
 * useAutoRefreshPolling(fetchUsers, { enabled: isAdminPage });
 */
export const useAutoRefreshPolling = (
  fetchFunction,
  {
    interval = 5000,
    enabled = true,
    onlyWhenVisible = true,
    dependencies = []
  } = {}
) => {
  // Kiểm tra tab có đang active không
  const isTabVisible = () => {
    if (!onlyWhenVisible) return true;
    return document.visibilityState === 'visible';
  };

  // Wrapper function để check visibility
  const wrappedFetch = async () => {
    if (isTabVisible()) {
      try {
        await fetchFunction();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }
  };

  // Sử dụng usePolling
  const { trigger } = usePolling(wrappedFetch, interval, enabled, dependencies);

  return { trigger };
};

export default useAutoRefreshPolling;
