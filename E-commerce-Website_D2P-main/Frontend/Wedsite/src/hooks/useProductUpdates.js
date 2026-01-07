import { useEffect } from 'react'

/**
 * Hook để listen product updates từ WebSocket
 * Tự động trigger callback khi có sản phẩm được cập nhật
 * 
 * @param {Function} onProductUpdated - Callback khi có product update
 * @param {Array} deps - Dependencies cho useEffect
 */
export const useProductUpdates = (onProductUpdated, deps = []) => {
  useEffect(() => {
    const handleProductUpdate = (event) => {
      const updatedProduct = event.detail
      console.log('🔄 [useProductUpdates] Product updated, triggering callback', updatedProduct)
      
      if (onProductUpdated) {
        onProductUpdated(updatedProduct)
      }
    }

    // Listen to custom event from useGlobalSync
    window.addEventListener('productUpdated', handleProductUpdate)

    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate)
    }
  }, [onProductUpdated, ...deps])
}
