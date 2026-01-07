import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAutoRefreshPolling } from './useAutoRefreshPolling';
import api from '../services/api';

/**
 * Hook để tự động refresh danh sách promotions
 * Sử dụng polling thay vì WebSocket
 */
export const usePromotionsPolling = ({ 
  enabled = true, 
  interval = 5000,
  filters = {}
} = {}) => {
  const dispatch = useDispatch();

  const fetchPromotions = useCallback(async () => {
    try {
      const response = await api.get('/promotions', { params: filters });
      
      if (response.data) {
        dispatch({ 
          type: 'promotions/setPromotions', 
          payload: response.data 
        });
      }
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    }
  }, [dispatch, JSON.stringify(filters)]);

  const { trigger } = useAutoRefreshPolling(fetchPromotions, {
    interval,
    enabled,
    onlyWhenVisible: true,
    dependencies: [filters]
  });

  return { trigger, refresh: fetchPromotions };
};

export default usePromotionsPolling;
