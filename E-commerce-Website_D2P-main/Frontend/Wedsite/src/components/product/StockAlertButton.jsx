import { useState, useEffect } from 'react'
import { Button, Snackbar, Alert, CircularProgress } from '@mui/material'
import { NotificationsActive, NotificationsOff } from '@mui/icons-material'
import { useSelector } from 'react-redux'
import axios from 'axios'

const StockAlertButton = ({ productId, inStock }) => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', severity: 'success' })
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !inStock) {
      checkSubscription()
    }
  }, [productId, isAuthenticated, inStock])

  const checkSubscription = async () => {
    try {
      const response = await axios.get(`/api/stock-alerts/check/${productId}`)
      setSubscribed(response.data.subscribed)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setMessage({ text: 'Vui lòng đăng nhập để sử dụng tính năng này', severity: 'warning' })
      setShowMessage(true)
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/stock-alerts/subscribe', { product_id: productId })
      setSubscribed(true)
      setMessage({ text: '✅ Đã đăng ký nhận thông báo khi có hàng!', severity: 'success' })
      setShowMessage(true)
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || '❌ Có lỗi xảy ra', 
        severity: 'error' 
      })
      setShowMessage(true)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setLoading(true)
    try {
      await axios.delete(`/api/stock-alerts/unsubscribe/${productId}`)
      setSubscribed(false)
      setMessage({ text: 'Đã hủy đăng ký thông báo', severity: 'info' })
      setShowMessage(true)
    } catch (error) {
      setMessage({ text: '❌ Có lỗi xảy ra', severity: 'error' })
      setShowMessage(true)
    } finally {
      setLoading(false)
    }
  }

  if (inStock) return null

  return (
    <>
      <Button
        variant={subscribed ? 'contained' : 'outlined'}
        color={subscribed ? 'success' : 'primary'}
        startIcon={
          loading ? (
            <CircularProgress size={20} />
          ) : subscribed ? (
            <NotificationsActive />
          ) : (
            <NotificationsOff />
          )
        }
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
        disabled={loading}
        fullWidth
        sx={{
          py: 1.5,
          fontWeight: 600,
        }}
      >
        {subscribed ? 'Đã đăng ký thông báo' : 'Báo tôi khi có hàng'}
      </Button>

      <Snackbar
        open={showMessage}
        autoHideDuration={4000}
        onClose={() => setShowMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowMessage(false)} 
          severity={message.severity}
          sx={{ width: '100%' }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </>
  )
}

export default StockAlertButton
