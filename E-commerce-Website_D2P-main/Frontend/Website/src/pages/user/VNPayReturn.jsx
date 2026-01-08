import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Warning,
  ShoppingBag,
  Home,
  Replay,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { formatCurrency } from '../../services/utils'
import { paymentsApi } from '../../services/api'

// VNPay response code mapping
const VNPAY_RESPONSE_CODES = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
  '09': 'Giao dịch không thành công: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
  '10': 'Giao dịch không thành công: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Giao dịch không thành công: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
  '12': 'Giao dịch không thành công: Thẻ/Tài khoản của khách hàng bị khóa',
  '13': 'Giao dịch không thành công: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
  '24': 'Giao dịch không thành công: Khách hàng hủy giao dịch',
  '51': 'Giao dịch không thành công: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
  '65': 'Giao dịch không thành công: Tài khoản của quý khách đã vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Giao dịch không thành công: KH nhập sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
}

const VNPayReturn = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [status, setStatus] = useState('loading') // loading, success, error
  const [paymentInfo, setPaymentInfo] = useState(null)

  useEffect(() => {
    const verifyPayment = async () => {
      // Lấy tất cả query params từ VNPay
      const params = {}
      searchParams.forEach((value, key) => {
        params[key] = value
      })

      // Nếu có error từ URL
      const error = searchParams.get('error')
      if (error) {
        setStatus('error')
        setPaymentInfo({
          errorMessage: decodeURIComponent(error),
        })
        return
      }

      // Nếu không có vnp_ResponseCode, không phải từ VNPay
      const vnpResponseCode = searchParams.get('vnp_ResponseCode')
      if (!vnpResponseCode) {
        setStatus('error')
        setPaymentInfo({
          errorMessage: 'Không có thông tin thanh toán',
        })
        return
      }

      try {
        // Gọi API backend để xác thực và cập nhật order
        const response = await paymentsApi.verifyVNPayReturn(params)
        const data = response.data

        if (data.success) {
          setStatus('success')
          setPaymentInfo({
            responseCode: data.data.response_code,
            txnRef: data.data.txn_ref,
            orderId: data.data.order_id,
            orderCode: data.data.order_code,
            amount: data.data.amount ? parseInt(data.data.amount) / 100 : null,
            transactionNo: data.data.transaction_no,
            bankCode: data.data.bank_code,
            payDate: data.data.pay_date,
            isSuccess: true,
            message: 'Giao dịch thành công',
          })
        } else {
          setStatus('error')
          setPaymentInfo({
            responseCode: data.data?.response_code || vnpResponseCode,
            txnRef: data.data?.txn_ref || searchParams.get('vnp_TxnRef'),
            orderId: data.data?.order_id,
            orderCode: data.data?.order_code,
            isSuccess: false,
            message: data.message || VNPAY_RESPONSE_CODES[vnpResponseCode] || 'Thanh toán thất bại',
          })
        }
      } catch (err) {
        console.error('Error verifying VNPay payment:', err)
        // Fallback: hiển thị kết quả từ query params nếu API lỗi
        const txnRef = searchParams.get('vnp_TxnRef')
        // TxnRef format: {orderCode}_{timestamp} hoặc có thể là orderId
        const orderCodeFromTxn = txnRef ? txnRef.split('_')[0] : null
        const info = {
          responseCode: vnpResponseCode,
          txnRef: txnRef,
          orderCode: orderCodeFromTxn,
          amount: searchParams.get('vnp_Amount') ? parseInt(searchParams.get('vnp_Amount')) / 100 : null,
          transactionNo: searchParams.get('vnp_TransactionNo'),
          bankCode: searchParams.get('vnp_BankCode'),
          payDate: searchParams.get('vnp_PayDate'),
          isSuccess: vnpResponseCode === '00',
          message: VNPAY_RESPONSE_CODES[vnpResponseCode] || 'Không xác định',
        }
        setPaymentInfo(info)
        setStatus(info.isSuccess ? 'success' : 'error')
      }
    }

    verifyPayment()
  }, [searchParams])

  // Loading state
  if (status === 'loading') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress size={60} sx={{ color: '#0066b3', mb: 3 }} />
          <Typography variant="h5">
            Đang xử lý kết quả thanh toán...
          </Typography>
        </Paper>
      </Container>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <CheckCircle sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
            </motion.div>
            
            <Typography variant="h4" gutterBottom fontWeight="bold" color="success.main">
              Thanh toán thành công!
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận.
            </Typography>

            {paymentInfo && (
              <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'left' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Chi tiết giao dịch
                </Typography>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {paymentInfo.txnRef && (
                    <Typography variant="body2">
                      <strong>Mã giao dịch:</strong> {paymentInfo.txnRef}
                    </Typography>
                  )}
                  {paymentInfo.transactionNo && (
                    <Typography variant="body2">
                      <strong>Mã VNPay:</strong> {paymentInfo.transactionNo}
                    </Typography>
                  )}
                  {paymentInfo.amount && (
                    <Typography variant="body2">
                      <strong>Số tiền:</strong> {formatCurrency(paymentInfo.amount)}
                    </Typography>
                  )}
                  {paymentInfo.bankCode && (
                    <Typography variant="body2">
                      <strong>Ngân hàng:</strong> {paymentInfo.bankCode}
                    </Typography>
                  )}
                  {paymentInfo.payDate && (
                    <Typography variant="body2">
                      <strong>Thời gian:</strong> {formatPayDate(paymentInfo.payDate)}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </Button>
              <Button
                variant="contained"
                startIcon={<ShoppingBag />}
                onClick={() => navigate('/orders')}
                sx={{ 
                  bgcolor: '#0066b3',
                  '&:hover': { bgcolor: '#005299' }
                }}
              >
                Xem đơn hàng
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    )
  }

  // Error state
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            {paymentInfo?.responseCode === '24' ? (
              <Warning sx={{ fontSize: 100, color: 'warning.main', mb: 2 }} />
            ) : (
              <Cancel sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
            )}
          </motion.div>
          
          <Typography 
            variant="h4" 
            gutterBottom 
            fontWeight="bold" 
            color={paymentInfo?.responseCode === '24' ? 'warning.main' : 'error.main'}
          >
            {paymentInfo?.responseCode === '24' ? 'Bạn đã hủy thanh toán' : 'Thanh toán thất bại'}
          </Typography>
          
          <Alert 
            severity={paymentInfo?.responseCode === '24' ? 'info' : 'error'} 
            sx={{ mb: 3, textAlign: 'left' }}
          >
            {paymentInfo?.responseCode === '24' 
              ? 'Bạn đã hủy giao dịch thanh toán. Đơn hàng vẫn được giữ và bạn có thể thanh toán lại bất cứ lúc nào.'
              : (paymentInfo?.errorMessage || paymentInfo?.message || 'Có lỗi xảy ra trong quá trình thanh toán')}
          </Alert>

          {paymentInfo && paymentInfo.responseCode && (
            <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'left' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Mã lỗi:</strong> {paymentInfo.responseCode}
              </Typography>
              {paymentInfo.txnRef && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Mã giao dịch:</strong> {paymentInfo.txnRef}
                </Typography>
              )}
            </Box>
          )}

          {paymentInfo?.responseCode === '24' ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bạn có thể thanh toán lại hoặc chọn phương thức thanh toán khác
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Vui lòng kiểm tra lại thông tin và thử lại, hoặc chọn phương thức thanh toán khác
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<ShoppingBag />}
              onClick={() => navigate('/orders')}
            >
              Xem đơn hàng
            </Button>
            {paymentInfo?.orderId && paymentInfo?.responseCode === '24' && (
              <Button
                variant="contained"
                startIcon={<Replay />}
                onClick={() => navigate(`/orders/${paymentInfo.orderId}/vnpay`)}
                sx={{ 
                  bgcolor: '#0066b3',
                  '&:hover': { bgcolor: '#005299' }
                }}
              >
                Thanh toán lại
              </Button>
            )}
            {paymentInfo?.orderId && paymentInfo?.responseCode !== '24' && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<Replay />}
                onClick={() => navigate(`/orders/${paymentInfo.orderId}/vnpay`)}
              >
                Thử lại
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={() => navigate('/')}
            >
              Về trang chủ
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  )
}

// Helper function to format VNPay pay date (yyyyMMddHHmmss)
const formatPayDate = (payDate) => {
  if (!payDate || payDate.length < 14) return payDate
  
  const year = payDate.substring(0, 4)
  const month = payDate.substring(4, 6)
  const day = payDate.substring(6, 8)
  const hour = payDate.substring(8, 10)
  const minute = payDate.substring(10, 12)
  const second = payDate.substring(12, 14)
  
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`
}

export default VNPayReturn
