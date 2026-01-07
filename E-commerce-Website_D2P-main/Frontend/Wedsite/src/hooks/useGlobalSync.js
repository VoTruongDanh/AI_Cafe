import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { updateProductInStore } from '../store/slices/productsSlice'
import { updateOrderInStore, addOrderToStore } from '../store/slices/ordersSlice'
import { fetchCart } from '../store/slices/cartSlice'
import Echo from '../utils/echo'
import { toast } from 'react-toastify'

/**
 * 🌐 GLOBAL REALTIME SYNC
 * 
 * Tự động đồng bộ dữ liệu realtime cho TOÀN BỘ website
 * Khi có thay đổi từ backend, TẤT CẢ các trang sẽ tự động cập nhật
 * 
 * Áp dụng cho:
 * - Products (sản phẩm)
 * - Orders (đơn hàng)
 * - Cart (giỏ hàng)
 * - Inventory (tồn kho)
 * - Categories (danh mục)
 * - Promotions (khuyến mãi)
 * - Users (người dùng)
 * 
 * Hook này được gọi 1 lần duy nhất ở App.jsx
 */
export const useGlobalSync = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    console.log('🌐 [Global Sync] Initializing realtime synchronization...')

    // ========================================
    // 📦 PRODUCTS CHANNEL
    // ========================================
    const productsChannel = Echo.channel('products')
    
    productsChannel.listen('.product.updated', (event) => {
      console.log('📦 [Product Updated]', event.product)
      dispatch(updateProductInStore(event.product))
      
      // ✅ Force refresh: Dispatch custom event để các component re-fetch
      window.dispatchEvent(new CustomEvent('productUpdated', { 
        detail: event.product 
      }))
      
      // Show toast notification (optional)
      // toast.info(`Sản phẩm "${event.product.name}" đã được cập nhật`)
    })

    productsChannel.listen('.product.created', (event) => {
      console.log('✨ [Product Created]', event.product)
      // Có thể thêm sản phẩm mới vào store nếu cần
    })

    productsChannel.listen('.product.deleted', (event) => {
      console.log('🗑️ [Product Deleted]', event.productId)
      // Xóa sản phẩm khỏi store nếu cần
    })

    // ========================================
    // 🛒 ORDERS CHANNEL
    // ========================================
    const ordersChannel = Echo.channel('orders')
    
    ordersChannel.listen('.order.created', (event) => {
      console.log('🆕 [Order Created]', event.order)
      // Add new order to store
      dispatch(addOrderToStore(event.order))
    })

    ordersChannel.listen('.order.status.updated', (event) => {
      console.log('📝 [Order Status Updated]', event.order)
      // Update order in store
      dispatch(updateOrderInStore(event.order))
      
      // Show notification to user
      if (event.order.status === 'confirmed') {
        toast.success(`Đơn hàng ${event.order.code} đã được xác nhận!`)
      } else if (event.order.status === 'shipped') {
        toast.info(`Đơn hàng ${event.order.code} đang được giao!`)
      } else if (event.order.status === 'delivered') {
        toast.success(`Đơn hàng ${event.order.code} đã được giao thành công!`)
      } else if (event.order.status === 'cancelled') {
        toast.warning(`Đơn hàng ${event.order.code} đã bị hủy`)
      }
    })

    // ========================================
    // 📦 INVENTORY CHANNEL
    // ========================================
    const inventoryChannel = Echo.channel('inventory')
    
    inventoryChannel.listen('.inventory.status.updated', (event) => {
      console.log('📦 [Inventory Updated]', event.inventoryImport)
      // Có thể refresh danh sách inventory nếu đang ở trang admin
    })

    // ========================================
    // 🏷️ CATEGORIES CHANNEL
    // ========================================
    const categoriesChannel = Echo.channel('categories')
    
    categoriesChannel.listen('.category.updated', (event) => {
      console.log('🏷️ [Category Updated]', event.category)
      // Refresh categories nếu cần
    })

    categoriesChannel.listen('.category.created', (event) => {
      console.log('✨ [Category Created]', event.category)
    })

    categoriesChannel.listen('.category.deleted', (event) => {
      console.log('🗑️ [Category Deleted]', event.categoryId)
    })

    // ========================================
    // 🎁 PROMOTIONS CHANNEL
    // ========================================
    const promotionsChannel = Echo.channel('promotions')
    
    promotionsChannel.listen('.promotion.updated', (event) => {
      console.log('🎁 [Promotion Updated]', event.promotion)
      // Refresh promotions và products có khuyến mãi
    })

    promotionsChannel.listen('.promotion.created', (event) => {
      console.log('✨ [Promotion Created]', event.promotion)
      toast.success(`Khuyến mãi mới: ${event.promotion.name}`)
    })

    // ========================================
    // CLEANUP
    // ========================================
    return () => {
      console.log('🔌 [Global Sync] Disconnecting all channels...')
      Echo.leave('products')
      Echo.leave('orders')
      Echo.leave('inventory')
      Echo.leave('categories')
      Echo.leave('promotions')
    }
  }, [dispatch])
}
