import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import * as yup from 'yup'
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  FormControl,
  CircularProgress,
  Divider,
  Paper,
  Chip,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material'
import {
  Person,
  Phone,
  Email,
  LocationOn,
  ShoppingBag,
  Payment,
  Note,
} from '@mui/icons-material'
import { createOrder } from '../../store/slices/ordersSlice'
import { fetchCart } from '../../store/slices/cartSlice'
import { formatCurrency, getImageUrl } from '../../services/utils'
import { toast } from 'react-toastify'
import { withLoading } from '../../utils/loadingHelper'
import { paymentMethodsApi, promotionsApi, cartApi } from '../../services/api'

// Validation schema
const checkoutValidationSchema = yup.object({
  name: yup.string().required('Vui lòng nhập họ và tên').min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: yup.string().required('Vui lòng nhập số điện thoại').matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ'),
  email: yup.string().required('Vui lòng nhập email').email('Email không hợp lệ'),
  city: yup.string().required('Vui lòng chọn Tỉnh/Thành phố'),
  ward: yup.string().required('Vui lòng chọn Phường/Xã'),
  address: yup.string().required('Vui lòng nhập địa chỉ cụ thể').min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
})

const Checkout = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const { items, total: cartTotal, subtotal: cartSubtotal, discountTotal: cartDiscountTotal, promotion: cartPromotion } = useSelector((state) => state.cart)
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null)
  
  // Kiểm tra xem có phải từ "Mua ngay" không
  const isBuyNow = location.state?.isBuyNow || false
  
  // Voucher state - khởi tạo từ cart nếu có
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
  const [availablePromotions, setAvailablePromotions] = useState([])
  
  // ✅ Debug: Log availablePromotions khi thay đổi
  useEffect(() => {
    console.log('🎫 [Checkout] availablePromotions updated:', availablePromotions.length, availablePromotions);
  }, [availablePromotions]);
  
  // ✅ Function để fetch coupons (tách ra để có thể gọi lại)
  const fetchCoupons = useCallback(() => {
    console.log('🎫 [Checkout] Fetching coupons...');
    promotionsApi.getPromotions({ 
      only_active: true, 
      category: 'coupon',
      _t: Date.now() // ✅ Cache busting
    })
      .then(response => {
        console.log('🎫 [Checkout] Promotions API response:', response.data);
        // Filter thêm một lần nữa để đảm bảo chỉ có coupon
        const coupons = (response.data?.data || []).filter(
          p => p.promotion_category === 'coupon' || (!p.promotion_category && !p.is_flash_sale)
        )
        console.log('🎫 [Checkout] Filtered coupons:', coupons.length, coupons);
        setAvailablePromotions(coupons)
      })
      .catch(error => {
        console.error('❌ [Checkout] Error fetching promotions:', error)
      })
  }, []);
  
  // ❌ Removed WebSocket - Không cần realtime updates nữa
  
  // Khởi tạo voucher state từ cart khi load
  useEffect(() => {
    if (cartPromotion) {
      setAppliedVoucher(cartPromotion)
      setVoucherCode(cartPromotion.code || '')
      setVoucherDiscount(cartDiscountTotal || 0)
    }
  }, [cartPromotion, cartDiscountTotal])
  
  // Check authentication and fetch data
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thanh toán')
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    
    // Only fetch if authenticated
    dispatch(fetchCart())
    
    // Fetch provinces from Backend proxy (avoid CORS)
    const API_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api')
    fetch(`${API_URL}/address/provinces`)
      .then(res => res.json())
      .then(data => {
        console.log('Provinces loaded:', data)
        setProvinces(data || [])
      })
      .catch(error => {
        console.error('Error fetching provinces:', error)
        toast.error('Không thể tải danh sách tỉnh/thành phố')
      })
    
    // Fetch payment methods
    paymentMethodsApi.getPaymentMethods()
      .then(response => {
        setPaymentMethods(response.data || [])
        // Set default to COD
        const codMethod = response.data?.find(m => m.code === 'COD')
        if (codMethod) {
          setSelectedPaymentMethodId(codMethod.id)
        }
      })
      .catch(error => {
        console.error('Error fetching payment methods:', error)
      })
    
    // ✅ Fetch coupons lần đầu
    fetchCoupons()
  }, [dispatch, isAuthenticated, navigate, fetchCoupons])

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    email: user?.email || '',
    city: '',
    district: '',
    ward: '',
    notes: '',
  })

  // State for provinces/districts/wards
  const [provinces, setProvinces] = useState([])
  const [communes, setCommunes] = useState([]) // Phường/Xã
  const [selectedProvince, setSelectedProvince] = useState(null)

  // Use subtotal from backend (before discount), otherwise calculate from items
  const total = cartSubtotal || items.reduce((sum, item) => {
    const itemTotal = (item.product?.price || item.unit_price || 0) * item.quantity
    return sum + itemTotal
  }, 0)
  
  const subtotalAfterDiscount = total - voucherDiscount
  const taxAmount = Math.round(subtotalAfterDiscount * 0.08) // Thuế 8%
  const finalTotal = subtotalAfterDiscount + taxAmount

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá')
      return
    }

    setIsValidatingVoucher(true)
    try {
      // Gọi API áp dụng mã giảm giá vào Cart (Backend sẽ lưu promotion_id và discount_total)
      const response = await cartApi.applyPromotion(voucherCode.toUpperCase())
      
      if (response.data) {
        const cart = response.data
        setAppliedVoucher(cart.promotion)
        setVoucherDiscount(cart.discount_total || 0)
        toast.success('Áp dụng mã giảm giá thành công!')
        // Refresh cart để đồng bộ state
        dispatch(fetchCart())
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ')
      setAppliedVoucher(null)
      setVoucherDiscount(0)
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  const handleRemoveVoucher = async () => {
    try {
      await cartApi.removePromotion()
      setVoucherCode('')
      setAppliedVoucher(null)
      setVoucherDiscount(0)
      toast.info('Đã xóa mã giảm giá')
      // Refresh cart
      dispatch(fetchCart())
    } catch (error) {
      console.error('Error removing voucher:', error)
      // Vẫn reset state local
      setVoucherCode('')
      setAppliedVoucher(null)
      setVoucherDiscount(0)
    }
  }

  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value
    const province = provinces.find(p => p.code === provinceCode)
    setSelectedProvince(province)
    setShippingInfo({ ...shippingInfo, city: province?.name || '', ward: '' })
    setCommunes([])
    
    if (provinceCode) {
      try {
        // Load danh sách xã/phường từ tỉnh (Backend proxy)
        const API_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api')
        const res = await fetch(`${API_URL}/address/provinces/${provinceCode}/communes`)
        const data = await res.json()
        console.log('Communes loaded:', data)
        setCommunes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching communes:', error)
      }
    }
  }

  const handleCommuneChange = (e) => {
    const communeCode = e.target.value
    const commune = communes.find(c => c.code === communeCode)
    setShippingInfo({ ...shippingInfo, ward: commune?.name || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate using yup schema
    try {
      await checkoutValidationSchema.validate(shippingInfo, { abortEarly: false })
    } catch (validationError) {
      // Show first validation error
      if (validationError.inner && validationError.inner.length > 0) {
        toast.error(validationError.inner[0].message)
      } else {
        toast.error(validationError.message)
      }
      return
    }

    // Kiểm tra giỏ hàng
    if (items.length === 0) {
      toast.error('Giỏ hàng trống')
      navigate('/cart')
      return
    }
    
    setIsLoading(true)
    
    // Map frontend data to backend expected format
    // Backend tự động lấy items từ cart
    const orderData = {
      customer_name: shippingInfo.name.trim(),
      customer_phone: shippingInfo.phone?.trim() || null,
      customer_email: shippingInfo.email?.trim() || null,
      shipping_address_line: shippingInfo.address?.trim() || null,
      shipping_city: shippingInfo.city?.trim() || null,
      payment_method_id: selectedPaymentMethodId,
      notes: shippingInfo.notes?.trim() || null,
    }

    try {
      const result = await withLoading(async () => {
        return await dispatch(createOrder(orderData))
      })
      
      if (createOrder.fulfilled.match(result)) {
        const order = result.payload
        const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId)
        
        // Refresh cart after successful order
        dispatch(fetchCart())
        
        // Xử lý theo phương thức thanh toán
        if (selectedMethod) {
          // COD - thanh toán khi nhận hàng
          if (selectedMethod.code === 'COD') {
            toast.success('Đặt hàng thành công')
            navigate('/orders')
          } 
          // Chuyển khoản ngân hàng - hiển thị QR
          else if (selectedMethod.code === 'BANK_TRANSFER') {
            toast.success('Đơn hàng đã được tạo. Vui lòng chuyển khoản để hoàn tất.')
            navigate(`/orders/${order.id}/bank-transfer`)
          }
          // MoMo - hiển thị QR MoMo
          else if (selectedMethod.code === 'MOMO') {
            toast.success('Đơn hàng đã được tạo. Vui lòng thanh toán qua MoMo để hoàn tất.')
            navigate(`/orders/${order.id}/momo`)
          }
          // VNPay - redirect đến trang thanh toán VNPay
          else if (selectedMethod.code === 'VNPAY') {
            toast.success('Đơn hàng đã được tạo. Đang chuyển đến trang thanh toán VNPay...')
            navigate(`/orders/${order.id}/vnpay`)
          }
          // Các phương thức thanh toán online khác - cần thanh toán trước
          else if (selectedMethod.type === 'online') {
            toast.success('Đơn hàng đã được tạo. Vui lòng thanh toán để hoàn tất.')
            navigate(`/orders/${order.id}/payment`)
          } 
          // Mặc định
          else {
            toast.success('Đặt hàng thành công')
            navigate('/orders')
          }
        } else {
          toast.success('Đặt hàng thành công')
          navigate('/orders')
        }
      } else {
        const errorMessage = result.payload || 'Đặt hàng thất bại'
        toast.error(errorMessage)
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đặt hàng')
      console.error('Order creation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom fontWeight="bold" color="primary">
            Thanh toán
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vui lòng kiểm tra thông tin và hoàn tất đơn hàng
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card 
                  sx={{ 
                    mb: 3,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    },
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <ShoppingBag sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                      <Typography variant="h5" fontWeight="bold">
                        Thông tin giao hàng
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      value={shippingInfo.name}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                      required
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      required
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                      required
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Tỉnh/Thành phố</InputLabel>
                      <Select
                        value={selectedProvince?.code || ''}
                        onChange={handleProvinceChange}
                        label="Tỉnh/Thành phố"
                      >
                        {Array.isArray(provinces) && provinces.map((province) => (
                          <MenuItem key={province.code} value={province.code}>
                            {province.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required disabled={!selectedProvince}>
                      <InputLabel>Phường/Xã</InputLabel>
                      <Select
                        value={shippingInfo.ward ? communes.find(c => c.name === shippingInfo.ward)?.code || '' : ''}
                        onChange={handleCommuneChange}
                        label="Phường/Xã"
                      >
                        {Array.isArray(communes) && communes.map((commune) => (
                          <MenuItem key={commune.code} value={commune.code}>
                            {commune.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Địa chỉ cụ thể"
                      placeholder="Số nhà, tên đường..."
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                      required
                      multiline
                      rows={2}
                      InputProps={{
                        startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1.5 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ghi chú"
                      placeholder="Thêm ghi chú cho đơn hàng (không bắt buộc)"
                      value={shippingInfo.notes}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                      multiline
                      rows={3}
                      InputProps={{
                        startAdornment: <Note sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1.5 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  </Grid>
                </CardContent>
              </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card
                  sx={{ 
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    },
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Payment sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                      <Typography variant="h5" fontWeight="bold">
                        Phương thức thanh toán
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <FormControl fullWidth>
                      <InputLabel id="payment-method-label">Chọn phương thức thanh toán</InputLabel>
                      <Select
                        labelId="payment-method-label"
                        value={selectedPaymentMethodId || ''}
                        label="Chọn phương thức thanh toán"
                        onChange={(e) => setSelectedPaymentMethodId(Number(e.target.value))}
                        renderValue={(value) => {
                          const method = paymentMethods.find(m => m.id === value)
                          return method ? (
                            <Box>
                              <Typography variant="body1" fontWeight="bold" component="span">
                                {method.name}
                              </Typography>
                              {method.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }} component="span">
                                  - {method.description}
                                </Typography>
                              )}
                            </Box>
                          ) : ''
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 300,
                              zIndex: 1302,
                            }
                          },
                          disableScrollLock: false,
                        }}
                        sx={{
                          '& .MuiSelect-select': {
                            py: 1.5,
                          }
                        }}
                      >
                        {paymentMethods.map((method) => (
                          <MenuItem key={method.id} value={method.id} sx={{ py: 1.5 }}>
                            <Box>
                              <Typography variant="body1" fontWeight="bold">
                                {method.name}
                              </Typography>
                              {method.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {method.description}
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card
                  sx={{ 
                    position: 'sticky',
                    top: 100,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    },
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h5" fontWeight="bold">
                        Đơn hàng
                      </Typography>
                      <Chip 
                        label={`${items.length} sản phẩm`} 
                        color="primary" 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Box 
                            sx={{ 
                              mb: 2,
                              pb: 2,
                              borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none',
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                              <Box
                                component="img"
                                src={getImageUrl(
                                  item.product?.thumbnail ||
                                  item.product?.images?.[0]?.path ||
                                  item.product?.image_url
                                )}
                                alt={item.product?.name || item.product_name}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'
                                }}
                                sx={{
                                  width: 60,
                                  height: 60,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  border: '1px solid #e0e0e0',
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="500" sx={{ mb: 0.5 }}>
                                  {item.product?.name || item.product_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  SL: {item.quantity} × {formatCurrency(item.product?.price || item.unit_price || 0)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="primary" fontWeight="bold">
                                {formatCurrency(
                                  (item.product?.price || item.unit_price || 0) * item.quantity
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        </motion.div>
                      ))}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Voucher Section */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                        🎫 Mã giảm giá
                      </Typography>
                      
                      {!appliedVoucher ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Nhập mã giảm giá"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            disabled={isValidatingVoucher}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleApplyVoucher()
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleApplyVoucher}
                            disabled={isValidatingVoucher || !voucherCode.trim()}
                            sx={{ minWidth: 100 }}
                          >
                            {isValidatingVoucher ? <CircularProgress size={20} /> : 'Áp dụng'}
                          </Button>
                        </Box>
                      ) : (
                        <Box 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'success.light', 
                            borderRadius: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight="bold" color="success.dark">
                              {appliedVoucher.code}
                            </Typography>
                            <Typography variant="caption" color="success.dark">
                              Giảm {formatCurrency(voucherDiscount)}
                            </Typography>
                          </Box>
                          <Button 
                            size="small" 
                            onClick={handleRemoveVoucher}
                            sx={{ color: 'success.dark' }}
                          >
                            Xóa
                          </Button>
                        </Box>
                      )}
                      
                      {/* Available promotions */}
                      {!appliedVoucher && availablePromotions.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Mã khuyến mãi có sẵn:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {availablePromotions.slice(0, 3).map((promo) => (
                              <Chip
                                key={promo.id}
                                label={promo.code}
                                size="small"
                                onClick={() => {
                                  setVoucherCode(promo.code)
                                  handleApplyVoucher()
                                }}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'primary.light', color: 'white' }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Order Summary */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Tạm tính:</Typography>
                        <Typography variant="body2">{formatCurrency(total)}</Typography>
                      </Box>
                      {voucherDiscount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="success.main">Giảm giá:</Typography>
                          <Typography variant="body2" color="success.main">-{formatCurrency(voucherDiscount)}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Thuế VAT (8%):</Typography>
                        <Typography variant="body2">{formatCurrency(taxAmount)}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
                          {formatCurrency(finalTotal)}
                        </Typography>
                      </Box>
                    </Box>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        variant="contained" 
                        fullWidth 
                        size="large"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : null}
                        sx={{
                          py: 2,
                          fontSize: '18px',
                          fontWeight: 'bold',
                          textTransform: 'none',
                          borderRadius: 2,
                          boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                          background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
                          '&:hover': {
                            boxShadow: '0 6px 20px rgba(211, 47, 47, 0.4)',
                            background: 'linear-gradient(45deg, #c62828 30%, #e53935 90%)',
                          },
                          '&:disabled': {
                            background: '#ccc',
                          },
                        }}
                      >
                        {isLoading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </form>
      </Container>
    </motion.div>
  )
}

export default Checkout

