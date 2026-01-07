import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Favorite,
  Delete,
  ShoppingCart,
  ArrowBack,
} from '@mui/icons-material'
import { wishlistApi } from '../../services/api'
import { favoritesService } from '../../services/favoritesService'
import ProductCard from '../../components/common/ProductCard'
import { pageVariants, fadeIn } from '../../utils/animations'
import { toast } from 'react-toastify'

const Wishlist = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const queryClient = useQueryClient()

  // Sync LocalStorage to Backend when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      const localFavorites = favoritesService.getFavorites()
      if (localFavorites.length > 0) {
        // Sync to backend
        wishlistApi.sync(localFavorites)
          .then(() => {
            // Clear LocalStorage after sync
            favoritesService.clearFavorites()
            // Refetch wishlist
            queryClient.invalidateQueries(['wishlist'])
          })
          .catch(err => {
            console.error('Failed to sync wishlist:', err)
          })
      }
    }
  }, [isAuthenticated, queryClient])

  // Fetch wishlist from backend
  const { data: wishlistData, isLoading, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!isAuthenticated) {
        // If not authenticated, use LocalStorage
        const localFavorites = favoritesService.getFavorites()
        // Fetch products from LocalStorage (fallback)
        return { data: [], total: localFavorites.length }
      }
      
      const response = await wishlistApi.getAll()
      return response.data
    },
    enabled: true,
    staleTime: 0, // ❌ Không cache
    gcTime: 0, // ❌ Không giữ cache
  })

  // Remove from wishlist mutation
  const removeMutation = useMutation({
    mutationFn: (productId) => wishlistApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist'])
      toast.success('Đã xóa khỏi danh sách yêu thích')
    },
    onError: () => {
      toast.error('Không thể xóa sản phẩm')
    },
  })

  // Clear all mutation
  const clearMutation = useMutation({
    mutationFn: () => wishlistApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist'])
      toast.success('Đã xóa tất cả sản phẩm yêu thích')
    },
    onError: () => {
      toast.error('Không thể xóa danh sách')
    },
  })

  const handleRemoveFavorite = (productId) => {
    if (isAuthenticated) {
      removeMutation.mutate(productId)
    } else {
      favoritesService.removeFavorite(productId)
      window.dispatchEvent(new Event('favoritesUpdated'))
      toast.success('Đã xóa khỏi danh sách yêu thích')
      refetch()
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm yêu thích?')) {
      if (isAuthenticated) {
        clearMutation.mutate()
      } else {
        favoritesService.clearFavorites()
        window.dispatchEvent(new Event('favoritesUpdated'))
        toast.success('Đã xóa tất cả sản phẩm yêu thích')
        refetch()
      }
    }
  }

  // Get wishlist items
  const wishlistItems = wishlistData?.data || []
  const totalItems = wishlistData?.total || 0

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2, color: '#e63946' }}
          >
            Quay lại
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                <Favorite sx={{ color: '#e63946', mr: 1, verticalAlign: 'middle' }} />
                Danh sách yêu thích
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalItems > 0
                  ? `Bạn có ${totalItems} sản phẩm yêu thích`
                  : 'Chưa có sản phẩm yêu thích'}
              </Typography>
            </Box>
            {totalItems > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleClearAll}
              >
                Xóa tất cả
              </Button>
            )}
          </Box>
        </Box>

        {/* Loading */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && totalItems === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            variants={fadeIn}
          >
            <Card sx={{ textAlign: 'center', py: 8, bgcolor: '#f8f9fa' }}>
              <CardContent>
                <Favorite sx={{ fontSize: 80, color: '#ddd', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Danh sách yêu thích trống
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Hãy thêm sản phẩm vào danh sách yêu thích để xem lại sau
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/products')}
                  sx={{
                    bgcolor: '#e63946',
                    '&:hover': { bgcolor: '#d62839' },
                    px: 4,
                  }}
                >
                  Mua sắm ngay
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Products Grid */}
        {!isLoading && wishlistItems.length > 0 && (
          <Grid container spacing={3}>
            {wishlistItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.product.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <ProductCard product={item.product} />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFavorite(item.product.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255,255,255,0.95)',
                        '&:hover': { bgcolor: 'rgba(230,57,70,0.1)' },
                        zIndex: 10,
                      }}
                    >
                      <Delete sx={{ fontSize: 18, color: '#e63946' }} />
                    </IconButton>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </motion.div>
  )
}

export default Wishlist

