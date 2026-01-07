import { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
} from '@mui/material'
import { Favorite, Share, AddShoppingCart } from '@mui/icons-material'
import { addToCart } from '../../store/slices/cartSlice'
import { formatCurrency, calculateDiscount, getImageUrl } from '../../services/utils'
import Modal from '../common/Modal'
import { toast } from 'react-toastify'

const QuickViewModal = ({ open, onClose, product }) => {
  const [quantity, setQuantity] = useState(1)
  const dispatch = useDispatch()

  if (!product) return null

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ path: product.thumbnail || '/placeholder.jpg' }]
  
  // ✅ ĐÚNG: Chỉ hiển thị giá bán và giá sau khuyến mãi cho khách hàng
  const hasPromotion = product.has_active_promotion === true
  const basePrice = product.price // Giá bán gốc (giá niêm yết)
  const effectivePrice = product.effective_price ?? product.price // Giá sau khuyến mãi
  const discount = hasPromotion && basePrice > effectivePrice
    ? calculateDiscount(basePrice, effectivePrice)
    : 0

  const handleAddToCart = async () => {
    // Kiểm tra tồn kho trước
    if (quantity > product.quantity) {
      toast.error(`Chỉ còn ${product.quantity} sản phẩm trong kho`)
      return
    }
    
    const result = await dispatch(addToCart({ productId: product.id, quantity }))
    if (addToCart.fulfilled.match(result)) {
      toast.success('Đã thêm vào giỏ hàng')
      onClose() // Đóng modal sau khi thêm thành công
    } else {
      toast.error(result.payload || 'Không thể thêm vào giỏ hàng')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={product.name} maxWidth="md">
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Box
            component="img"
            src={getImageUrl(images[0]?.path || product.thumbnail)}
            alt={product.name}
            sx={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 2 }}
          />
        </Box>

        <Box sx={{ flex: 1 }}>
          {discount > 0 && (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              Giảm {discount}%
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {formatCurrency(effectivePrice)}
            </Typography>
            {hasPromotion && basePrice > effectivePrice && (
              <Typography
                variant="h6"
                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
              >
                {formatCurrency(basePrice)}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              type="number"
              label="Số lượng"
              value={product.quantity === 0 ? 0 : quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: product.quantity === 0 ? 0 : 1, max: product.quantity }}
              disabled={product.quantity === 0}
              sx={{ width: 100 }}
              size="small"
            />
            <Typography variant="body2" color={product.quantity === 0 ? "error" : "text.secondary"}>
              {product.quantity === 0 ? "Hết hàng" : `Còn lại: ${product.quantity}`}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddShoppingCart />}
              onClick={handleAddToCart}
              fullWidth
              disabled={product.quantity === 0}
            >
              Thêm vào giỏ
            </Button>
            <IconButton>
              <Favorite />
            </IconButton>
            <IconButton>
              <Share />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary">
            {product.description}
          </Typography>
        </Box>
      </Box>
    </Modal>
  )
}

export default QuickViewModal

