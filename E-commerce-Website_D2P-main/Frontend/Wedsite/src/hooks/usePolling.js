import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook để tự động polling (gọi API định kỳ)
 * 
 * @param {Function} callback - Hàm sẽ được gọi mỗi interval
 * @param {number} interval - Thời gian giữa các lần gọi (ms), mặc định 5000ms (5 giây)
 * @param {boolean} enabled - Bật/tắt polling, mặc định true
 * @param {Array} dependencies - Dependencies để reset polling khi thay đổi
 * 
 * @example
 * usePolling(() => fetchUsers(), 5000, true, []);
 */
export const usePolling = (callback, interval = 5000, enabled = true, dependencies = []) => {
  const savedCallback = useRef();
  const intervalRef = useRef();

  // Lưu callback mới nhất
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Gọi ngay lần đầu
    if (savedCallback.current) {
      savedCallback.current();
    }

    // Setup interval
    intervalRef.current = setInterval(() => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled, ...dependencies]);

  // Return manual trigger function
  const trigger = useCallback(() => {
    if (savedCallback.current) {
      savedCallback.current();
    }
  }, []);

  return { trigger };
};

export default usePolling;
