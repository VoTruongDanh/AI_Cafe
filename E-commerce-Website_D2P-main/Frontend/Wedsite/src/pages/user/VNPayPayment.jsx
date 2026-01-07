import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePolling } from '../../hooks/usePolling'
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material'
import {
  CheckCircle,
  ArrowBack,
  Payment,
  HelpOutline,
  Refresh,
  Warning,
  CreditCard,
  AccountBalance,
} from '@mui/icons-material'
import { ordersApi, paymentsApi } from '../../services/api'
import { formatCurrency } from '../../services/utils'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'

const VNPayPayment = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  
  const [orderData, setOrderData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [error, setError] = useState(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const hasCreatedPayment = useRef(false)

  // Lấy thông tin đơn hàng
  const fetchOrderInfo = useCallback(async () => {
    try {
      const response = await ordersApi.getOrderById(orderId)
      setOrderData(response.data)
      
      // Nếu đơn hàng đã thanh toán, cập nhật trạng thái
      if (response.data.payment_status === 'paid') {
        setPaymentStatus('paid')
      }
      
      return response.data
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Không thể tải thông tin đơn hàng')
      return null
    }
  }, [orderId])

  // Tạo thanh toán VNPay và redirect
  const createVNPayPayment = useCallback(async () => {
    if (hasCreatedPayment.current) return
    hasCreatedPayment.current = true

    try {
      setIsLoading(true)
      const response = await paymentsApi.createVNPayPayment(orderId)
      const data = response.data
      
      console.log('VNPay Payment Response:', data)
      
      if (data.payment_url) {
        // Redirect đến VNPay
        window.location.href = data.payment_url
      } else {
        throw new Error(data.message || 'Không thể tạo URL thanh toán')
      }
    } catch (error) {
      console.error('Error creating VNPay payment:', error)
      const errorMsg = error.response?.data?.message || 'Không thể tạo thanh toán VNPay'
      setError(errorMsg)
      toast.error(errorMsg)
      hasCreatedPayment.current = false
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  // Load dữ liệu ban đầu
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      const order = await fetchOrderInfo()
      
      // Nếu đơn hàng chưa thanh toán và phương thức là VNPay, tạo payment
      if (order && order.payment_status !== 'paid') {
        const paymentMethod = order.payment_method
        if (paymentMethod?.code === 'VNPAY' || paymentMethod?.name?.includes('VNPay')) {
          await createVNPayPayment()
        } else {
          setError('Phương thức thanh toán không phải VNPay')
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }
    init()
  }, [fetchOrderInfo, createVNPayPayment])

  // ✅ XỬ LÝ NÚT BACK CỦA BROWSER - Redirect về home thay vì 404
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault()
      navigate('/', { replace: true })
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [navigate])

  // ✅ THÊM POLLING CHO ORDER STATUS - Check thanh toán mỗi 3 giây
  usePolling(async () => {
    if (paymentStatus === 'paid' || isLoading) {
      return
    }
    
    try {
      const response = await ordersApi.getOrderById(orderId)
      
      // ✅ Tự động cập nhật khi Admin xác nhận thanh toán
      if (response.data.payment_status === 'paid') {
        setPaymentStatus('paid')
        setOrderData(response.data)
        toast.success('Thanh toán thành công!')
        setTimeout(() => {
          navigate(`/payment/result?orderId=${orderId}&status=success`)
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to check order status:', error)
    }
  }, 3000)  // 3 giây - CRITICAL

  // Retry tạo thanh toán
  const handleRetry = () => {
    hasCreatedPayment.current = false
    setError(null)
    createVNPayPayment()
  }

  // Hủy giao dịch
  const handleCancel = () => {
    setShowCancelDialog(true)
  }

  const handleConfirmCancel = async () => {
    setShowCancelDialog(false)
    try {
      await ordersApi.cancelOrder(orderId, {
        reason: 'Khách hàng hủy thanh toán VNPay'
      })
      toast.info('Đơn hàng đã được hủy')
      navigate('/orders')
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Không thể hủy đơn hàng')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <CircularProgress size={60} sx={{ color: '#0066b3', mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Đang chuyển đến VNPay...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vui lòng chờ trong giây lát, bạn sẽ được chuyển đến trang thanh toán VNPay
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    )
  }

  // Payment already completed
  if (paymentStatus === 'paid') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Đã thanh toán!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Đơn hàng của bạn đã được thanh toán thành công qua VNPay
            </Typography>
            {orderData && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                <Typography variant="body2">
                  Mã đơn hàng: <strong>{orderData.code || orderData.id}</strong>
                </Typography>
                <Typography variant="body2">
                  Tổng tiền: <strong>{formatCurrency(orderData.total)}</strong>
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              onClick={() => navigate('/orders')}
              sx={{ 
                mt: 2, 
                bgcolor: '#0066b3',
                '&:hover': { bgcolor: '#005299' }
              }}
            >
              Xem đơn hàng
            </Button>
          </Paper>
        </motion.div>
      </Container>
    )
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Warning sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Có lỗi xảy ra
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {error}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/', { replace: true })}
              >
                Về trang chủ
              </Button>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleRetry}
                sx={{ 
                  bgcolor: '#0066b3',
                  '&:hover': { bgcolor: '#005299' }
                }}
              >
                Thử lại
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    )
  }

  // Main payment page (shows while redirecting)
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: '#0066b3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Payment sx={{ fontSize: 50, color: 'white' }} />
            </Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Thanh toán VNPay
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Thanh toán an toàn qua cổng VNPay
            </Typography>
          </Box>

          {/* Order Info */}
          {orderData && (
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Mã đơn hàng
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {orderData.code || `#${orderData.id}`}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Số tiền thanh toán
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatCurrency(orderData.total)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Payment Methods Info */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Hỗ trợ thanh toán qua:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip icon={<AccountBalance />} label="ATM nội địa" variant="outlined" />
              <Chip icon={<CreditCard />} label="Visa/MasterCard" variant="outlined" />
              <Chip icon={<CreditCard />} label="JCB" variant="outlined" />
              <Chip label="QR Pay" variant="outlined" />
            </Box>
          </Box>

          {/* Help Section */}
          <Alert severity="info" icon={<HelpOutline />} sx={{ mb: 3 }}>
            <Typography variant="body2">
              Sau khi nhấn &quot;Thanh toán ngay&quot;, bạn sẽ được chuyển đến trang thanh toán VNPay 
              để hoàn tất giao dịch. Đơn hàng sẽ được xác nhận tự động sau khi thanh toán thành công.
            </Typography>
          </Alert>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              startIcon={<ArrowBack />}
            >
              Hủy thanh toán
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleRetry}
              startIcon={<Payment />}
              sx={{ 
                bgcolor: '#0066b3',
                '&:hover': { bgcolor: '#005299' },
                px: 4,
              }}
            >
              Thanh toán ngay
            </Button>
          </Box>
        </Paper>
      </motion.div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Xác nhận hủy thanh toán</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn hủy thanh toán? Đơn hàng sẽ bị hủy nếu bạn không hoàn tất thanh toán.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>
            Tiếp tục thanh toán
          </Button>
          <Button onClick={handleConfirmCancel} color="error" autoFocus>
            Hủy đơn hàng
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default VNPayPayment
