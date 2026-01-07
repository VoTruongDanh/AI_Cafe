import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Error as ErrorIcon,
  ShoppingBag,
  Home,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { ordersApi } from '../../services/api'

/**
 * Trang kết quả thanh toán
 * 
 * Hiển thị sau khi thanh toán MoMo/Bank Transfer hoàn tất
 * URL: /payment/result?status=success|failed|error&order_id=X&message=Y
 */
const PaymentResult = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const status = searchParams.get('status') || 'error'
  const orderId = searchParams.get('order_id')
  const orderCode = searchParams.get('order_code')
  const message = searchParams.get('message')
  
  const [orderDetails, setOrderDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(!!orderId)

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        setIsLoading(true)
        const response = await ordersApi.getOrderById(orderId)
        setOrderDetails(response.data)
      } catch (error) {
        console.error('Error loading order details:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (orderId) {
      loadOrderDetails()
    }
  }, [orderId])

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle sx={{ fontSize: 100, color: 'success.main' }} />,
          title: 'Thanh toán thành công!',
          subtitle: 'Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.',
          color: 'success',
          bgcolor: '#e8f5e9',
        }
      case 'failed':
        return {
          icon: <Cancel sx={{ fontSize: 100, color: 'error.main' }} />,
          title: 'Thanh toán thất bại',
          subtitle: message || 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.',
          color: 'error',
          bgcolor: '#ffebee',
        }
      case 'pending':
        return {
          icon: <CircularProgress size={100} sx={{ color: 'warning.main' }} />,
          title: 'Đang xử lý thanh toán',
          subtitle: 'Vui lòng chờ trong giây lát...',
          color: 'warning',
          bgcolor: '#fff8e1',
        }
      default:
        return {
          icon: <ErrorIcon sx={{ fontSize: 100, color: 'grey.500' }} />,
          title: 'Không xác định',
          subtitle: message || 'Không thể xác định trạng thái thanh toán.',
          color: 'default',
          bgcolor: '#f5f5f5',
        }
    }
  }

  const config = getStatusConfig()

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải thông tin đơn hàng...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            bgcolor: config.bgcolor,
            borderRadius: 3,
          }}
        >
          {/* Icon */}
          <Box sx={{ mb: 3 }}>
            {config.icon}
          </Box>

          {/* Title */}
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {config.title}
          </Typography>

          {/* Subtitle */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {config.subtitle}
          </Typography>

          {/* Order Info */}
          {(orderCode || orderDetails) && (
            <Box sx={{ mb: 4 }}>
              <Chip
                icon={<ShoppingBag />}
                label={`Mã đơn hàng: ${orderCode || orderDetails?.code}`}
                color={config.color}
                sx={{ 
                  fontSize: '1rem', 
                  py: 2.5, 
                  px: 2,
                  fontWeight: 'bold',
                }}
              />
              
              {orderDetails && status === 'success' && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tổng thanh toán
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(orderDetails.grand_total)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {orderId && (
              <Button
                variant="contained"
                color={config.color}
                startIcon={<ShoppingBag />}
                onClick={() => navigate(`/orders/${orderId}`)}
                sx={{ minWidth: 150 }}
              >
                Xem đơn hàng
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{ minWidth: 150 }}
            >
              Về trang chủ
            </Button>

            {status === 'failed' && orderId && (
              <Button
                variant="contained"
                color="warning"
                onClick={() => navigate(`/orders/${orderId}/momo`)}
              >
                Thử thanh toán lại
              </Button>
            )}
          </Box>

          {/* Additional message for success */}
          {status === 'success' && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ display: 'block', mt: 4 }}
            >
              Email xác nhận đơn hàng đã được gửi đến địa chỉ email của bạn.
            </Typography>
          )}
        </Paper>
      </motion.div>
    </Container>
  )
}

export default PaymentResult
