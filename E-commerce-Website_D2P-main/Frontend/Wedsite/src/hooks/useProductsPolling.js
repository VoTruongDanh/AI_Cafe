import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAutoRefreshPolling } from './useAutoRefreshPolling';
import api from '../services/api';

/**
 * Hook để tự động refresh danh sách products
 * Sử dụng polling thay vì WebSocket
 * 
 * @param {Object} options - Tùy chọn
 * @param {boolean} options.enabled - Bật/tắt auto refresh
 * @param {number} options.interval - Thời gian polling (ms)
 * @param {Object} options.filters - Filters để fetch products
 */
export const useProductsPolling = ({ 
  enabled = true, 
  interval = 5000,
  filters = {}
} = {}) => {
  const dispatch = useDispatch();

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products', { params: filters });
      
      // Dispatch action để update Redux store
      if (response.data) {
        dispatch({ 
          type: 'products/setProducts', 
          payload: response.data 
        });
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, [dispatch, JSON.stringify(filters)]);

  const { trigger } = useAutoRefreshPolling(fetchProducts, {
    interval,
    enabled,
    onlyWhenVisible: true,
    dependencies: [filters]
  });

  return { trigger, refresh: fetchProducts };
};

export default useProductsPolling;
