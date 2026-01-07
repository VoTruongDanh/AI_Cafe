import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
} from '@mui/material'
import {
  Home,
  Search,
  ShoppingBag,
} from '@mui/icons-material'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchProducts } from '../../store/slices/productsSlice'
import { useSelector } from 'react-redux'
import ProductCard from '../../components/common/ProductCard'

const NotFound = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { products } = useSelector((state) => state.products)

  useEffect(() => {
    // Fetch some featured products to show
    dispatch(fetchProducts({ page: 1, limit: 4 }))
  }, [dispatch])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '80px', md: '120px' },
              fontWeight: 'bold',
              color: '#e63946',
              mb: 2,
            }}
          >
            404
          </Typography>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontSize: { xs: '24px', md: '32px' },
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            Trang không tìm thấy
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
          >
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{
                bgcolor: '#e63946',
                '&:hover': { bgcolor: '#d62839' },
                px: 4,
                py: 1.5,
              }}
            >
              Về trang chủ
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Search />}
              onClick={() => navigate('/products')}
              sx={{
                borderColor: '#e63946',
                color: '#e63946',
                '&:hover': {
                  borderColor: '#d62839',
                  bgcolor: 'rgba(230, 57, 70, 0.04)',
                },
                px: 4,
                py: 1.5,
              }}
            >
              Xem sản phẩm
            </Button>
          </Box>
        </Box>

        {/* Suggested Products */}
        {products && products.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 'bold', mb: 4 }}
            >
              Sản phẩm đề xuất
            </Typography>
            <Grid container spacing={3}>
              {products.slice(0, 4).map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Helpful Links */}
        <Card sx={{ mt: 6, bgcolor: '#f8f9fa' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Có thể bạn quan tâm
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                startIcon={<ShoppingBag />}
                onClick={() => navigate('/products')}
                sx={{ color: '#e63946' }}
              >
                Sản phẩm
              </Button>
              <Button
                onClick={() => navigate('/cart')}
                sx={{ color: '#e63946' }}
              >
                Giỏ hàng
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                sx={{ color: '#e63946' }}
              >
                Tài khoản
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </motion.div>
  )
}

export default NotFound

