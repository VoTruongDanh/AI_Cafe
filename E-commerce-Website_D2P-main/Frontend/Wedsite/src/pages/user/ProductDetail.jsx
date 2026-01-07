import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Divider,
  Stack,
  LinearProgress,
} from '@mui/material'
import {
  ShoppingCart,
  Favorite,
  LocalShipping,
  Security,
  Refresh,
  VerifiedUser,
  Star,
  CheckCircle,
  Phone,
  Warning,
  Remove,
  Add,
  Share,
} from '@mui/icons-material'
import { fetchProductDetail, updateProduct } from '../../store/slices/productsSlice'
import { addToCart, updateCartItem } from '../../store/slices/cartSlice'
import { addRecentlyViewed } from '../../store/slices/recentlyViewedSlice'
import { formatCurrency, calculateDiscount, getImageUrl } from '../../services/utils'
import { toast } from 'react-toastify'
import ProductCard from '../../components/common/ProductCard'
import ProductReviews from '../../components/product/ProductReviews'
import StockAlertButton from '../../components/product/StockAlertButton'
import { recentlyViewedApi } from '../../services/api'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { currentProduct, isLoading } = useSelector((state) => state.products)
  const { products } = useSelector((state) => state.products)
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { items: cartItems } = useSelector((state) => state.cart)
  
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [tabValue, setTabValue] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)

  // ✅ WebSocket: Global listener trong App.jsx sẽ tự động cập nhật Redux store
  // Redux store sẽ trigger re-render khi có product update

  // ✅ Fetch product detail khi component mount, id thay đổi, hoặc navigate back
  useEffect(() => {
    console.log('🔄 Fetching product detail:', id)
    dispatch(fetchProductDetail(id))
  }, [dispatch, id, location.key]) // location.key thay đổi mỗi khi navigate

  // Track recently viewed (Hybrid: LocalStorage + Backend)
  useEffect(() => {
    if (currentProduct) {
      // Always add to LocalStorage (for guest users)
      dispatch(addRecentlyViewed(currentProduct))
      
      // If authenticated, also send to backend
      if (isAuthenticated) {
        recentlyViewedApi.add(currentProduct.id).catch(err => {
          console.error('Failed to track recently viewed:', err)
        })
      }
    }
  }, [dispatch, currentProduct, isAuthenticated])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua hàng')
      // Lưu URL hiện tại để quay lại sau khi đăng nhập
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }

    // Kiểm tra số lượng đã có trong giỏ hàng
    const cartItem = cartItems.find(item => item.product_id === parseInt(id))
    const quantityInCart = cartItem ? cartItem.quantity : 0
    const totalQuantity = quantityInCart + quantity

    // Kiểm tra tồn kho
    if (totalQuantity > currentProduct.quantity) {
      toast.error(`Chỉ còn ${currentProduct.quantity} sản phẩm trong kho. Bạn đã có ${quantityInCart} sản phẩm trong giỏ hàng.`)
      return
    }

    setIsAddingToCart(true)
    try {
      const result = await dispatch(addToCart({ productId: id, quantity }))
      if (addToCart.fulfilled.match(result)) {
        toast.success('Đã thêm vào giỏ hàng')
      } else {
        toast.error(result.payload || 'Thêm vào giỏ hàng thất bại')
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua hàng')
      // Lưu URL hiện tại để quay lại sau khi đăng nhập
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }

    // Kiểm tra tồn kho
    if (quantity > currentProduct.quantity) {
      toast.error(`Chỉ còn ${currentProduct.quantity} sản phẩm trong kho.`)
      return
    }

    // Kiểm tra số lượng đã có trong giỏ hàng
    const cartItem = cartItems.find(item => item.product_id === parseInt(id))

    setIsBuyingNow(true)
    try {
      if (cartItem) {
        // Nếu sản phẩm đã có trong giỏ, cập nhật số lượng thay vì cộng dồn
        const result = await dispatch(updateCartItem({ 
          itemId: cartItem.id, 
          quantity: quantity 
        }))
        if (updateCartItem.fulfilled.match(result)) {
          navigate('/checkout', { state: { isBuyNow: true } })
        } else {
          toast.error(result.payload || 'Không thể mua hàng. Vui lòng thử lại.')
        }
      } else {
        // Nếu chưa có trong giỏ, thêm mới
        const result = await dispatch(addToCart({ productId: id, quantity }))
        if (addToCart.fulfilled.match(result)) {
          navigate('/checkout', { state: { isBuyNow: true } })
        } else {
          toast.error(result.payload || 'Không thể mua hàng. Vui lòng thử lại.')
        }
      }
    } finally {
      setIsBuyingNow(false)
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!currentProduct) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert severity="error">Không tìm thấy sản phẩm</Alert>
      </Container>
    )
  }

  const images = currentProduct.images && currentProduct.images.length > 0
    ? currentProduct.images
    : [{ path: currentProduct.thumbnail || '/placeholder.jpg' }]
  
  // ✅ ĐÚNG: Chỉ hiển thị giá bán và giá sau khuyến mãi cho khách hàng
  // original_price = giá nhập (KHÔNG hiển thị cho khách, chỉ dùng nội bộ tính lợi nhuận)
  const hasPromotion = currentProduct.has_active_promotion === true
  const basePrice = currentProduct.price // Giá bán gốc (giá niêm yết)
  const effectivePrice = currentProduct.effective_price ?? currentProduct.price // Giá sau khuyến mãi

  // Tính % giảm giá: Chỉ khi có khuyến mãi và giá sau KM < giá bán gốc
  const discount = hasPromotion && basePrice > effectivePrice 
    ? calculateDiscount(basePrice, effectivePrice) 
    : 0

  const relatedProducts = products
    .filter(p => p.category_id === currentProduct.category_id && p.id !== currentProduct.id)
    .slice(0, 4)

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Grid container spacing={{ xs: 3, md: 5 }}>
          {/* Left Column - Images */}
          <Grid item xs={12} md={6}>
            {/* Main Image */}
            <Box 
              sx={{ 
                position: 'relative',
                bgcolor: '#fff',
                borderRadius: 3,
                overflow: 'hidden',
                height: { xs: 350, sm: 450, md: 600 },
                mb: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e8e8e8',
              }}
            >
              <Box
                component="img"
                src={getImageUrl(images[selectedImage]?.path || images[0]?.path || currentProduct.thumbnail)}
                alt={currentProduct.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              />
              
              {/* Discount Badge */}
              {discount > 0 && (
                <Chip
                  label={`-${discount}%`}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    bgcolor: '#ff1744',
                    color: 'white',
                    fontWeight: 'bold',
                    height: 40,
                    fontSize: '15px',
                    boxShadow: '0 4px 12px rgba(255,23,68,0.4)',
                    zIndex: 2,
                  }}
                />
              )}
            </Box>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: 6,
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#d32f2f',
                  borderRadius: 3,
                },
              }}>
                {images.map((image, index) => (
                  <Box
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    sx={{
                      minWidth: 90,
                      height: 90,
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: selectedImage === index ? '3px solid #d32f2f' : '2px solid #e0e0e0',
                      overflow: 'hidden',
                      bgcolor: '#fff',
                      opacity: selectedImage === index ? 1 : 0.7,
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        opacity: 1,
                        borderColor: '#d32f2f',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(211,47,47,0.2)',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={getImageUrl(image.path || currentProduct.thumbnail)}
                      alt={`${currentProduct.name} ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {/* Benefits Card */}
            <Card 
              elevation={0} 
              sx={{ 
                mt: 3, 
                bgcolor: '#fff',
                border: '1px solid #e8e8e8', 
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <LocalShipping sx={{ color: '#1976d2', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                        Giao hàng miễn phí
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Toàn quốc từ 500.000đ
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider />
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <VerifiedUser sx={{ color: '#388e3c', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                        Bảo hành chính hãng
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentProduct.warranty_months || 12} tháng
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider />
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: '#fff3e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Refresh sx={{ color: '#f57c00', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                        Đổi trả dễ dàng
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Trong 7 ngày
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Description Tabs */}
            <Box sx={{ mt: 3, bgcolor: '#fff', borderRadius: 3, p: { xs: 2, md: 3 }, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Tabs 
                value={tabValue} 
                onChange={(e, v) => setTabValue(v)} 
                sx={{ 
                  borderBottom: '2px solid #e8e8e8',
                  mb: 3,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    minHeight: 48,
                    '&.Mui-selected': {
                      color: '#d32f2f',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    bgcolor: '#d32f2f',
                  },
                }}
              >
                <Tab label="Mô tả sản phẩm" />
                <Tab label="Thông số kỹ thuật" />
                <Tab label={`Đánh giá (${currentProduct.total_reviews > 0 ? currentProduct.total_reviews : (3 + (currentProduct.id % 5))})`} />
              </Tabs>

              <Box sx={{ py: 2 }}>
                {tabValue === 0 && (
                  <Box sx={{ maxWidth: '100%' }}>
                    {/* Product Images Gallery */}
                    {(() => {
                      console.log('Current Product:', currentProduct);
                      console.log('Images:', currentProduct.images);
                      console.log('Images length:', currentProduct.images?.length);
                      return null;
                    })()}
                    
                    {currentProduct.images && currentProduct.images.length > 0 ? (
                      <Box sx={{ mb: 3 }}>
                        <Grid container spacing={2}>
                          {currentProduct.images.slice(0, 1).map((image, index) => (
                            <Grid item xs={12} key={image.id || index}>
                              <Box
                                component="img"
                                src={getImageUrl(image.path)}
                                alt={currentProduct.name}
                                onError={(e) => {
                                  console.log('Image load error:', image);
                                  e.target.onerror = null;
                                  e.target.src = getImageUrl(currentProduct.thumbnail);
                                }}
                                sx={{
                                  width: '100%',
                                  height: 350,
                                  objectFit: 'cover',
                                  borderRadius: 2,
                                  border: '1px solid #e0e0e0',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s',
                                  '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  },
                                }}
                                onClick={() => setSelectedImage(index)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ) : (
                      <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3cd', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có hình ảnh chi tiết cho sản phẩm này
                        </Typography>
                      </Box>
                    )}

                    {/* Product Description */}
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-line', 
                        lineHeight: 1.8,
                        color: '#424242',
                        fontSize: '14px',
                        '& p': {
                          mb: 2,
                        },
                        '& img': {
                          maxWidth: '100%',
                          height: 'auto',
                          borderRadius: 2,
                          my: 2,
                        },
                      }}
                      dangerouslySetInnerHTML={{ __html: currentProduct.description || 'Chưa có mô tả' }}
                    />
                  </Box>
                )}

                {tabValue === 1 && (
                  <Grid container spacing={2}>
                    {currentProduct.attributes && (() => {
                      // Parse attributes string into lines
                      const attributesText = typeof currentProduct.attributes === 'string' 
                        ? currentProduct.attributes 
                        : JSON.stringify(currentProduct.attributes);
                      const lines = attributesText.split('\n').filter(line => line.trim());
                      
                      return lines.map((line, index) => {
                        const [label, ...valueParts] = line.split(':');
                        const value = valueParts.join(':').trim();
                        
                        return (
                          <Grid item xs={12} key={index}>
                            <Stack 
                              direction="row" 
                              justifyContent="space-between" 
                              sx={{ 
                                py: 1.5, 
                                px: 2,
                                borderBottom: '1px solid #f0f0f0',
                                '&:hover': {
                                  bgcolor: '#fafafa',
                                  borderRadius: 1,
                                },
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {label.trim()}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="#1a1a1a">
                                {value}
                              </Typography>
                            </Stack>
                          </Grid>
                        );
                      });
                    })()}
                  </Grid>
                )}

                {tabValue === 2 && (
                  <ProductReviews
                    productId={id}
                    isAuthenticated={isAuthenticated}
                    userId={user?.id}
                  />
                )}
              </Box>
            </Box>
          </Grid>

        {/* Right Column - Product Info */}
        <Grid item xs={12} md={6}>
          <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: { xs: 2, md: 3 }, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {/* Category & Name */}
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={currentProduct.category?.name || 'Sản phẩm điện tử'} 
                size="small" 
                sx={{ 
                  mb: 2,
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                  fontWeight: 600,
                }}
              />
              <Typography 
                variant="h4" 
                gutterBottom 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '22px', sm: '26px', md: '30px' }, 
                  mb: 2,
                  lineHeight: 1.3,
                  color: '#1a1a1a',
                }}
              >
                {currentProduct.name}
              </Typography>
            </Box>

            {/* Rating & Sold Count */}
            <Stack direction="row" alignItems="center" spacing={2} mb={3} sx={{ pb: 2, borderBottom: '1px solid #f0f0f0' }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = currentProduct.rating > 0 ? currentProduct.rating : (4 + (currentProduct.id % 10) / 10);
                  return (
                    <Star 
                      key={star} 
                      sx={{ 
                        color: star <= Math.round(rating) ? '#ffc107' : '#e0e0e0', 
                        fontSize: 20 
                      }} 
                    />
                  );
                })}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                ({currentProduct.rating > 0 
                  ? currentProduct.rating.toFixed(1) 
                  : (4 + (currentProduct.id % 10) / 10).toFixed(1)})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>|</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Đã bán {currentProduct.sold_count || (currentProduct.id % 100) + 10}
              </Typography>
            </Stack>

            {/* Price Section */}
            <Box sx={{ 
              bgcolor: '#fff3e0', 
              borderRadius: 3, 
              p: 2.5, 
              mb: 3,
              border: '1px solid #ffe0b2',
            }}>
              {discount > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Chip
                    label={`🔥 GIẢM ${discount}%`}
                    sx={{
                      bgcolor: '#ff1744',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      height: 28,
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" color="error" fontWeight="bold" sx={{ fontSize: '13px' }}>
                    Tiết kiệm: {formatCurrency(basePrice - effectivePrice)}
                  </Typography>
                </Box>
              )}
              <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap">
                {/* Giá sau khuyến mãi (hoặc giá bán nếu không có KM) */}
                <Typography 
                  variant="h3" 
                  color="#d32f2f" 
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '28px', sm: '32px', md: '40px' } }}
                >
                  {formatCurrency(effectivePrice)}
                </Typography>
                {/* Giá gốc gạch ngang (chỉ hiển thị khi có khuyến mãi) */}
                {hasPromotion && basePrice > effectivePrice && (
                  <Typography
                    variant="h6"
                    sx={{ 
                      textDecoration: 'line-through', 
                      color: '#999',
                      fontSize: { xs: '18px', md: '22px' },
                    }}
                  >
                    {formatCurrency(basePrice)}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Stock Info */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                  Tình trạng kho
                </Typography>
                {currentProduct.status !== 'discontinued' && currentProduct.quantity > 0 && (
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    Còn hàng
                  </Typography>
                )}
              </Box>
              {currentProduct.status === 'discontinued' ? (
                <Chip 
                  icon={<Warning />} 
                  label="Ngừng kinh doanh" 
                  sx={{ 
                    fontWeight: 600,
                    bgcolor: '#9e9e9e',
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                  size="small"
                />
              ) : currentProduct.quantity > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    icon={<CheckCircle />} 
                    label={`Còn ${currentProduct.quantity} sản phẩm`} 
                    color="success" 
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((currentProduct.quantity / 100) * 100, 100)} 
                    sx={{ 
                      flex: 1, 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: '#e8f5e9',
                    }}
                    color="success"
                  />
                </Box>
              ) : (
                <Box>
                  <Chip 
                    icon={<Warning />} 
                    label="Hết hàng" 
                    color="error"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600, mb: 2 }}
                  />
                  {/* Stock Alert Button */}
                  <StockAlertButton 
                    productId={currentProduct.id} 
                    productName={currentProduct.name}
                  />
                </Box>
              )}
            </Box>

            {/* SKU */}
            <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
              <Typography variant="body2" color="text.secondary">
                Mã sản phẩm: <strong style={{ color: '#1a1a1a' }}>{currentProduct.sku || 'N/A'}</strong>
              </Typography>
            </Box>

            {/* Quantity Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
                Số lượng
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <motion.div whileHover={currentProduct.status !== 'discontinued' && currentProduct.quantity > 0 ? { scale: 1.1 } : {}} whileTap={currentProduct.status !== 'discontinued' && currentProduct.quantity > 0 ? { scale: 0.9 } : {}}>
                  <Button
                    variant="outlined"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={currentProduct.status === 'discontinued' || currentProduct.quantity === 0 || quantity <= 1}
                    sx={{ 
                      minWidth: 44,
                      height: 44,
                      borderColor: '#d32f2f',
                      color: '#d32f2f',
                      '&:hover': {
                        borderColor: '#b71c1c',
                        bgcolor: '#ffebee',
                      },
                      '&:disabled': {
                        borderColor: '#e0e0e0',
                        color: '#bdbdbd',
                      },
                    }}
                  >
                    <Remove />
                  </Button>
                </motion.div>
                <TextField
                  type="number"
                  value={currentProduct.status === 'discontinued' || currentProduct.quantity === 0 ? 0 : quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: currentProduct.status === 'discontinued' || currentProduct.quantity === 0 ? 0 : 1, max: currentProduct.quantity }}
                  disabled={currentProduct.status === 'discontinued' || currentProduct.quantity === 0}
                  sx={{ 
                    width: 90, 
                    '& input': { 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                    },
                  }}
                  size="small"
                />
                <motion.div whileHover={currentProduct.status !== 'discontinued' && currentProduct.quantity > 0 ? { scale: 1.1 } : {}} whileTap={currentProduct.status !== 'discontinued' && currentProduct.quantity > 0 ? { scale: 0.9 } : {}}>
                  <Button
                    variant="outlined"
                    onClick={() => setQuantity(Math.min(currentProduct.quantity, quantity + 1))}
                    disabled={currentProduct.status === 'discontinued' || currentProduct.quantity === 0 || quantity >= currentProduct.quantity}
                    sx={{ 
                      minWidth: 44,
                      height: 44,
                      borderColor: '#d32f2f',
                      color: '#d32f2f',
                      '&:hover': {
                        borderColor: '#b71c1c',
                        bgcolor: '#ffebee',
                      },
                      '&:disabled': {
                        borderColor: '#e0e0e0',
                        color: '#bdbdbd',
                      },
                    }}
                  >
                    <Add />
                  </Button>
                </motion.div>
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Stack spacing={2} sx={{ mb: 3 }}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleBuyNow}
                  disabled={currentProduct.status === 'discontinued' || currentProduct.quantity === 0 || isBuyingNow}
                  fullWidth
                  sx={{
                    bgcolor: '#d32f2f',
                    '&:hover': { 
                      bgcolor: '#b71c1c',
                      boxShadow: '0 4px 12px rgba(211,47,47,0.4)',
                    },
                    py: 1.75,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '16px',
                    borderRadius: 2,
                  }}
                  startIcon={isBuyingNow ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <ShoppingCart />}
                >
                  {isBuyingNow ? 'Đang xử lý...' : 'MUA NGAY'}
                </Button>
              </motion.div>
              
              <Stack direction="row" spacing={1.5}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ flex: 1 }}
                >
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleAddToCart}
                    disabled={currentProduct.status === 'discontinued' || currentProduct.quantity === 0 || isAddingToCart}
                    fullWidth
                    sx={{
                      borderColor: '#d32f2f',
                      borderWidth: 2,
                      color: '#d32f2f',
                      '&:hover': { 
                        borderColor: '#b71c1c', 
                        bgcolor: '#ffebee',
                        borderWidth: 2,
                      },
                      py: 1.5,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      fontSize: '15px',
                      borderRadius: 2,
                    }}
                    startIcon={isAddingToCart ? <CircularProgress size={20} sx={{ color: '#d32f2f' }} /> : <ShoppingCart />}
                  >
                    {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    onClick={() => setIsFavorite(!isFavorite)}
                    sx={{
                      border: '2px solid #e0e0e0',
                      color: isFavorite ? '#d32f2f' : '#666',
                      bgcolor: isFavorite ? '#ffebee' : '#fff',
                      '&:hover': { 
                        borderColor: '#d32f2f',
                        bgcolor: '#ffebee',
                      },
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Favorite sx={{ fontSize: 24 }} />
                  </IconButton>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    sx={{
                      border: '2px solid #e0e0e0',
                      color: '#666',
                      '&:hover': { 
                        borderColor: '#d32f2f',
                        bgcolor: '#ffebee',
                      },
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                    }}
                  >
                    <Share sx={{ fontSize: 24 }} />
                  </IconButton>
                </motion.div>
              </Stack>
            </Stack>

            {/* Policy Boxes */}
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box sx={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: 2, 
                  p: 2,
                  textAlign: 'center',
                  bgcolor: '#fafafa',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    bgcolor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  },
                }}>
                  <LocalShipping sx={{ color: '#1976d2', fontSize: 28, mb: 0.5 }} />
                  <Typography variant="body2" display="block" fontWeight="bold" sx={{ mb: 0.5 }}>
                    Giao hàng
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Miễn phí
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: 2, 
                  p: 2,
                  textAlign: 'center',
                  bgcolor: '#fafafa',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    bgcolor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  },
                }}>
                  <Security sx={{ color: '#388e3c', fontSize: 28, mb: 0.5 }} />
                  <Typography variant="body2" display="block" fontWeight="bold" sx={{ mb: 0.5 }}>
                    Thanh toán
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    An toàn
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: 2, 
                  p: 2,
                  textAlign: 'center',
                  bgcolor: '#fafafa',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    bgcolor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  },
                }}>
                  <Refresh sx={{ color: '#f57c00', fontSize: 28, mb: 0.5 }} />
                  <Typography variant="body2" display="block" fontWeight="bold" sx={{ mb: 0.5 }}>
                    Đổi trả
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    7 ngày
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: 2, 
                  p: 2,
                  textAlign: 'center',
                  bgcolor: '#fafafa',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    bgcolor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  },
                }}>
                  <Phone sx={{ color: '#7b1fa2', fontSize: 28, mb: 0.5 }} />
                  <Typography variant="body2" display="block" fontWeight="bold" sx={{ mb: 0.5 }}>
                    Hỗ trợ
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    1900 1599
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Specifications - Highlighted */}
            {currentProduct.attributes && (() => {
              const attributesText = typeof currentProduct.attributes === 'string' 
                ? currentProduct.attributes 
                : JSON.stringify(currentProduct.attributes);
              const lines = attributesText.split('\n').filter(line => line.trim());
              return lines.length > 0;
            })() && (
              <Card elevation={0} sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 2, 
                overflow: 'hidden',
                mb: 3,
              }}>
                <Box sx={{ 
                  bgcolor: '#f5f5f5', 
                  px: 2.5, 
                  py: 1.5,
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <Typography variant="h6" fontWeight="600" sx={{ fontSize: '16px', color: '#1a1a1a' }}>
                    Thông số kỹ thuật nổi bật
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: '#fff' }}>
                  {(() => {
                    const attributesText = typeof currentProduct.attributes === 'string' 
                      ? currentProduct.attributes 
                      : JSON.stringify(currentProduct.attributes);
                    const lines = attributesText.split('\n').filter(line => line.trim());
                    
                    return lines.map((line, index) => {
                      const [label, ...valueParts] = line.split(':');
                      const value = valueParts.join(':').trim();
                      
                      return (
                    <Box 
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2.5,
                        py: 1.75,
                        borderBottom: index < lines.length - 1 ? '1px solid #f0f0f0' : 'none',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          bgcolor: '#fafafa',
                        },
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666',
                          fontSize: '14px',
                          minWidth: '120px',
                          flexShrink: 0,
                        }}
                      >
                        {label.trim()}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#1a1a1a',
                          fontSize: '14px',
                          fontWeight: 500,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {value}
                      </Typography>
                    </Box>
                      );
                    });
                  })()}
                </Box>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <Box sx={{ mt: { xs: 6, md: 8 }, mb: 4 }}>
          <Typography 
            variant="h5" 
            fontWeight="bold" 
            gutterBottom 
            mb={4}
            sx={{
              fontSize: { xs: '22px', md: '28px' },
              color: '#1a1a1a',
              position: 'relative',
              pb: 2,
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 60,
                height: 3,
                bgcolor: '#d32f2f',
                borderRadius: 2,
              },
            }}
          >
            Sản phẩm liên quan
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3, md: 3 }}>
            {relatedProducts.map((product) => (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      </Container>
    </Box>
  )
}

export default ProductDetail
