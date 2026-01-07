import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAutoRefreshPolling } from './useAutoRefreshPolling';
import api from '../services/api';

/**
 * Hook để tự động refresh danh sách orders
 * Sử dụng polling thay vì WebSocket
 */
export const useOrdersPolling = ({ 
  enabled = true, 
  interval = 5000,
  filters = {}
} = {}) => {
  const dispatch = useDispatch();

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/orders', { params: filters });
      
      if (response.data) {
        dispatch({ 
          type: 'orders/setOrders', 
          payload: response.data 
        });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [dispatch, JSON.stringify(filters)]);

  const { trigger } = useAutoRefreshPolling(fetchOrders, {
    interval,
    enabled,
    onlyWhenVisible: true,
    dependencies: [filters]
  });

  return { trigger, refresh: fetchOrders };
};

export default useOrdersPolling;
