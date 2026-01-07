import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrdersPolling } from '../../hooks/useOrdersPolling'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material'
import {
  ShoppingBag,
  LocalShipping,
  CheckCircle,
  Cancel,
  Receipt,
  Visibility,
  Payment,
  AccountBalance,
  CreditCard,
  Timer,
} from '@mui/icons-material'
import { fetchOrders, cancelOrder } from '../../store/slices/ordersSlice'
import { formatCurrency, formatDateTime, getStatusText, getStatusColor, getImageUrl } from '../../services/utils'
import { pageVariants, staggerContainer, staggerItem } from '../../utils/animations'
import { toast } from 'react-toastify'

// Component hiển thị countdown thời gian thanh toán
const PaymentCountdown = ({ expiresAt, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!expiresAt) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        onExpired?.()
        return null
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      return { minutes, seconds }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (!remaining) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, onExpired])

  if (!timeLeft) return null

  const isUrgent = timeLeft.minutes < 5

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 0.5,
      color: isUrgent ? 'error.main' : 'warning.main',
      fontSize: '0.85rem',
      fontWeight: 600,
    }}>
      <Timer fontSize="small" />
      <span>
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </Box>
  )
}

const Orders = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { orders, isLoading } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  // ❌ Removed WebSocket - Không cần realtime updates nữa

  // ✅ THÊM POLLING CHO ORDERS - Auto-refresh trạng thái đơn hàng mỗi 5 giây
  const { refresh } = useOrdersPolling({ 
    enabled: true, 
    interval: 5000,
    filters: user?.id ? { user_id: user.id } : {}
  })

  // Các lý do hủy đơn phổ biến
  const cancelReasons = [
    'Tôi muốn thay đổi sản phẩm khác',
    'Tôi tìm được giá tốt hơn ở nơi khác',
    'Tôi không còn nhu cầu mua nữa',
    'Tôi đặt nhầm sản phẩm',
    'Thời gian giao hàng quá lâu',
    'Khác (nhập lý do)',
  ]

  useEffect(() => {
    dispatch(fetchOrders())
  }, [dispatch])

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedOrder(null)
  }

  const handleCancelClick = (order) => {
    setOrderToCancel(order)
    setCancelReason('')
    setCustomReason('')
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return
    
    // Lấy lý do hủy
    const reason = cancelReason === 'Khác (nhập lý do)' ? customReason : cancelReason
    if (!reason) {
      toast.warning('Vui lòng chọn hoặc nhập lý do hủy đơn')
      return
    }
    
    setCancelling(true)
    try {
      const result = await dispatch(cancelOrder({ orderId: orderToCancel.id, cancelReason: reason }))
      if (cancelOrder.fulfilled.match(result)) {
        const pendingCancel = result.payload?.pending_cancel
        const refundRequired = result.payload?.refund_required
        const refundStatus = result.payload?.refund_status
        const updatedOrder = result.payload?.order
        
        if (pendingCancel || updatedOrder?.status === 'pending_cancel') {
          // Đơn đang chờ Admin xác nhận hủy
          toast.info('Yêu cầu hủy đơn đã được ghi nhận. Vui lòng chờ Admin xác nhận sau khi kiểm tra giao dịch chuyển khoản.')
        } else if (refundRequired) {
          if (refundStatus === 'pending_verification') {
            toast.success('Đã hủy đơn hàng! Chúng tôi sẽ kiểm tra giao dịch và liên hệ nếu cần hoàn tiền.')
          } else {
            toast.success('Đã hủy đơn hàng! Yêu cầu hoàn tiền đã được ghi nhận.')
          }
        } else {
          toast.success('Đã hủy đơn hàng thành công!')
        }
        setCancelDialogOpen(false)
        setOrderToCancel(null)
        setCancelReason('')
        setCustomReason('')
      } else {
        toast.error(result.payload || 'Không thể hủy đơn hàng')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi hủy đơn hàng')
    } finally {
      setCancelling(false)
    }
  }

  const handleCancelDialogClose = () => {
    if (!cancelling) {
      setCancelDialogOpen(false)
      setOrderToCancel(null)
      setCancelReason('')
      setCustomReason('')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />
      case 'shipping':
        return <LocalShipping />
      case 'cancelled':
        return <Cancel />
      default:
        return <ShoppingBag />
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Đang tải đơn hàng...</Typography>
      </Container>
    )
  }

  const ordersArray = Array.isArray(orders) ? orders : []
  const filteredOrders = filterStatus === 'all' 
    ? ordersArray 
    : ordersArray.filter(order => order.status === filterStatus)

  if (ordersArray.length === 0) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        variants={pageVariants}
      >
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ShoppingBag sx={{ fontSize: 100, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Chưa có đơn hàng nào
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Hãy mua sắm và trải nghiệm dịch vụ của chúng tôi
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate('/products')}
              sx={{ borderRadius: 2 }}
            >
              Khám phá sản phẩm
            </Button>
          </motion.div>
        </Container>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt sx={{ fontSize: 40, color: 'primary.main' }} />
            Lịch sử đơn hàng
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý và theo dõi đơn hàng của bạn
          </Typography>
        </Box>

        {/* Filter Tabs */}
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Tabs 
            value={filterStatus} 
            onChange={(e, newValue) => setFilterStatus(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              '& .MuiTab-root': { 
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '15px',
                minHeight: 60,
              }
            }}
          >
            <Tab label="Tất cả" value="all" />
            <Tab label="Chờ xử lý" value="pending" />
            <Tab label="Đang giao" value="shipping" />
            <Tab label="Hoàn thành" value="completed" />
            <Tab label="Đã hủy" value="cancelled" />
          </Tabs>
        </Paper>

        {/* Orders List */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  Không có đơn hàng nào
                </Typography>
              </Box>
            ) : (
              filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  variants={staggerItem}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Order Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {getStatusIcon(order.status)}
                            <Typography variant="h6" fontWeight="bold">
                              Đơn hàng #{order.code || order.id}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            📅 {formatDateTime(order.created_at)}
                          </Typography>
                          {order.customer_name && (
                            <Typography variant="body2" color="text.secondary">
                              👤 {order.customer_name}
                            </Typography>
                          )}
                          {/* Hiển thị phương thức thanh toán */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              💳 {(() => {
                                const code = order.payment_method?.code || order.paymentMethod?.code || ''
                                const codeUpper = code.toUpperCase()
                                if (codeUpper === 'COD') return 'Thanh toán khi nhận hàng'
                                if (codeUpper === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
                                if (codeUpper === 'MOMO') return 'Ví MoMo'
                                if (codeUpper === 'VNPAY') return 'VNPay'
                                return order.payment_method?.name || order.paymentMethod?.name || 'Chưa chọn'
                              })()}
                            </Typography>
                            {/* Trạng thái thanh toán */}
                            <Chip
                              size="small"
                              label={(() => {
                                // Đơn hàng đã hủy nhưng đã thanh toán -> Chờ hoàn tiền
                                if (order.status === 'cancelled' && order.payment_status === 'paid') {
                                  if (order.refund_status === 'pending') return '⏳ Chờ hoàn tiền'
                                  if (order.refund_status === 'processing') return '🔄 Đang hoàn tiền'
                                  return '⏳ Chờ hoàn tiền'
                                }
                                if (order.payment_status === 'refunded') return '↩ Đã hoàn tiền'
                                if (order.payment_status === 'paid') return '✓ Đã thanh toán'
                                if (order.transfer_confirmed_at) return '⏳ Chờ xác nhận'
                                const code = (order.payment_method?.code || order.paymentMethod?.code || '').toUpperCase()
                                if (code === 'COD') return 'Thanh toán khi nhận'
                                return '⏳ Chưa thanh toán'
                              })()}
                              sx={{
                                bgcolor: (() => {
                                  // Đơn hàng đã hủy nhưng đã thanh toán -> Màu cam đỏ
                                  if (order.status === 'cancelled' && order.payment_status === 'paid') {
                                    if (order.refund_status === 'processing') return '#ff5722'
                                    return '#e91e63'
                                  }
                                  if (order.payment_status === 'refunded') return '#9c27b0'
                                  if (order.payment_status === 'paid') return '#4caf50'
                                  if (order.transfer_confirmed_at) return '#2196f3'
                                  const code = (order.payment_method?.code || order.paymentMethod?.code || '').toUpperCase()
                                  if (code === 'COD') return '#607d8b'
                                  return '#ff9800'
                                })(),
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                          {/* ✅ Hiển thị countdown nếu đơn pending và có payment_expires_at */}
                          {order.status === 'pending' && order.payment_expires_at && (
                            <Box sx={{ mt: 1 }}>
                              <PaymentCountdown 
                                expiresAt={order.payment_expires_at}
                                onExpired={() => {
                                  toast.warning('Đơn hàng đã hết thời gian thanh toán')
                                  dispatch(fetchOrders())
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                        <Chip
                          label={getStatusText(order.status)}
                          sx={{ 
                            bgcolor: getStatusColor(order.status), 
                            color: 'white',
                            fontWeight: 'bold',
                            px: 2,
                            py: 2.5,
                            fontSize: '14px',
                          }}
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Order Items */}
                      <Box sx={{ mb: 2 }}>
                        {order.items?.slice(0, 2).map((item) => (
                          <Box 
                            key={item.id} 
                            sx={{ 
                              display: 'flex', 
                              gap: 2, 
                              mb: 2,
                              p: 1.5,
                              bgcolor: '#f9f9f9',
                              borderRadius: 1,
                            }}
                          >
                            <Box
                              component="img"
                              src={getImageUrl(
                                item.product?.thumbnail ||
                                item.product?.images?.[0]?.path ||
                                item.product?.image_url
                              )}
                              alt={item.product?.name || item.product_name}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'
                              }}
                              sx={{ 
                                width: 80, 
                                height: 80, 
                                objectFit: 'cover', 
                                borderRadius: 1,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography fontWeight="600" sx={{ mb: 0.5 }}>
                                {item.product?.name || item.product_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Số lượng: <strong>{item.quantity}</strong>
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Đơn giá
                              </Typography>
                              <Typography fontWeight="bold" color="primary">
                                {formatCurrency(item.unit_price || item.price)}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                        {order.items?.length > 2 && (
                          <Typography variant="body2" color="primary" sx={{ textAlign: 'center', mt: 1 }}>
                            + {order.items.length - 2} sản phẩm khác
                          </Typography>
                        )}
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Order Summary */}
                      <Box>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Tạm tính:</Typography>
                          </Grid>
                          <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" fontWeight="600">
                              {formatCurrency(order.subtotal || order.total)}
                            </Typography>
                          </Grid>
                          {order.discount_total > 0 && (
                            <>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Giảm giá:</Typography>
                              </Grid>
                              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" color="error" fontWeight="600">
                                  -{formatCurrency(order.discount_total)}
                                </Typography>
                              </Grid>
                            </>
                          )}
                          {order.tax_total > 0 && (
                            <>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Thuế (8%):</Typography>
                              </Grid>
                              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" fontWeight="600">
                                  +{formatCurrency(order.tax_total)}
                                </Typography>
                              </Grid>
                            </>
                          )}

                        </Grid>
                        
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            bgcolor: '#f0f7ff',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="h6" fontWeight="bold">
                            Tổng cộng:
                          </Typography>
                          <Typography variant="h5" color="error" fontWeight="bold">
                            {formatCurrency(order.grand_total || order.total)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleViewOrder(order)}
                          sx={{ 
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            flex: 1,
                            minWidth: '140px',
                          }}
                        >
                          Xem chi tiết
                        </Button>
                        {/* Nút Thanh toán ngay cho đơn hàng chờ thanh toán chuyển khoản/MoMo - ẩn khi đã xác nhận */}
                        {order.status === 'pending' && 
                         (order.payment_status === 'pending' || order.payment_status === 'unpaid') &&
                         !order.transfer_confirmed_at && (
                          <>
                            {(order.payment_method?.code === 'MOMO' || order.payment_method?.code === 'momo' ||
                              order.paymentMethod?.code === 'MOMO' || order.paymentMethod?.code === 'momo') && (
                              <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<Payment />}
                                onClick={() => navigate(`/orders/${order.id}/momo`)}
                                sx={{ 
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  flex: 1,
                                  minWidth: '140px',
                                  bgcolor: '#ae2070',
                                  '&:hover': { bgcolor: '#8e1a5a' },
                                }}
                              >
                                Thanh toán MoMo
                              </Button>
                            )}
                            {(order.payment_method?.code === 'VNPAY' || order.payment_method?.code === 'vnpay' ||
                              order.paymentMethod?.code === 'VNPAY' || order.paymentMethod?.code === 'vnpay') && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: '140px' }}>
                                {(() => {
                                  // Tính thời gian hết hạn dựa trên giao dịch đầu tiên + expiry_minutes
                                  const EXPIRY_MINUTES = 15 // Phải khớp với VNPAY_EXPIRY_MINUTES trong .env
                                  const EXPIRY_SECONDS = EXPIRY_MINUTES * 60
                                  const firstTransaction = order.first_v_n_pay_transaction
                                  const pendingTransaction = order.latest_pending_v_n_pay_transaction
                                  
                                  // Nếu có giao dịch đầu tiên, tính expires từ created_at + EXPIRY_SECONDS
                                  let orderExpiresAt = null
                                  if (firstTransaction?.created_at) {
                                    const createdAt = new Date(firstTransaction.created_at)
                                    orderExpiresAt = new Date(createdAt.getTime() + EXPIRY_SECONDS * 1000).toISOString()
                                  }
                                  
                                  // Kiểm tra đã hết hạn chưa
                                  const isExpired = orderExpiresAt && new Date(orderExpiresAt) <= new Date()
                                  
                                  if (isExpired) {
                                    return (
                                      <Box sx={{ 
                                        p: 1, 
                                        bgcolor: '#ffebee', 
                                        borderRadius: 1,
                                        border: '1px solid #ef5350',
                                        textAlign: 'center'
                                      }}>
                                        <Typography variant="caption" color="error" fontWeight={600}>
                                          ⏰ Đã hết thời gian thanh toán
                                        </Typography>
                                      </Box>
                                    )
                                  }
                                  
                                  return (
                                    <>
                                      <Button
                                        variant="contained"
                                        startIcon={<CreditCard />}
                                        onClick={() => navigate(`/orders/${order.id}/vnpay`)}
                                        fullWidth
                                        sx={{ 
                                          borderRadius: 1.5,
                                          textTransform: 'none',
                                          fontWeight: 600,
                                          bgcolor: '#0066b3',
                                          '&:hover': { bgcolor: '#005299' },
                                        }}
                                      >
                                        {firstTransaction && !pendingTransaction ? 'Thanh toán lại' : 
                                         pendingTransaction ? 'Tiếp tục thanh toán' : 'Thanh toán VNPay'}
                                      </Button>
                                      {/* Hiển thị countdown */}
                                      {orderExpiresAt ? (
                                        <Box sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          gap: 0.5,
                                          p: 0.5,
                                          bgcolor: '#fff3e0',
                                          borderRadius: 1,
                                          border: '1px solid #ffcc80',
                                        }}>
                                          <PaymentCountdown 
                                            expiresAt={orderExpiresAt}
                                            onExpired={() => dispatch(fetchOrders())}
                                          />
                                          <Typography variant="caption" color="text.secondary">
                                            còn lại để thanh toán
                                          </Typography>
                                        </Box>
                                      ) : (
                                        <Typography variant="caption" color="text.secondary" textAlign="center">
                                          Thời hạn thanh toán: 15 phút
                                        </Typography>
                                      )}
                                    </>
                                  )
                                })()}
                              </Box>
                            )}
                          </>
                        )}
                        {/* Chỉ hiện nút Hủy đơn nếu pending VÀ KHÔNG phải (completed + paid) */}
                        {order.status === 'pending' && !(order.status === 'completed' && order.payment_status === 'paid') && (
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleCancelClick(order)}
                            sx={{ 
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontWeight: 600,
                              flex: 1,
                              minWidth: '140px',
                            }}
                          >
                            Hủy đơn
                          </Button>
                        )}
                        {/* Hiển thị thông báo khi đơn đang chờ xác nhận hủy */}
                        {order.status === 'pending_cancel' && (
                          <Box sx={{ 
                            width: '100%', 
                            p: 1.5, 
                            bgcolor: '#fff3e0', 
                            borderRadius: 1.5,
                            border: '1px solid #ffcc80'
                          }}>
                            <Typography fontSize="0.85rem" color="warning.dark" fontWeight={600}>
                              ⏳ Đang chờ Admin xác nhận hủy đơn
                            </Typography>
                            <Typography fontSize="0.8rem" color="text.secondary">
                              Chúng tôi đang kiểm tra giao dịch chuyển khoản của bạn.
                            </Typography>
                          </Box>
                        )}
                        {order.status === 'completed' && (
                          <Button
                            variant="contained"
                            fullWidth
                            sx={{ 
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            Mua lại
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Order Detail Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          {selectedOrder && (
            <>
              <DialogTitle sx={{ fontWeight: 'bold', fontSize: '24px' }}>
                Chi tiết đơn hàng #{selectedOrder.code || selectedOrder.id}
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Thông tin đơn hàng
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Mã đơn hàng:</strong> {selectedOrder.code || selectedOrder.id}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Trạng thái:</strong>{' '}
                        <Chip
                          label={getStatusText(selectedOrder.status)}
                          size="small"
                          sx={{ 
                            bgcolor: getStatusColor(selectedOrder.status), 
                            color: 'white',
                            ml: 1,
                          }}
                        />
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Ngày đặt:</strong> {formatDateTime(selectedOrder.created_at)}
                      </Typography>
                      {selectedOrder.processor && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Nhân viên xử lý:</strong> {selectedOrder.processor.name}
                          {selectedOrder.updated_at && (
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              (Cập nhật lúc: {formatDateTime(selectedOrder.updated_at)})
                            </Typography>
                          )}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Người nhận:</strong> {selectedOrder.customer_name}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Số điện thoại:</strong> {selectedOrder.customer_phone}
                      </Typography>
                      {selectedOrder.shipping_address_line && (
                        <Typography variant="body2">
                          <strong>Địa chỉ:</strong> {selectedOrder.shipping_address_line}
                          {selectedOrder.shipping_city && `, ${selectedOrder.shipping_city}`}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Sản phẩm
                    </Typography>
                    {selectedOrder.items?.map((item) => (
                      <Box 
                        key={item.id} 
                        sx={{ 
                          display: 'flex', 
                          gap: 2, 
                          mb: 2,
                          p: 2,
                          bgcolor: '#f9f9f9',
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          component="img"
                          src={getImageUrl(
                            item.product?.thumbnail ||
                            item.product?.images?.[0]?.path ||
                            item.product?.image_url
                          )}
                          alt={item.product?.name || item.product_name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'
                          }}
                          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight="600">{item.product?.name || item.product_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Số lượng: {item.quantity} × {formatCurrency(item.unit_price || item.price)}
                          </Typography>
                        </Box>
                        <Typography fontWeight="bold" color="primary">
                          {formatCurrency((item.unit_price || item.price) * item.quantity)}
                        </Typography>
                      </Box>
                    ))}
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Tạm tính:</Typography>
                      <Typography fontWeight="600">{formatCurrency(selectedOrder.subtotal)}</Typography>
                    </Box>
                    {selectedOrder.discount_total > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Giảm giá:</Typography>
                        <Typography color="error" fontWeight="600">-{formatCurrency(selectedOrder.discount_total)}</Typography>
                      </Box>
                    )}
                    {selectedOrder.tax_total > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Thuế (8%):</Typography>
                        <Typography fontWeight="600">+{formatCurrency(selectedOrder.tax_total)}</Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
                      <Typography variant="h5" color="error" fontWeight="bold">
                        {formatCurrency(selectedOrder.grand_total || selectedOrder.total)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 2, gap: 1 }}>
                {/* Nút thanh toán trong dialog chi tiết - ẩn khi đã xác nhận chuyển khoản */}
                {selectedOrder.status === 'pending' && 
                 (selectedOrder.payment_status === 'pending' || selectedOrder.payment_status === 'unpaid') &&
                 !selectedOrder.transfer_confirmed_at && (
                  <>
                    {(selectedOrder.payment_method?.code === 'MOMO' || selectedOrder.payment_method?.code === 'momo' ||
                      selectedOrder.paymentMethod?.code === 'MOMO' || selectedOrder.paymentMethod?.code === 'momo') && (
                      <Button 
                        onClick={() => {
                          handleCloseDialog()
                          navigate(`/orders/${selectedOrder.id}/momo`)
                        }} 
                        variant="contained"
                        startIcon={<Payment />}
                        sx={{ 
                          borderRadius: 1.5,
                          bgcolor: '#ae2070',
                          '&:hover': { bgcolor: '#8e1a5a' },
                        }}
                      >
                        Thanh toán MoMo
                      </Button>
                    )}
                  </>
                )}
                {/* Hiển thị thông báo khi đã xác nhận thanh toán */}
                {selectedOrder.transfer_confirmed_at && selectedOrder.payment_status !== 'paid' && !selectedOrder.payment_rejected_at && (
                  <Typography variant="body2" color="primary" sx={{ flex: 1 }}>
                    ✓ Bạn đã xác nhận thanh toán. Vui lòng chờ Admin xác nhận.
                  </Typography>
                )}
                {/* Hiển thị thông báo khi thanh toán bị từ chối */}
                {selectedOrder.payment_rejected_at && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="error.main" fontWeight={600}>
                      ❌ Xác nhận thanh toán đã bị từ chối
                    </Typography>
                    {selectedOrder.payment_reject_reason && (
                      <Typography variant="body2" color="text.secondary">
                        Lý do: {selectedOrder.payment_reject_reason}
                      </Typography>
                    )}
                  </Box>
                )}
                <Button onClick={handleCloseDialog} variant="outlined" sx={{ borderRadius: 1.5 }}>
                  Đóng
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Cancel Order Confirmation Dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={handleCancelDialogClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
            ⚠️ Xác nhận hủy đơn hàng
          </DialogTitle>
          <DialogContent>
            {orderToCancel && (
              <>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Đơn hàng #{orderToCancel.code || orderToCancel.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng tiền: {formatCurrency(orderToCancel.grand_total || orderToCancel.total)}
                  </Typography>
                </Box>

                {/* Cảnh báo nếu đã thanh toán */}
                {orderToCancel.payment_status === 'paid' && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Đơn hàng này đã được thanh toán.
                    </Typography>
                    <Typography variant="body2">
                      Sau khi hủy, yêu cầu hoàn tiền sẽ được gửi đến bộ phận hỗ trợ.
                    </Typography>
                  </Alert>
                )}
                {/* Cảnh báo nếu đã xác nhận chuyển khoản nhưng chưa được verify */}
                {orderToCancel.transfer_confirmed_at && orderToCancel.payment_status !== 'paid' && !orderToCancel.payment_rejected_at && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Bạn đã xác nhận chuyển khoản nhưng chưa được Admin xác nhận.
                    </Typography>
                    <Typography variant="body2">
                      Nếu hủy đơn, vui lòng liên hệ với chúng tôi nếu đã chuyển tiền thật để được hỗ trợ.
                    </Typography>
                  </Alert>
                )}

                {/* Chọn lý do hủy */}
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Vui lòng cho chúng tôi biết lý do hủy đơn:
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Chọn lý do</InputLabel>
                  <Select
                    value={cancelReason}
                    label="Chọn lý do"
                    onChange={(e) => setCancelReason(e.target.value)}
                  >
                    {cancelReasons.map((reason) => (
                      <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Nhập lý do khác */}
                {cancelReason === 'Khác (nhập lý do)' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label="Nhập lý do của bạn"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                )}

                <Typography variant="body2" color="error">
                  ⚠️ Lưu ý: Hành động này không thể hoàn tác!
                </Typography>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={handleCancelDialogClose} 
              variant="outlined"
              disabled={cancelling}
              sx={{ borderRadius: 1.5 }}
            >
              Không, giữ đơn hàng
            </Button>
            <Button 
              onClick={handleCancelConfirm}
              variant="contained" 
              color="error"
              disabled={cancelling || !cancelReason || (cancelReason === 'Khác (nhập lý do)' && !customReason)}
              sx={{ borderRadius: 1.5 }}
            >
              {cancelling ? <CircularProgress size={24} color="inherit" /> : 'Xác nhận hủy'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </motion.div>
  )
}

export default Orders

