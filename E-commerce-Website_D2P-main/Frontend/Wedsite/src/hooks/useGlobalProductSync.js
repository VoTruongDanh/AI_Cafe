import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { updateProductInStore } from '../store/slices/productsSlice'
import Echo from '../utils/echo'

/**
 * Global WebSocket listener for product updates
 * Automatically updates product data across ALL pages when changes occur
 * 
 * This hook should be used once at the app level (in App.jsx or UserLayout)
 * to ensure all product displays are synchronized in real-time
 */
export const useGlobalProductSync = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    console.log('🔄 [Global Product Sync] Initializing WebSocket listener...')

    // Listen to product updates from backend
    const channel = Echo.channel('products')
    
    channel.listen('.product.updated', (event) => {
      console.log('📦 [Product Updated]', event.product)
      console.log('📦 [Product ID]', event.product.id, 'New Quantity:', event.product.quantity)
      
      // Update product in Redux store
      // This will automatically update ALL components displaying this product
      dispatch(updateProductInStore(event.product))
      
      // Force re-render by dispatching a timestamp
      console.log('🔄 [Redux] Product updated in store')
    })

    channel.listen('.product.created', (event) => {
      console.log('✨ [Product Created]', event.product)
      // For new products, we might want to invalidate cache or refetch
      // For now, just log it
    })

    channel.listen('.product.deleted', (event) => {
      console.log('🗑️ [Product Deleted]', event.productId)
      // Handle product deletion if needed
    })

    // Log connection status
    Echo.connector.pusher.connection.bind('connected', () => {
      console.log('✅ [WebSocket] Connected to Pusher')
    })

    Echo.connector.pusher.connection.bind('disconnected', () => {
      console.log('❌ [WebSocket] Disconnected from Pusher')
    })

    // Cleanup on unmount
    return () => {
      console.log('🔌 [Global Product Sync] Disconnecting WebSocket listener...')
      Echo.leave('products')
    }
  }, [dispatch])
}
