import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAutoRefreshPolling } from './useAutoRefreshPolling';
import api from '../services/api';

/**
 * Hook để tự động refresh danh sách categories
 * Sử dụng polling thay vì WebSocket
 */
export const useCategoriesPolling = ({ 
  enabled = true, 
  interval = 10000 // Categories ít thay đổi hơn, 10 giây là đủ
} = {}) => {
  const dispatch = useDispatch();

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      
      if (response.data) {
        dispatch({ 
          type: 'categories/setCategories', 
          payload: response.data 
        });
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [dispatch]);

  const { trigger } = useAutoRefreshPolling(fetchCategories, {
    interval,
    enabled,
    onlyWhenVisible: true
  });

  return { trigger, refresh: fetchCategories };
};

export default useCategoriesPolling;
