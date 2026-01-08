import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Container, Box, Typography, Paper, Chip } from '@mui/material'
import WebSocketDebug from '../../components/debug/WebSocketDebug'

const WebSocketTest = () => {
  const products = useSelector((state) => state.products.products)
  const [laptop, setLaptop] = useState(null)

  useEffect(() => {
    // Find MacBook Air M2
    const macbook = products.find(p => p.name.includes('MacBook Air M2'))
    if (macbook) {
      setLaptop(macbook)
    }
  }, [products])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🧪 WebSocket Test Page
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📋 Instructions
        </Typography>
        <ol>
          <li>Open this page in 2 different tabs</li>
          <li>Open Console (F12) in both tabs</li>
          <li>Run: <code>php force_laptop_update.php</code> in Backend folder</li>
          <li>Check if both tabs receive the WebSocket event</li>
          <li>Check if the product quantity updates in both tabs</li>
        </ol>
      </Paper>

      {laptop && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            💻 MacBook Air M2 Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Chip label={`ID: ${laptop.id}`} color="primary" />
            <Chip 
              label={`Quantity: ${laptop.quantity}`} 
              color={laptop.quantity > 0 ? 'success' : 'error'}
            />
            <Chip label={`Updated: ${new Date(laptop.updated_at).toLocaleTimeString()}`} />
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Last updated in Redux store: {new Date().toLocaleTimeString()}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Redux Store Info
        </Typography>
        <Typography variant="body2">
          Total products in store: {products.length}
        </Typography>
        <Typography variant="body2">
          MacBook Air M2 found: {laptop ? 'Yes' : 'No'}
        </Typography>
      </Paper>

      <WebSocketDebug />
    </Container>
  )
}

export default WebSocketTest