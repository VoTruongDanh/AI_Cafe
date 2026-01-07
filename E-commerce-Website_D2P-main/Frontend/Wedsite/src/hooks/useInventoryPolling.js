import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAutoRefreshPolling } from './useAutoRefreshPolling';
import api from '../services/api';

/**
 * Hook để tự động refresh danh sách inventory imports
 * Sử dụng polling thay vì WebSocket
 */
export const useInventoryPolling = ({ 
  enabled = true, 
  interval = 5000,
  filters = {}
} = {}) => {
  const dispatch = useDispatch();

  const fetchInventory = useCallback(async () => {
    try {
      const response = await api.get('/inventory-imports', { params: filters });
      
      if (response.data) {
        dispatch({ 
          type: 'inventory/setInventory', 
          payload: response.data 
        });
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  }, [dispatch, JSON.stringify(filters)]);

  const { trigger } = useAutoRefreshPolling(fetchInventory, {
    interval,
    enabled,
    onlyWhenVisible: true,
    dependencies: [filters]
  });

  return { trigger, refresh: fetchInventory };
};

export default useInventoryPolling;
