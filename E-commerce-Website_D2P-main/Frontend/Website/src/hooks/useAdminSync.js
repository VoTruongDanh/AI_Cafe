import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProductInStore } from '../store/slices/productsSlice'
import { updateOrderInStore, addOrderToStore } from '../store/slices/ordersSlice'
import Echo from '../utils/echo'
import { toast } from 'react-toastify'

/**
 * 👨‍💼 ADMIN REALTIME SYNC
 * 
 * Đồng bộ realtime cho trang Admin
 * Tự động cập nhật khi có thay đổi từ:
 * - Nhân viên khác
 * - Khách hàng đặt hàng
 * - Hệ thống tự động
 * 
 * Hook này được gọi trong AdminLayout
 */
export const useAdminSync = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    // Chỉ chạy nếu là admin/staff
    if (!user || !['admin', 'staff'].includes(user.role)) {
      return
    }

    console.log('👨‍💼 [Admin Sync] Initializing admin realtime sync...')

    // ========================================
    // 📦 PRODUCTS - Admin View
    // ========================================
    const productsChannel = Echo.channel('products')
    
    productsChannel.listen('.product.updated', (event) => {
      console.log('📦 [Admin] Product Updated', event.product)
      dispatch(updateProductInStore(event.product))
      
      // Hiển thị thông báo nếu không phải do chính admin này cập nhật
      if (event.updatedBy && event.updatedBy !== user.id) {
        toast.info(`Sản phẩm "${event.product.name}" đã được cập nhật`, {
          autoClose: 2000,
        })
      }
    })

    productsChannel.listen('.product.created', (event) => {
      console.log('✨ [Admin] Product Created', event.product)
      toast.success(`Sản phẩm mới: ${event.product.name}`, {
        autoClose: 2000,
      })
    })

    productsChannel.listen('.product.deleted', (event) => {
      console.log('🗑️ [Admin] Product Deleted', event.productId)
      toast.warning('Một sản phẩm đã bị xóa', {
        autoClose: 2000,
      })
    })

    // ========================================
    // 🛒 ORDERS - Admin View
    // ========================================
    const ordersChannel = Echo.channel('orders')
    
    ordersChannel.listen('.order.created', (event) => {
      console.log('🆕 [Admin] New Order', event.order)
      dispatch(addOrderToStore(event.order))
      
      // Thông báo đơn hàng mới với âm thanh
      toast.success(`🔔 Đơn hàng mới: ${event.order.code}`, {
        autoClose: 5000,
        position: 'top-right',
      })
      
      // Phát âm thanh thông báo (optional)
      try {
        const audio = new Audio('/notification.mp3')
        audio.play().catch(() => {
          // Ignore if audio fails
        })
      } catch (e) {
        // Ignore
      }
    })

    ordersChannel.listen('.order.status.updated', (event) => {
      console.log('📝 [Admin] Order Status Updated', event.order)
      dispatch(updateOrderInStore(event.order))
      
      // Thông báo nếu khách hàng hủy đơn
      if (event.order.status === 'pending_cancel') {
        toast.warning(`⚠️ Khách hàng yêu cầu hủy đơn: ${event.order.code}`, {
          autoClose: 5000,
        })
      }
    })

    // ========================================
    // 📦 INVENTORY - Admin Only
    // ========================================
    const inventoryChannel = Echo.channel('inventory')
    
    inventoryChannel.listen('.inventory.status.updated', (event) => {
      console.log('📦 [Admin] Inventory Updated', event.inventoryImport)
      toast.info(`Phiếu nhập kho ${event.inventoryImport.code} đã cập nhật`, {
        autoClose: 3000,
      })
    })

    // ========================================
    // 👥 USERS - Admin Only
    // ========================================
    const usersChannel = Echo.channel('users')
    
    usersChannel.listen('.user.created', (event) => {
      console.log('👤 [Admin] New User', event.user)
      toast.info(`Người dùng mới: ${event.user.name}`, {
        autoClose: 2000,
      })
    })

    usersChannel.listen('.user.updated', (event) => {
      console.log('👤 [Admin] User Updated', event.user)
    })

    // ========================================
    // CLEANUP
    // ========================================
    return () => {
      console.log('🔌 [Admin Sync] Disconnecting admin channels...')
      Echo.leave('products')
      Echo.leave('orders')
      Echo.leave('inventory')
      Echo.leave('users')
    }
  }, [dispatch, user])
}
