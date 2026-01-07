import { useState, useEffect, useCallback } from 'react'
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
} from '@mui/material'
import {
  CheckCircle,
  ArrowBack,
  QrCode2,
  HelpOutline,
  Refresh,
  Warning,
} from '@mui/icons-material'
import { ordersApi, paymentsApi } from '../../services/api'
import { formatCurrency } from '../../services/utils'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'

const MoMoPayment = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  
  const [paymentData, setPaymentData] = useState(null)
  const [orderData, setOrderData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [timeLeft, setTimeLeft] = useState(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Tạo thanh toán MoMo tự động
  const createMoMoPayment = useCallback(async () => {
    try {
      const response = await paymentsApi.createMoMoPayment(orderId)
      const data = response.data
      
      console.log('MoMo Payment Response:', data)
      
      if (data.success) {
        setPaymentData(data)
        
        // Tính thời gian còn lại dựa trên expires_at từ server
        if (data.expires_at) {
          // Parse thời gian từ server (có thể là UTC hoặc local time)
          const expiresAt = new Date(data.expires_at)
          const now = new Date()
          
          // Tính số giây còn lại
          const diffSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
          
          console.log('Expires at:', expiresAt.toISOString())
          console.log('Now:', now.toISOString())
          console.log('Diff seconds:', diffSeconds)
          
          if (diffSeconds > 0) {
            setTimeLeft(diffSeconds)
          } else {
            // Nếu đã hết hạn, set trạng thái expired
            setTimeLeft(0)
            setPaymentStatus('expired')
          }
        } else {
          // Nếu không có expires_at từ server, mặc định 15 phút
          setTimeLeft(15 * 60)
        }
        
        return data
      } else {
        toast.error(data.message || 'Không thể tạo thanh toán MoMo')
        return null
      }
    } catch (error) {
      console.error('Error creating MoMo payment:', error)
      toast.error('Không thể tạo thanh toán MoMo')
      return null
    }
  }, [orderId])

  // Lấy thông tin đơn hàng
  const fetchOrderInfo = useCallback(async () => {
    try {
      const response = await ordersApi.getOrderById(orderId)
      setOrderData(response.data)
    } catch (error) {
      console.error('Error fetching order:', error)
    }
  }, [orderId])

  // Kiểm tra trạng thái thanh toán
  const checkPaymentStatus = useCallback(async () => {
    try {
      const response = await paymentsApi.checkMoMoStatus(orderId)
      const status = response.data.status
      
      setPaymentStatus(status)
      
      if (status === 'paid') {
        toast.success('🎉 Thanh toán thành công!')
        setConfirmed(true)
        return true
      }
      
      if (status === 'expired') {
        toast.warning('Giao dịch đã hết hạn')
        setTimeLeft(0)
        return false
      }
      
      return false
    } catch (error) {
      console.error('Error checking payment status:', error)
      return false
    }
  }, [orderId])

  // Load dữ liệu ban đầu
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await Promise.all([createMoMoPayment(), fetchOrderInfo()])
      setIsLoading(false)
    }
    init()
  }, [createMoMoPayment, fetchOrderInfo])

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

  // ✅ THÊM POLLING CHO PAYMENT STATUS - Check mỗi 3 giây và auto-redirect
  usePolling(async () => {
    if (confirmed || paymentStatus === 'paid' || paymentStatus === 'expired') {
      return
    }
    
    try {
      const response = await paymentsApi.checkMoMoStatus(orderId)
      const status = response.data.status
      
      setPaymentStatus(status)
      
      if (status === 'paid') {
        toast.success('🎉 Thanh toán thành công!')
        setConfirmed(true)
        setTimeout(() => {
          navigate(`/payment/result?orderId=${orderId}&status=success`)
        }, 1000)
      }
      
      if (status === 'expired') {
        toast.warning('Giao dịch đã hết hạn')
        setTimeLeft(0)
      }
    } catch (error) {
      console.error('Failed to check payment status:', error)
    }
  }, 3000)  // 3 giây - CRITICAL

  // ❌ Removed old interval - Đã thay bằng usePolling

  // Countdown timer - Khi hết thời gian sẽ tự động hủy đơn hàng
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setPaymentStatus('expired')
          // Tự động hủy đơn hàng khi hết thời gian
          handleAutoCancel()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Tự động hủy đơn hàng khi hết thời gian thanh toán
  const handleAutoCancel = async () => {
    try {
      await ordersApi.cancelOrder(orderId, {
        reason: 'Đơn hàng đã bị hủy do không thanh toán trong thời gian quy định'
      })
      toast.error('Đơn hàng đã bị hủy do hết thời gian thanh toán')
    } catch (error) {
      console.error('Error auto cancelling order:', error)
      // Nếu đơn đã bị hủy trước đó hoặc lỗi khác, không cần thông báo
    }
  }

  // Format thời gian còn lại thành giờ:phút:giây
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return { hrs, mins, secs }
  }

  // Hủy giao dịch - hiển thị dialog xác nhận
  const handleCancel = () => {
    setShowCancelDialog(true)
  }

  // Xác nhận hủy và quay về
  const handleConfirmCancel = () => {
    setShowCancelDialog(false)
    toast.warning('Đơn hàng sẽ bị hủy nếu không thanh toán trong thời gian quy định')
    navigate(`/orders/${orderId}`)
  }

  // Đóng dialog và tiếp tục thanh toán
  const handleContinuePayment = () => {
    setShowCancelDialog(false)
  }

  // Tạo thanh toán mới
  const handleRefreshPayment = async () => {
    setPaymentStatus('pending')
    setTimeLeft(null)
    setIsLoading(true)
    await createMoMoPayment()
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f5f5f5'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#d82d8b' }} size={60} />
          <Typography sx={{ mt: 2, color: '#666' }}>Đang tạo thanh toán MoMo...</Typography>
        </Box>
      </Box>
    )
  }

  if (!paymentData) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Alert severity="error">Không tìm thấy thông tin thanh toán</Alert>
        <Button variant="contained" onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
          Quay lại danh sách đơn hàng
        </Button>
      </Container>
    )
  }

  // Màn hình thanh toán thành công
  if (confirmed || paymentStatus === 'paid') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 5 }}>
        <Container maxWidth="sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
              <CheckCircle sx={{ fontSize: 100, color: '#4caf50', mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Thanh toán thành công!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Cảm ơn bạn đã thanh toán qua MoMo.
                <br />
                Đơn hàng của bạn đang được xử lý.
              </Typography>
              <Box sx={{ bgcolor: '#e8f5e9', p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Mã đơn hàng</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {paymentData.order_code || paymentData.momo_order_id}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/orders')}
                sx={{ 
                  bgcolor: '#4caf50',
                  '&:hover': { bgcolor: '#388e3c' },
                  px: 5, py: 1.5
                }}
              >
                Xem đơn hàng
              </Button>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    )
  }

  // Màn hình hết hạn
  if (paymentStatus === 'expired' || timeLeft === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 5 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
            <Box sx={{ 
              width: 100, 
              height: 100, 
              bgcolor: '#fff3e0', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}>
              <Typography sx={{ fontSize: 50 }}>⏱️</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Giao dịch đã hết hạn
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Vui lòng tạo thanh toán mới để tiếp tục.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleRefreshPayment}
                sx={{ 
                  bgcolor: '#d82d8b',
                  '&:hover': { bgcolor: '#c11f7a' },
                  px: 4, py: 1.5
                }}
              >
                Tạo thanh toán mới
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/', { replace: true })}
                sx={{ px: 4, py: 1.5 }}
              >
                Quay lại
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    )
  }

  const time = formatTime(timeLeft || 0)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Cột trái - Thông tin đơn hàng */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box 
                    sx={{ 
                      width: 28, 
                      height: 28, 
                      bgcolor: '#d82d8b',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: 10 }}>M</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">Nhà cung cấp</Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#d82d8b' }}>
                  MoMo Payment
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Mã đơn hàng
                </Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>
                  {paymentData.momo_order_id || paymentData.order_code}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Mô tả
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  Khách hàng: {orderData?.customer_name || 'Đang tải...'}
                </Typography>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Số tiền
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ color: '#d82d8b' }}>
                  {formatCurrency(paymentData.amount)}
                </Typography>
              </Box>

              {/* Đếm ngược thời gian */}
              <Paper sx={{ 
                p: 2, 
                bgcolor: '#fff0f6', 
                borderRadius: 2,
                textAlign: 'center',
                mb: 3
              }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Đơn hàng sẽ hết hạn sau:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                  <Box sx={{ 
                    bgcolor: '#fce4ec', 
                    px: 2, 
                    py: 1, 
                    borderRadius: 1,
                    minWidth: 55,
                    textAlign: 'center'
                  }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#d82d8b' }}>
                      {String(time.hrs).padStart(2, '0')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Giờ</Typography>
                  </Box>
                  <Box sx={{ 
                    bgcolor: '#fce4ec', 
                    px: 2, 
                    py: 1, 
                    borderRadius: 1,
                    minWidth: 55,
                    textAlign: 'center'
                  }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#d82d8b' }}>
                      {String(time.mins).padStart(2, '0')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Phút</Typography>
                  </Box>
                  <Box sx={{ 
                    bgcolor: '#fce4ec', 
                    px: 2, 
                    py: 1, 
                    borderRadius: 1,
                    minWidth: 55,
                    textAlign: 'center'
                  }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#d82d8b' }}>
                      {String(time.secs).padStart(2, '0')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Giây</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Nút quay về */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleCancel}
                sx={{ 
                  py: 1.5,
                  borderColor: '#d82d8b',
                  color: '#d82d8b',
                  '&:hover': {
                    borderColor: '#c11f7a',
                    bgcolor: '#fff0f6'
                  }
                }}
              >
                Quay về
              </Button>
            </Paper>
          </Grid>

          {/* Cột phải - QR Code */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ 
              p: 4, 
              borderRadius: 2, 
              bgcolor: '#d82d8b',
              color: 'white',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 500
            }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Quét mã QR để thanh toán
              </Typography>

              {/* QR Code Container */}
              <Box sx={{ 
                bgcolor: 'white', 
                p: 2, 
                borderRadius: 2,
                position: 'relative',
                my: 3
              }}>
                {/* Corner decorations */}
                <Box sx={{ position: 'absolute', top: -2, left: -2, width: 25, height: 25, borderTop: '4px solid #fff', borderLeft: '4px solid #fff', borderRadius: '4px 0 0 0' }} />
                <Box sx={{ position: 'absolute', top: -2, right: -2, width: 25, height: 25, borderTop: '4px solid #fff', borderRight: '4px solid #fff', borderRadius: '0 4px 0 0' }} />
                <Box sx={{ position: 'absolute', bottom: -2, left: -2, width: 25, height: 25, borderBottom: '4px solid #fff', borderLeft: '4px solid #fff', borderRadius: '0 0 0 4px' }} />
                <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 25, height: 25, borderBottom: '4px solid #fff', borderRight: '4px solid #fff', borderRadius: '0 0 4px 0' }} />
                
                <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={paymentData.qr_code_url || paymentData.qr_code}
                    alt="MoMo QR Code"
                    style={{ width: 280, height: 280, display: 'block' }}
                    onError={(e) => {
                      console.error('QR Code load error')
                      e.target.src = 'https://via.placeholder.com/280?text=QR+Error'
                    }}
                  />
                  
                  {/* Scan line effect */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, transparent, #d82d8b, transparent)',
                      boxShadow: '0 0 15px 3px rgba(216, 45, 139, 0.6)',
                      animation: 'scanLine 2s ease-in-out infinite',
                      '@keyframes scanLine': {
                        '0%': { top: '0' },
                        '50%': { top: 'calc(100% - 3px)' },
                        '100%': { top: '0' },
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 2 }}>
                <QrCode2 />
                <Typography variant="body1">
                  Sử dụng <strong>App MoMo</strong> hoặc ứng dụng camera hỗ trợ QR code để quét mã
                </Typography>
              </Box>

              <Button
                variant="text"
                startIcon={<HelpOutline />}
                sx={{ 
                  color: 'white',
                  textDecoration: 'underline',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
                onClick={() => {
                  if (paymentData.pay_url) {
                    window.open(paymentData.pay_url, '_blank')
                  }
                }}
              >
                Gặp khó khăn khi thanh toán? Xem Hướng dẫn
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Dialog xác nhận khi bấm Quay về */}
      <Dialog
        open={showCancelDialog}
        onClose={handleContinuePayment}
        PaperProps={{
          sx: { borderRadius: 3, maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#f57c00',
          pb: 1
        }}>
          <Warning sx={{ color: '#f57c00' }} />
          Xác nhận rời khỏi trang thanh toán
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            <Box component="span" sx={{ fontWeight: 'bold', color: '#d32f2f', display: 'block', mb: 1 }}>
              ⚠️ Lưu ý quan trọng:
            </Box>
            Nếu bạn rời khỏi trang này mà chưa hoàn tất thanh toán, đơn hàng của bạn sẽ{' '}
            <Box component="span" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
              tự động bị hủy
            </Box>{' '}
            sau khi hết thời gian thanh toán.
            <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 2, fontSize: '0.9rem' }}>
              <strong>Thời gian còn lại:</strong> {formatTime(timeLeft || 0).hrs > 0 && `${formatTime(timeLeft || 0).hrs} giờ `}
              {formatTime(timeLeft || 0).mins} phút {formatTime(timeLeft || 0).secs} giây
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button 
            onClick={handleContinuePayment}
            variant="contained"
            sx={{ 
              bgcolor: '#d82d8b',
              '&:hover': { bgcolor: '#c11f7a' },
              px: 3
            }}
          >
            Tiếp tục thanh toán
          </Button>
          <Button 
            onClick={handleConfirmCancel}
            variant="outlined"
            color="inherit"
            sx={{ px: 3 }}
          >
            Vẫn muốn rời đi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MoMoPayment
