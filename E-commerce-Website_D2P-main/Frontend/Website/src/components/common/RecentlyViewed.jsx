import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Box, Container, Typography, Grid } from '@mui/material'
import ProductCard from '../common/ProductCard'

const RecentlyViewed = () => {
  const navigate = useNavigate()
  const { products } = useSelector((state) => state.recentlyViewed)

  if (products.length === 0) return null

  return (
    <Box sx={{ bgcolor: 'white', py: 4 }}>
      <Container maxWidth="xl">
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
          Sản phẩm đã xem
        </Typography>
        <Grid container spacing={2}>
          {products.slice(0, 6).map((product) => (
            <Grid item xs={6} sm={4} md={2} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default RecentlyViewed
