import { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Favorite,
  ShoppingBag,
} from '@mui/icons-material'
import { updateProfile } from '../../store/slices/authSlice'
import { favoritesService } from '../../services/favoritesService'
import { productsApi } from '../../services/api'
import ProductCard from '../../components/common/ProductCard'
import { pageVariants, fadeIn, staggerContainer, staggerItem, scaleIn } from '../../utils/animations'
import { withLoading } from '../../utils/loadingHelper'
import { toast } from 'react-toastify'

const Profile = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address_line: user?.address_line || '',
    ward: user?.ward || '',
    city: user?.city || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [phoneWarning, setPhoneWarning] = useState('') // ✅ Thêm state cho phone warning

  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address_line: user?.address_line || '',
        ward: user?.ward || '',
        city: user?.city || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
    // Clear phone warning when user changes phone
    if (name === 'phone') {
      setPhoneWarning('')
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ và tên'
    }
    
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ Hàm check phone warning realtime
  const checkPhoneWarning = (phone) => {
    if (!phone || phone.trim().length === 0) {
      setPhoneWarning('')
      return
    }

    const cleanPhone = phone.replace(/\s/g, '')
    
    // Kiểm tra format trước
    if (!/^[0-9]*$/.test(cleanPhone)) {
      setPhoneWarning('⚠️ Số điện thoại chỉ được chứa chữ số')
      return
    }
    
    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      setPhoneWarning('⚠️ Số điện thoại phải có ít nhất 10 chữ số')
      return
    }
    
    if (cleanPhone.length > 11) {
      setPhoneWarning('⚠️ Số điện thoại không được quá 11 chữ số')
      return
    }

    // Nếu phone giống phone hiện tại của user → OK
    if (phone.trim() === user?.phone) {
      setPhoneWarning('✅ Số điện thoại hiện tại')
      return
    }

    // Nếu phone khác và hợp lệ → Cảnh báo sẽ check khi submit
    if (/^[0-9]{10,11}$/.test(cleanPhone)) {
      setPhoneWarning('ℹ️ Số điện thoại sẽ được kiểm tra khi cập nhật')
    } else {
      setPhoneWarning('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // Use withLoading to show progress bar
      const result = await withLoading(async () => {
        return await dispatch(updateProfile(formData))
      })
      
      if (updateProfile.fulfilled.match(result)) {
        toast.success('Cập nhật thông tin thành công')
        setPhoneWarning('') // ✅ Clear warning khi thành công
      } else {
        // ✅ Xử lý lỗi từ backend
        const errorPayload = result.payload
        
        // Nếu có lỗi validation từ backend (422)
        if (errorPayload?.errors) {
          const backendErrors = {}
          Object.keys(errorPayload.errors).forEach((key) => {
            backendErrors[key] = errorPayload.errors[key][0]
          })
          setErrors(backendErrors)
          
          // Hiển thị lỗi phone nếu có
          if (backendErrors.phone) {
            setPhoneWarning(`⚠️ ${backendErrors.phone}`)
            toast.error(backendErrors.phone)
          } else {
            toast.error('Vui lòng kiểm tra lại thông tin')
          }
        } else {
          const errorMessage = errorPayload?.message || errorPayload || 'Cập nhật thông tin thất bại'
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Có lỗi xảy ra khi cập nhật thông tin')
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const names = name.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const [favoriteIds, setFavoriteIds] = useState(favoritesService.getFavorites())

  // Refresh favorites when component mounts or when storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedFavorites = favoritesService.getFavorites()
      setFavoriteIds(prev => {
        // Only update if actually changed
        if (JSON.stringify(prev) !== JSON.stringify(updatedFavorites)) {
          return updatedFavorites
        }
        return prev
      })
    }

    // Check for favorites on mount
    handleStorageChange()

    // Listen for storage events (when favorites change in other tabs/components)
    window.addEventListener('storage', handleStorageChange)
    
    // Custom event for same-tab updates
    window.addEventListener('favoritesUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('favoritesUpdated', handleStorageChange)
    }
  }, []) // Empty dependency array - only run on mount/unmount
  
  // Fetch favorite products by IDs
  const { data: favoriteProducts, isLoading: productsLoading, refetch } = useQuery({
    queryKey: ['favorite-products', favoriteIds.sort().join(',')],
    queryFn: async () => {
      if (favoriteIds.length === 0) return []
      
      // Fetch all products first, then filter by favorite IDs
      try {
        const response = await productsApi.getProducts({ limit: 500 })
        const allProducts = response.data?.data || []
        
        // Filter products that are in favorites
        const favorites = allProducts.filter(product => 
          favoriteIds.includes(product.id)
        )
        
        // If some favorites are missing, try to fetch them individually
        const missingIds = favoriteIds.filter(id => 
          !favorites.find(p => p.id === id)
        )
        
        if (missingIds.length > 0) {
          // Try to fetch missing products individually
          const missingProducts = await Promise.allSettled(
            missingIds.map(id => productsApi.getProductDetail(id))
          )
          
          missingProducts.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value?.data) {
              favorites.push(result.value.data)
            }
          })
        }
        
        return favorites
      } catch (error) {
        console.error('Error fetching favorite products:', error)
        return []
      }
    },
    enabled: favoriteIds.length > 0,
    staleTime: 0, // ❌ Không cache
    gcTime: 0,
  })

  // Refresh products when favorites change
  useEffect(() => {
    if (favoriteIds.length > 0) {
      refetch()
    }
  }, [favoriteIds.join(','), refetch])

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h4" 
              gutterBottom 
              fontWeight="bold"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem' },
                color: '#1a1a1a',
                mb: 1,
              }}
            >
              Thông tin cá nhân
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý thông tin cá nhân và tài khoản của bạn
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card
            sx={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
        <CardContent sx={{ p: 4 }}>
          {/* Avatar Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4,
              }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: '#1976d2',
                    fontSize: '2.5rem',
                    mb: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                  }}
                >
                  {getInitials(formData.name)}
                </Avatar>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Typography variant="h6" fontWeight="600" color="text.primary">
                  {formData.name || 'Người dùng'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.email}
                </Typography>
              </motion.div>
            </Box>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Divider sx={{ my: 3 }} />
          </motion.div>

          <form onSubmit={handleSubmit}>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <motion.div variants={staggerItem}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <motion.div
                              animate={errors.name ? { x: [0, -5, 5, -5, 0] } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              <Person color={errors.name ? 'error' : 'action'} />
                            </motion.div>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                        },
                      }}
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <motion.div variants={staggerItem}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: '#f5f5f5',
                        },
                      }}
                      helperText="Email không thể thay đổi"
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <motion.div variants={staggerItem}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        handleChange(e)
                        checkPhoneWarning(e.target.value) // ✅ Check warning khi gõ
                      }}
                      error={!!errors.phone || (phoneWarning && phoneWarning.startsWith('⚠️'))}
                      helperText={
                        errors.phone || 
                        phoneWarning || 
                        'Nhập số điện thoại của bạn (10-11 chữ số)'
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <motion.div
                              animate={errors.phone ? { x: [0, -5, 5, -5, 0] } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              <Phone color={errors.phone || (phoneWarning && phoneWarning.startsWith('⚠️')) ? 'error' : 'action'} />
                            </motion.div>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                        },
                      }}
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <motion.div variants={staggerItem}>
                    <TextField
                      fullWidth
                      label="Địa chỉ chi tiết"
                      name="address_line"
                      value={formData.address_line}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                      placeholder="Số nhà, tên đường..."
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <motion.div variants={staggerItem}>
                    <TextField
                      fullWidth
                      label="Phường/Xã"
                      name="ward"
                      value={formData.ward}
                      onChange={handleChange}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                      placeholder="Phường 1, Xã ABC..."
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <motion.div variants={staggerItem}>
                    <TextField
                      fullWidth
                      label="Thành phố"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                      placeholder="TP. Hồ Chí Minh..."
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <motion.div variants={staggerItem}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={isLoading}
                          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Edit />}
                          sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                            '&:hover': {
                              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                            },
                            minWidth: 180,
                          }}
                        >
                          {isLoading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                        </Button>
                      </motion.div>
                    </Box>
                  </motion.div>
                </Grid>
              </Grid>
            </motion.div>
          </form>
        </CardContent>
      </Card>
        </motion.div>

      {/* Favorite Products Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Box sx={{ mt: 4 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h5" 
                fontWeight="bold"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  color: '#1a1a1a',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Favorite sx={{ color: '#e63946' }} />
                </motion.div>
                Sản phẩm yêu thích
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {favoriteIds.length > 0 
                  ? `Bạn có ${favoriteIds.length} sản phẩm yêu thích`
                  : 'Danh sách sản phẩm bạn đã thêm vào yêu thích'}
              </Typography>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card
              sx={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <AnimatePresence mode="wait">
                  {productsLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    </motion.div>
                  ) : favoriteProducts && favoriteProducts.length > 0 ? (
                    <motion.div
                      key="products"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                    >
                      <Grid container spacing={3}>
                        {favoriteProducts.map((product, index) => {
                          // Ensure product has required fields
                          if (!product || !product.id) {
                            console.warn('Invalid product in favorites:', product)
                            return null
                          }
                          
                          // Ensure product has minimum required data
                          const productData = {
                            id: product.id,
                            name: product.name || 'Sản phẩm không có tên',
                            price: product.price || 0,
                            original_price: product.original_price,
                            thumbnail: product.thumbnail || product.images?.[0]?.path,
                            images: product.images || [],
                            quantity: product.quantity || 0,
                            rating: product.rating,
                            reviews_count: product.reviews_count,
                            is_new: product.is_new,
                            ...product, // Spread to include any other fields
                          }
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={product.id}>
                              <motion.div
                                variants={staggerItem}
                                layout
                              >
                                <ProductCard product={productData} />
                              </motion.div>
                            </Grid>
                          )
                        })}
                      </Grid>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 8,
                          textAlign: 'center',
                        }}
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
                          <Favorite
                            sx={{
                              fontSize: 64,
                              color: '#e0e0e0',
                              mb: 2,
                            }}
                          />
                        </motion.div>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          {favoriteIds.length === 0 
                            ? 'Chưa có sản phẩm yêu thích'
                            : 'Không tìm thấy sản phẩm yêu thích'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          {favoriteIds.length === 0
                            ? 'Hãy thêm sản phẩm vào yêu thích để xem chúng ở đây'
                            : 'Có thể sản phẩm đã bị xóa hoặc không còn tồn tại'}
                        </Typography>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="contained"
                            startIcon={<ShoppingBag />}
                            onClick={() => window.location.href = '/products'}
                            sx={{
                              textTransform: 'none',
                              borderRadius: 2,
                            }}
                          >
                            Khám phá sản phẩm
                          </Button>
                        </motion.div>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      </motion.div>
    </Container>
    </motion.div>
  )
}

export default Profile

