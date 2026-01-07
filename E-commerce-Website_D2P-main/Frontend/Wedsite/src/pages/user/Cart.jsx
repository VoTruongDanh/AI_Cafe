import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { usePolling } from '../../hooks/usePolling'
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  Grid,
  CircularProgress,
} from '@mui/material'
import { Delete as DeleteIcon, Add, Remove, ShoppingCart } from '@mui/icons-material'
import { fetchCart, updateCartItem, removeFromCart } from '../../store/slices/cartSlice'
import { formatCurrency, getImageUrl } from '../../services/utils'
import { pageVariants, staggerContainer, staggerItem, fadeIn, scaleIn } from '../../utils/animations'
import { withLoading } from '../../utils/loadingHelper'
import { toast } from 'react-toastify'

const Cart = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, isLoading } = useSelector((state) => state.cart)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [removingItems, setRemovingItems] = useState(new Set())
  const [updatingItems, setUpdatingItems] = useState(new Set())

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart())
    }
  }, [dispatch, isAuthenticated])

  // ✅ THÊM POLLING CHO CART - Auto-refresh giá và tồn kho mỗi 10 giây
  usePolling(async () => {
    if (isAuthenticated) {
      try {
        await dispatch(fetchCart())
      } catch (error) {
        console.error('Failed to refresh cart:', error)
      }
    }
  }, 10000)  // 10 giây

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return
    
    // Tìm item trong giỏ để kiểm tra tồn kho
    const item = items.find(i => i.id === itemId)
    if (!item) return
    
    // Kiểm tra tồn kho trước khi gửi request
    if (item.product && newQuantity > item.product.quantity) {
      toast.error(`Chỉ còn ${item.product.quantity} sản phẩm trong kho`)
      return
    }
    
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await withLoading(async () => {
        const result = await dispatch(updateCartItem({ itemId, quantity: newQuantity }))
        if (updateCartItem.rejected.match(result)) {
          toast.error(result.payload || 'Cập nhật thất bại')
        }
        await dispatch(fetchCart())
      })
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (itemId) => {
    setRemovingItems(prev => new Set(prev).add(itemId))
    try {
      await withLoading(async () => {
        await dispatch(removeFromCart(itemId))
        await dispatch(fetchCart())
      })
      toast.success('Đã xóa sản phẩm')
    } catch (error) {
      toast.error('Xóa sản phẩm thất bại')
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const total = items.reduce((sum, item) => {
    if (!item?.product?.price || !item?.quantity) return sum
    return sum + (item.product.price * item.quantity)
  }, 0)

  if (!isAuthenticated) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        variants={pageVariants}
      >
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Typography variant="h5" gutterBottom>
              Vui lòng đăng nhập để xem giỏ hàng
            </Typography>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="contained" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      </motion.div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        variants={pageVariants}
      >
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              <ShoppingCart
                sx={{
                  fontSize: 80,
                  color: '#e0e0e0',
                  mb: 2,
                }}
              />
            </motion.div>
            <Typography variant="h5" gutterBottom>
              Giỏ hàng của bạn đang trống
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </Typography>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="contained" onClick={() => navigate('/products')}>
                Mua sắm ngay
              </Button>
            </motion.div>
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Giỏ hàng của bạn
          </Typography>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ width: '100%' }}
        >
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={8}>
              <AnimatePresence mode="popLayout">
                {items.filter(item => item?.product).map((item, index) => {
                  const isRemoving = removingItems.has(item.id)
                  const isUpdating = updatingItems.has(item.id)
                  
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      variants={staggerItem}
                      initial="initial"
                      animate={isRemoving ? "exit" : "animate"}
                      exit={{ opacity: 0, x: -100, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        whileHover={{ y: -4, scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          sx={{
                            mb: 2,
                            opacity: isRemoving ? 0.5 : 1,
                            transition: 'opacity 0.3s',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            },
                          }}
                        >
                          {isUpdating && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                zIndex: 1,
                              }}
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 0.3 }}
                                style={{
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #1976d2 0%, #e63946 100%)',
                                }}
                              />
                            </Box>
                          )}
                          <CardContent>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Box
                                  component="img"
                                  src={getImageUrl(
                                    item.product.thumbnail ||
                                    item.product.images?.[0]?.path ||
                                    item.product.image_url
                                  )}
                                  alt={item.product.name}
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/120x120?text=No+Image'
                                  }}
                                  sx={{
                                    width: 120,
                                    height: 120,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => navigate(`/products/${item.product.id}`)}
                                />
                              </motion.div>
                              <Box sx={{ flexGrow: 1 }}>
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                      cursor: 'pointer',
                                      '&:hover': { color: 'primary.main' },
                                    }}
                                    onClick={() => navigate(`/products/${item.product.id}`)}
                                  >
                                    {item.product.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                    {formatCurrency(item.product.price)}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                        disabled={isUpdating}
                                      >
                                        <Remove />
                                      </IconButton>
                                    </motion.div>
                                    <TextField
                                      value={item.quantity}
                                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                      inputProps={{ min: 1 }}
                                      sx={{ width: 60 }}
                                      size="small"
                                      disabled={isUpdating}
                                    />
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                        disabled={isUpdating}
                                      >
                                        <Add />
                                      </IconButton>
                                    </motion.div>
                                    {isUpdating && (
                                      <CircularProgress size={16} sx={{ ml: 1 }} />
                                    )}
                                  </Box>
                                  <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                                    Tổng: {formatCurrency(item.product.price * item.quantity)}
                                  </Typography>
                                </motion.div>
                              </Box>
                              <Box>
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 15 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <IconButton
                                    color="error"
                                    onClick={() => handleRemoveItem(item.id)}
                                    disabled={isRemoving || isUpdating}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </motion.div>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    sx={{
                      position: 'sticky',
                      top: 20,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <CardContent>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Typography variant="h6" gutterBottom>
                          Tổng đơn hàng
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography>Tạm tính:</Typography>
                          <motion.div
                            key={total}
                            initial={{ scale: 1.2, color: '#1976d2' }}
                            animate={{ scale: 1, color: 'inherit' }}
                            transition={{ duration: 0.3 }}
                          >
                            <Typography>{formatCurrency(total)}</Typography>
                          </motion.div>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography>Phí vận chuyển:</Typography>
                          <Typography color="success.main" fontWeight="bold">
                            Miễn phí
                          </Typography>
                        </Box>
                        <Box sx={{ borderTop: '1px solid #eee', pt: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6">Tổng cộng:</Typography>
                            <motion.div
                              key={total}
                              initial={{ scale: 1.3, color: '#e63946' }}
                              animate={{ scale: 1, color: 'inherit' }}
                              transition={{ duration: 0.4 }}
                            >
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                {formatCurrency(total)}
                              </Typography>
                            </motion.div>
                          </Box>
                        </Box>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={() => navigate('/checkout')}
                            sx={{
                              py: 1.5,
                              fontSize: '1rem',
                              fontWeight: 600,
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                              '&:hover': {
                                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                              },
                            }}
                          >
                            Thanh toán
                          </Button>
                        </motion.div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </motion.div>
  )
}

export default Cart

