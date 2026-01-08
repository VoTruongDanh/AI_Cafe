import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import Echo from '../utils/echo'

const RealtimeContext = createContext()

/**
 * Global Realtime Context Provider
 * Manages WebSocket connections and broadcasts updates to all components
 */
export const RealtimeProvider = ({ children }) => {
  const [products, setProducts] = useState({})
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  useEffect(() => {
    console.log('🌐 [Realtime Context] Initializing global WebSocket...')
    console.log('🌐 [Realtime Context] This should only run ONCE on mount')

    const channel = Echo.channel('products')

    // Listen to product updates
    channel.listen('.product.updated', (event) => {
      const product = event.product
      console.log('📦 [Realtime Context] Product updated:', {
        id: product.id,
        name: product.name,
        quantity: product.quantity
      })

      // Update products map
      setProducts(prev => ({
        ...prev,
        [product.id]: product
      }))

      // Trigger re-render for all subscribers
      setLastUpdate(Date.now())
    })

    channel.listen('.product.created', (event) => {
      console.log('✨ [Realtime Context] Product created:', event.product.id)
      const product = event.product
      setProducts(prev => ({
        ...prev,
        [product.id]: product
      }))
      setLastUpdate(Date.now())
    })

    channel.listen('.product.deleted', (event) => {
      console.log('🗑️ [Realtime Context] Product deleted:', event.productId)
      setProducts(prev => {
        const newProducts = { ...prev }
        delete newProducts[event.productId]
        return newProducts
      })
      setLastUpdate(Date.now())
    })

    // Connection status
    Echo.connector.pusher.connection.bind('connected', () => {
      console.log('✅ [Realtime Context] WebSocket connected')
    })

    Echo.connector.pusher.connection.bind('disconnected', () => {
      console.log('❌ [Realtime Context] WebSocket disconnected')
    })

    return () => {
      console.log('🔌 [Realtime Context] Cleaning up WebSocket...')
      Echo.leave('products')
    }
  }, [])

  // Get product with realtime updates
  const getProduct = useCallback((productId) => {
    return products[productId] || null
  }, [products])

  // Update product manually (for optimistic updates)
  const updateProduct = useCallback((productId, updates) => {
    setProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        ...updates
      }
    }))
    setLastUpdate(Date.now())
  }, [])

  const value = {
    products,
    getProduct,
    updateProduct,
    lastUpdate
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

/**
 * Hook to use realtime product data
 * @param {number} productId - Product ID to watch
 * @param {object} fallbackProduct - Fallback product data
 * @returns {object} Product with realtime updates
 */
export const useRealtimeProduct = (productId, fallbackProduct) => {
  const context = useContext(RealtimeContext)
  
  if (!context) {
    console.warn('⚠️ useRealtimeProduct must be used within RealtimeProvider')
    return fallbackProduct
  }

  const { getProduct, lastUpdate } = context
  const realtimeProduct = getProduct(productId)

  // Return realtime product if available, otherwise fallback
  return realtimeProduct || fallbackProduct
}

/**
 * Hook to get realtime context
 */
export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  
  return context
}

export default RealtimeContext
