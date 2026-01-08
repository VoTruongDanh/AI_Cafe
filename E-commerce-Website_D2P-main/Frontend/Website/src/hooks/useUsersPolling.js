import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAutoRefreshPolling } from './useAutoRefreshPolling';
import api from '../services/api';

/**
 * Hook để tự động refresh danh sách users (Admin only)
 * Sử dụng polling thay vì WebSocket
 */
export const useUsersPolling = ({ 
  enabled = true, 
  interval = 5000,
  filters = {}
} = {}) => {
  const dispatch = useDispatch();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users', { params: filters });
      
      if (response.data) {
        dispatch({ 
          type: 'users/setUsers', 
          payload: response.data 
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [dispatch, JSON.stringify(filters)]);

  const { trigger } = useAutoRefreshPolling(fetchUsers, {
    interval,
    enabled,
    onlyWhenVisible: true,
    dependencies: [filters]
  });

  return { trigger, refresh: fetchUsers };
};

export default useUsersPolling;
