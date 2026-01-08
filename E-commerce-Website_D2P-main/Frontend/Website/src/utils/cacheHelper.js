/**
 * Cache Helper - Lưu cache vào localStorage để tối ưu tốc độ load
 * Chỉ cache các dữ liệu ít thay đổi: categories, suppliers, brands
 */

const CACHE_PREFIX = 'es_cache_';
const CACHE_VERSION = 'v1';

// Thời gian cache mặc định (ms)
const CACHE_DURATIONS = {
  categories: 30 * 60 * 1000,    // 30 phút - ít thay đổi
  suppliers: 60 * 60 * 1000,     // 1 giờ - rất ít thay đổi
  brands: 60 * 60 * 1000,        // 1 giờ - rất ít thay đổi
  products: 5 * 60 * 1000,       // 5 phút - thay đổi thường xuyên hơn
  promotions: 10 * 60 * 1000,    // 10 phút
};

/**
 * Lấy key cache đầy đủ
 */
const getCacheKey = (key) => `${CACHE_PREFIX}${CACHE_VERSION}_${key}`;

/**
 * Lưu data vào cache
 * @param {string} key - Tên cache (categories, suppliers, etc.)
 * @param {any} data - Dữ liệu cần cache
 * @param {number} duration - Thời gian cache (ms), mặc định theo CACHE_DURATIONS
 */
export const setCache = (key, data, duration = null) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (duration || CACHE_DURATIONS[key] || 5 * 60 * 1000),
    };
    localStorage.setItem(getCacheKey(key), JSON.stringify(cacheData));
    console.log(`💾 [Cache] Saved: ${key}`);
  } catch (error) {
    console.warn(`⚠️ [Cache] Failed to save ${key}:`, error.message);
    // Nếu localStorage đầy, xóa cache cũ
    if (error.name === 'QuotaExceededError') {
      clearAllCache();
    }
  }
};

/**
 * Lấy data từ cache
 * @param {string} key - Tên cache
 * @returns {any|null} - Dữ liệu hoặc null nếu hết hạn/không có
 */
export const getCache = (key) => {
  try {
    const cached = localStorage.getItem(getCacheKey(key));
    if (!cached) return null;

    const { data, expiry } = JSON.parse(cached);
    
    // Kiểm tra hết hạn
    if (Date.now() > expiry) {
      localStorage.removeItem(getCacheKey(key));
      console.log(`🗑️ [Cache] Expired: ${key}`);
      return null;
    }

    console.log(`✅ [Cache] Hit: ${key}`);
    return data;
  } catch (error) {
    console.warn(`⚠️ [Cache] Failed to get ${key}:`, error.message);
    return null;
  }
};

/**
 * Kiểm tra cache còn hợp lệ không
 */
export const isCacheValid = (key) => {
  return getCache(key) !== null;
};

/**
 * Xóa một cache cụ thể
 */
export const clearCache = (key) => {
  localStorage.removeItem(getCacheKey(key));
  console.log(`🗑️ [Cache] Cleared: ${key}`);
};

/**
 * Xóa tất cả cache của app
 */
export const clearAllCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log('🗑️ [Cache] Cleared all cache');
};

/**
 * Lấy thông tin cache (debug)
 */
export const getCacheInfo = () => {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
  
  return cacheKeys.map((key) => {
    try {
      const cached = JSON.parse(localStorage.getItem(key));
      const remaining = Math.max(0, cached.expiry - Date.now());
      return {
        key: key.replace(CACHE_PREFIX + CACHE_VERSION + '_', ''),
        size: localStorage.getItem(key).length,
        expiresIn: Math.round(remaining / 1000) + 's',
        isValid: remaining > 0,
      };
    } catch {
      return { key, error: true };
    }
  });
};

export default {
  set: setCache,
  get: getCache,
  clear: clearCache,
  clearAll: clearAllCache,
  isValid: isCacheValid,
  getInfo: getCacheInfo,
  DURATIONS: CACHE_DURATIONS,
};
