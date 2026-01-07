import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePolling } from '../../hooks/usePolling'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
} from '@mui/material'
import { paymentsApi } from '../../services/api'
import { formatCurrency, formatDateTime } from '../../services/utils'
import { toast } from 'react-toastify'

const OrderPayment = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPaymentInfo()
    // ❌ Removed old interval - Sẽ dùng usePolling thay thế
  }, [orderId])

  // ✅ THÊM POLLING CHO PAYMENT STATUS - Check mỗi 3 giây và auto-redirect
  usePolling(async () => {
    try {
      const response = await paymentsApi.getQrCode(orderId)
      setPaymentInfo(response.data)
      setPaymentStatus(response.data.status)
      
      // ✅ Tự động redirect khi thanh toán thành công
      if (response.data.status === 'paid') {
        toast.success('Thanh toán thành công!')
        setTimeout(() => {
          navigate(`/payment/result?orderId=${orderId}&status=success`)
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to check payment status:', error)
    }
  }, 3000)  // 3 giây - CRITICAL: Cần check nhanh để redirect kịp thời

  const fetchPaymentInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await paymentsApi.getQrCode(orderId)
      setPaymentInfo(response.data)
      setPaymentStatus(response.data.status)
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải thông tin thanh toán'
      const errorType = error.response?.data?.error
      
      // Nếu lỗi do bảng chưa tồn tại, hiển thị thông báo rõ ràng
      if (errorType === 'bank_transactions table does not exist') {
        const setupMessage = 'Hệ thống thanh toán chưa được thiết lập. Vui lòng liên hệ quản trị viên để chạy migration.'
        setError(setupMessage)
        toast.error(setupMessage)
      } else {
        setError(errorMessage)
        toast.error(errorMessage)
      }
      
      console.error('Error fetching payment info:', error)
      
      // Chỉ navigate nếu không phải lỗi do bảng chưa tồn tại hoặc lỗi 404
      if (error.response?.status === 404 || (error.response?.status === 500 && errorType !== 'bank_transactions table does not exist')) {
        setTimeout(() => {
          navigate('/orders')
        }, 3000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    try {
      setIsChecking(true)
      const response = await paymentsApi.checkPaymentStatus(orderId)
      const newStatus = response.data.status
      setPaymentStatus(newStatus)
      
      if (newStatus === 'paid') {
        toast.success('Thanh toán thành công!')
        setTimeout(() => {
          navigate('/orders')
        }, 2000)
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!paymentInfo && !isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Không tìm thấy thông tin thanh toán'}
        </Alert>
        {error && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button variant="contained" onClick={() => navigate('/orders')}>
              Quay lại danh sách đơn hàng
            </Button>
          </Box>
        )}
      </Container>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'expired':
        return 'error'
      default:
        return 'warning'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán'
      case 'expired':
        return 'Đã hết hạn'
      default:
        return 'Chờ thanh toán'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" align="center">
          Thanh toán đơn hàng
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Mã đơn hàng: {paymentInfo.order_code}
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Chip
                label={getStatusText(paymentStatus)}
                color={getStatusColor(paymentStatus)}
                sx={{ mb: 2, fontSize: '1rem', py: 2.5 }}
              />
              
              {paymentStatus === 'pending' && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  {paymentInfo?.payment_method_code === 'MOMO' 
                    ? 'Vui lòng quét mã QR bằng ứng dụng MoMo hoặc chuyển khoản đến số điện thoại MoMo theo thông tin bên dưới'
                    : 'Vui lòng quét mã QR để thanh toán hoặc chuyển khoản theo thông tin bên dưới'}
                </Alert>
              )}

              {paymentStatus === 'paid' && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Thanh toán thành công! Đơn hàng của bạn đang được xử lý.
                </Alert>
              )}

              {paymentStatus === 'expired' && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  Giao dịch đã hết hạn. Vui lòng liên hệ hỗ trợ.
                </Alert>
              )}
            </Box>

            {paymentStatus === 'pending' && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                  <Card sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    {paymentInfo.qr_code_data ? (
                      <Box
                        component="img"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(paymentInfo.qr_code_data)}`}
                        alt="QR Code"
                        sx={{ width: 256, height: 256 }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const fallback = e.target.parentElement.querySelector('.qr-fallback')
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    ) : (
                      <Box sx={{ width: 256, height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography>Không thể tạo QR code</Typography>
                      </Box>
                    )}
                    {paymentInfo.qr_code_data && (
                      <Box 
                        className="qr-fallback"
                        sx={{ 
                          width: 256, 
                          height: 256, 
                          display: 'none', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexDirection: 'column',
                          p: 2
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                          Sử dụng dữ liệu QR code bên dưới để quét bằng app ngân hàng
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            bgcolor: '#f5f5f5', 
                            p: 1, 
                            borderRadius: 1, 
                            fontFamily: 'monospace', 
                            wordBreak: 'break-all',
                            fontSize: '0.7rem'
                          }}
                        >
                          {paymentInfo.qr_code_data}
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {paymentInfo?.payment_method_code === 'MOMO' ? 'Thông tin thanh toán MoMo' : 'Thông tin chuyển khoản'}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {paymentInfo?.payment_method_code === 'MOMO' ? 'Ví điện tử:' : 'Ngân hàng:'}
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" gutterBottom>
                            {paymentInfo.bank_name}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            {paymentInfo?.payment_method_code === 'MOMO' ? 'Số điện thoại MoMo:' : 'Số tài khoản:'}
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" gutterBottom>
                            {paymentInfo.account_number}
                          </Typography>

                          {paymentInfo?.payment_method_code !== 'MOMO' && (
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Tên tài khoản:
                              </Typography>
                              <Typography variant="body1" fontWeight="bold" gutterBottom>
                                {paymentInfo.account_name}
                              </Typography>
                            </>
                          )}

                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Số tiền:
                          </Typography>
                          <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
                            {formatCurrency(paymentInfo.amount)}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Nội dung chuyển khoản:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" sx={{ 
                            bgcolor: '#f5f5f5', 
                            p: 1, 
                            borderRadius: 1,
                            fontFamily: 'monospace'
                          }}>
                            {paymentInfo.content}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Hướng dẫn thanh toán
                        </Typography>
                        <Box component="ol" sx={{ pl: 2, mt: 2 }}>
                          {paymentInfo?.payment_method_code === 'MOMO' ? (
                            <>
                              <li>
                                <Typography variant="body2" paragraph>
                                  Mở ứng dụng MoMo trên điện thoại
                                </Typography>
                              </li>
                              <li>
                                <Typography variant="body2" paragraph>
                                  Quét mã QR bên trái hoặc chuyển khoản đến số điện thoại: <strong>{paymentInfo.account_number}</strong>
                                </Typography>
                              </li>
                              <li>
                                <Typography variant="body2" paragraph>
                                  Nhập đúng nội dung: <strong>{paymentInfo.content}</strong>
                                </Typography>
                              </li>
                              <li>
                                <Typography variant="body2" paragraph>
                                  Số tiền: <strong>{formatCurrency(paymentInfo.amount)}</strong>
                                </Typography>
                              </li>
                              <li>
                                <Typography variant="body2" paragraph>
                                  Sau khi thanh toán, hệ thống sẽ tự động cập nhật trạng thái
                                </Typography>
                              </li>
                            </>
                          ) : (
                            <>
                              <li>
                                <Typography variant="body2" paragraph>
                                  Quét mã QR bằng ứng dụng ngân hàng của bạn
                                </Typography>
                              </li>
                              <li>
                                <Typography variant="body2" paragraph>
                                  Hoặc chuyển khoản theo thông tin bên cạnh
                                </Typography>
                              </li>
                              <li>
                                <Typography variant="body2" paragraph>
                                  Nhập đúng nội dung chuyển khoản: <strong>{paymentInfo.content}</strong>
                                </Typography>
                              </li>
                              <li>
                                <Typography variant="body2" paragraph>
                                  Sau khi chuyển khoản, hệ thống sẽ tự động cập nhật trạng thái
                                </Typography>
                              </li>
                            </>
                          )}
                        </Box>

                        {paymentInfo.expires_at && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            Hết hạn: {formatDateTime(paymentInfo.expires_at)}
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={checkPaymentStatus}
                    disabled={isChecking}
                    startIcon={isChecking ? <CircularProgress size={20} /> : null}
                  >
                    {isChecking ? 'Đang kiểm tra...' : 'Đã chuyển khoản - Kiểm tra lại'}
                  </Button>
                </Box>
              </>
            )}

            {(paymentStatus === 'paid' || paymentStatus === 'expired') && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/orders')}
                >
                  Xem đơn hàng
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </motion.div>
  )
}

export default OrderPayment

