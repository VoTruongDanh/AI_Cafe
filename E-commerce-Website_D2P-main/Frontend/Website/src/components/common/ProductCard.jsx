import { useState, useEffect } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Button,
  Rating,
} from '@mui/material'
import { 
  Favorite, 
  FavoriteBorder,
  AddShoppingCart, 
  LocalShipping,
  Verified,
  Compare as CompareIcon,
} from '@mui/icons-material'
import { addToCart } from '../../store/slices/cartSlice'
import { addToCompare } from '../../store/slices/compareSlice'
import { formatCurrency, calculateDiscount, getImageUrl } from '../../services/utils'
import { favoritesService } from '../../services/favoritesService'
import { wishlistApi } from '../../services/api'
import { fadeIn, hoverLift, scaleIn } from '../../utils/animations'
import { toast } from 'react-toastify'

const ProductCard = ({ product }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(favoritesService.isFavorite(product.id))

  useEffect(() => {
    setIsFavorite(favoritesService.isFavorite(product.id))
  }, [product.id])

  const handleAddToCart = async (e) => {
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua hàng')
      // Lưu URL hiện tại để quay lại sau khi đăng nhập
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }

    const result = await dispatch(addToCart({ productId: product.id, quantity: 1 }))
    if (addToCart.fulfilled.match(result)) {
      toast.success('✓ Đã thêm vào giỏ hàng')
    } else {
      // Hiển thị lỗi từ backend
      toast.error(result.payload || 'Không thể thêm vào giỏ hàng')
    }
  }

  const handleToggleFavorite = async (e) => {
    e.stopPropagation()
    const newFavoriteState = !isFavorite
    setIsFavorite(newFavoriteState)
    
    try {
      if (isAuthenticated) {
        // Use backend API
        if (newFavoriteState) {
          await wishlistApi.add(product.id)
          toast.success('Đã thêm vào yêu thích')
        } else {
          await wishlistApi.remove(product.id)
          toast.success('Đã xóa khỏi yêu thích')
        }
      } else {
        // Use LocalStorage for guests
        if (newFavoriteState) {
          favoritesService.addFavorite(product.id)
          toast.success('Đã thêm vào yêu thích')
        } else {
          favoritesService.removeFavorite(product.id)
          toast.success('Đã xóa khỏi yêu thích')
        }
      }
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('favoritesUpdated'))
    } catch (error) {
      // Revert state on error
      setIsFavorite(!newFavoriteState)
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    }
  }

  const handleAddToCompare = (e) => {
    e.stopPropagation()
    const result = dispatch(addToCompare(product))
    if (result.payload) {
      toast.success('Đã thêm vào so sánh')
    } else {
      toast.error(result.error?.message || 'Không thể thêm vào so sánh')
    }
  }

  // ✅ ĐÚNG: Chỉ hiển thị giá bán và giá sau khuyến mãi cho khách hàng
  // original_price = giá nhập (KHÔNG hiển thị cho khách, chỉ dùng nội bộ tính lợi nhuận)
  const basePrice = product.price // Giá bán gốc (giá niêm yết)
  const effectivePrice = product.effective_price ?? product.price // Giá sau khuyến mãi (nếu có)
  
  // Kiểm tra có khuyến mãi active không
  const hasPromotion = product.has_active_promotion === true
  
  // Giá cuối cùng hiển thị
  const finalPrice = effectivePrice
  
  // Tính % giảm giá: Chỉ khi có khuyến mãi và giá sau KM < giá bán gốc
  const discount = hasPromotion && basePrice > finalPrice 
    ? calculateDiscount(basePrice, finalPrice) 
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -8 }}
      style={{ height: '100%' }}
    >
      <Card
        elevation={0}
        sx={{
          height: '100%',
          cursor: 'pointer',
          position: 'relative',
          border: '1px solid #e8e8e8',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#fff',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 32px rgba(230,57,70,0.18)',
            borderColor: '#e63946',
          },
        }}
        onClick={() => navigate(`/products/${product.id}`)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Badges Container */}
      <Box sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Discontinued Badge - Ngừng kinh doanh */}
          {product.status === 'discontinued' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <Chip
                label="Ngừng kinh doanh"
                sx={{
                  bgcolor: '#9e9e9e',
                  color: 'white',
                  fontWeight: 'bold',
                  height: 28,
                  fontSize: '12px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  '& .MuiChip-label': { px: 1.5 }
                }}
              />
            </motion.div>
          )}
          {/* Discount Badge */}
          {discount > 0 && product.status !== 'discontinued' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <Chip
                label={`-${discount}%`}
                sx={{
                  bgcolor: '#e63946',
                  color: 'white',
                  fontWeight: 'bold',
                  height: 28,
                  fontSize: '12px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(230,57,70,0.4)',
                  '& .MuiChip-label': { px: 1.5 }
                }}
              />
            </motion.div>
          )}
          {/* Hot/New Badge */}
          {product.is_new && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            >
              <Chip
                label="MỚI"
                sx={{
                  bgcolor: '#00bcd4',
                  color: 'white',
                  fontWeight: 'bold',
                  height: 24,
                  fontSize: '11px',
                  borderRadius: '4px',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </motion.div>
          )}
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Compare Icon */}
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <IconButton
              size="small"
              onClick={handleAddToCompare}
              sx={{
                bgcolor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(4px)',
                width: 32,
                height: 32,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <CompareIcon sx={{ fontSize: 18, color: '#2196f3' }} />
            </IconButton>
          </motion.div>

          {/* Favorite Icon */}
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <IconButton
              size="small"
              onClick={handleToggleFavorite}
              sx={{
                bgcolor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(4px)',
                width: 32,
                height: 32,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <motion.div
                animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isFavorite ? (
                  <Favorite sx={{ fontSize: 18, color: '#e63946' }} />
                ) : (
                  <FavoriteBorder sx={{ fontSize: 18, color: '#666' }} />
                )}
              </motion.div>
            </IconButton>
          </motion.div>
        </Box>
      </Box>



      {/* Product Image Container */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: '#fafafa',
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <motion.div
          animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <CardMedia
            component="img"
            image={getImageUrl(
              product.thumbnail || 
              product.images?.[0]?.path || 
              product.image_url
            )}
            alt={product.name}
            loading="lazy"
            sx={{
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
        </motion.div>

        {/* Quick Add Button - NguyenKim Style */}
        {isHovered && product.quantity > 0 && product.status !== 'discontinued' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(8px)',
                borderTop: '1px solid rgba(230,57,70,0.1)',
              }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddShoppingCart />}
                  onClick={handleAddToCart}
                  sx={{
                    bgcolor: '#e63946',
                    '&:hover': { bgcolor: '#d62839' },
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '13px',
                    py: 1,
                    borderRadius: 1.5,
                    boxShadow: '0 4px 12px rgba(230,57,70,0.3)',
                  }}
                >
                  Thêm vào giỏ hàng
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        )}
      </Box>

      <CardContent sx={{ p: 2 }}>
        {/* Product Name */}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: 40,
            fontSize: '14px',
            lineHeight: 1.4,
            color: '#333',
            '&:hover': {
              color: '#e63946',
            }
          }}
        >
          {product.name}
        </Typography>

        {/* Rating - Hiển thị đánh giá (tự động tạo nếu chưa có) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Rating 
            value={product.rating > 0 ? product.rating : (4 + (product.id % 10) / 10)} 
            precision={0.5} 
            size="small" 
            readOnly 
            sx={{ fontSize: '14px' }}
          />
        </Box>

        {/* Price Section */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
            {/* Giá sau khuyến mãi (hoặc giá bán nếu không có KM) */}
            <Typography
              variant="h6"
              sx={{
                color: '#e63946',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              {formatCurrency(finalPrice)}
            </Typography>
            {/* Giá gốc gạch ngang (chỉ hiển thị khi có khuyến mãi) */}
            {hasPromotion && basePrice > finalPrice && (
              <Typography
                variant="body2"
                sx={{
                  textDecoration: 'line-through',
                  color: '#999',
                  fontSize: '0.875rem',
                }}
              >
                {formatCurrency(basePrice)}
              </Typography>
            )}
          </Box>

          {/* Số tiền tiết kiệm */}
          {hasPromotion && basePrice > finalPrice && (
            <Typography variant="caption" sx={{ color: '#666', fontSize: '11px', display: 'block' }}>
              Tiết kiệm: {formatCurrency(basePrice - finalPrice)}
            </Typography>
          )}
        </Box>

        {/* Features/Benefits */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocalShipping sx={{ fontSize: 14, color: product.quantity > 0 ? '#4caf50' : '#bdbdbd' }} />
            <Typography variant="caption" sx={{ fontSize: '11px', color: product.quantity > 0 ? '#666' : '#bdbdbd' }}>
              Giao hàng nhanh 2h
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Verified sx={{ fontSize: 14, color: '#2196f3' }} />
            <Typography variant="caption" sx={{ fontSize: '11px', color: '#666' }}>
              Chính hãng, bảo hành 12 tháng
            </Typography>
          </Box>
        </Box>

        {/* Stock Status */}
        <Box 
          sx={{ 
            mt: 1.5,
            pt: 1.5,
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="caption" sx={{ 
            fontSize: '11px', 
            color: product.status === 'discontinued' ? '#9e9e9e' : (product.quantity === 0 ? '#e63946' : (product.quantity < 5 ? '#ff6b6b' : '#4caf50')),
            fontWeight: 600 
          }}>
            {product.status === 'discontinued'
              ? '⛔ Ngừng kinh doanh'
              : (product.quantity === 0 
                ? '✗ Hết hàng' 
                : (product.quantity < 5 ? `⚠️ Chỉ còn ${product.quantity} sản phẩm` : '✓ Còn hàng'))}
          </Typography>
        </Box>
      </CardContent>
    </Card>
    </motion.div>
  )
}

// ✅ OPTIMIZATION: React.memo để tránh re-render không cần thiết
// Chỉ re-render khi product.id, price, quantity, hoặc favorite status thay đổi
export default React.memo(ProductCard, (prevProps, nextProps) => {
  const prev = prevProps.product
  const next = nextProps.product
  
  // Chỉ re-render khi các thuộc tính quan trọng thay đổi
  return (
    prev.id === next.id &&
    prev.price === next.price &&
    prev.effective_price === next.effective_price &&
    prev.quantity === next.quantity &&
    prev.status === next.status &&
    prev.has_active_promotion === next.has_active_promotion
  )
})

