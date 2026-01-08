import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Echo from '../../utils/echo'

/**
 * Debug component to test WebSocket connection and product updates
 * Add this to any page to see realtime updates
 */
const WebSocketDebug = () => {
  const [logs, setLogs] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const products = useSelector((state) => state.products.products)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
  }

  useEffect(() => {
    addLog('🔄 Initializing WebSocket debug...', 'info')

    // Check connection status
    Echo.connector.pusher.connection.bind('connected', () => {
      setIsConnected(true)
      addLog('✅ WebSocket connected!', 'success')
    })

    Echo.connector.pusher.connection.bind('disconnected', () => {
      setIsConnected(false)
      addLog('❌ WebSocket disconnected', 'error')
    })

    Echo.connector.pusher.connection.bind('error', (err) => {
      addLog(`❌ Connection error: ${JSON.stringify(err)}`, 'error')
    })

    // Listen to product updates
    const channel = Echo.channel('products')
    
    channel.listen('.product.updated', (event) => {
      addLog(`📦 Product Updated: ID ${event.product.id}, Qty: ${event.product.quantity}`, 'event')
    })

    return () => {
      Echo.leave('products')
    }
  }, [])

  // Monitor Redux store changes
  useEffect(() => {
    addLog(`🔄 Redux products count: ${products.length}`, 'info')
  }, [products.length])

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 400,
      maxHeight: 500,
      backgroundColor: 'white',
      border: '2px solid #e63946',
      borderRadius: 8,
      padding: 15,
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottom: '1px solid #eee'
      }}>
        <h4 style={{ margin: 0, color: '#e63946' }}>🔌 WebSocket Debug</h4>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: isConnected ? '#4caf50' : '#f44336'
        }} />
      </div>

      <div style={{
        fontSize: 11,
        fontFamily: 'monospace',
        overflowY: 'auto',
        maxHeight: 400,
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 4
      }}>
        {logs.map((log, index) => (
          <div key={index} style={{
            marginBottom: 5,
            padding: 4,
            borderLeft: `3px solid ${
              log.type === 'success' ? '#4caf50' :
              log.type === 'error' ? '#f44336' :
              log.type === 'event' ? '#2196f3' :
              '#666'
            }`,
            paddingLeft: 8,
            backgroundColor: 'white'
          }}>
            <strong>[{log.timestamp}]</strong> {log.message}
          </div>
        ))}
      </div>

      <button
        onClick={() => setLogs([])}
        style={{
          marginTop: 10,
          padding: '6px 12px',
          backgroundColor: '#e63946',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 12
        }}
      >
        Clear Logs
      </button>
    </div>
  )
}

export default WebSocketDebug