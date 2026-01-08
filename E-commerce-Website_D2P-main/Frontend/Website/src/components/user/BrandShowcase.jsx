import { Box, Container, Grid, Card, Typography, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { ArrowForward } from '@mui/icons-material'

const brands = [
  { id: 1, name: 'Apple', image: 'https://cdn-icons-png.flaticon.com/512/5969/5969384.png' },
  { id: 2, name: 'Samsung', image: 'https://cdn-icons-png.flaticon.com/512/5969/5969389.png' },
  { id: 3, name: 'Dell', image: 'https://cdn-icons-png.flaticon.com/512/883/883803.png' },
  { id: 4, name: 'HP', image: 'https://cdn-icons-png.flaticon.com/512/5969/5969242.png' },
  { id: 5, name: 'Lenovo', image: 'https://cdn-icons-png.flaticon.com/512/5969/5969335.png' },
  { id: 6, name: 'Sony', image: 'https://cdn-icons-png.flaticon.com/512/5969/5969356.png' },
  { id: 7, name: 'LG', image: 'https://cdn-icons-png.flaticon.com/512/883/883874.png' },
  { id: 8, name: 'Asus', image: 'https://cdn-icons-png.flaticon.com/512/883/883806.png' },
  { id: 9, name: 'Xiaomi', image: 'https://cdn-icons-png.flaticon.com/512/5969/5969328.png' },
  { id: 10, name: 'Panasonic', image: 'https://cdn-icons-png.flaticon.com/512/5969/5969248.png' },
]

const BrandShowcase = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth="xl" sx={{ mb: 5 }}>
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography 
              variant="h5" 
              fontWeight="bold" 
              sx={{ 
                color: '#333',
                fontSize: { xs: '20px', md: '24px' },
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 60,
                  height: 4,
                  bgcolor: '#e63946',
                  borderRadius: 2,
                }
              }}
            >
              THƯƠNG HIỆU NỔI BẬT
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontSize: '13px' }}>
              Các thương hiệu công nghệ hàng đầu thế giới
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {brands.map((brand) => (
            <Grid item xs={6} sm={4} md={2.4} lg={1.2} key={brand.id}>
              <Card
                elevation={0}
                onClick={() => navigate(`/products?search=${brand.name}`)}
                sx={{
                  cursor: 'pointer',
                  border: '1px solid #f0f0f0',
                  bgcolor: '#fafafa',
                  '&:hover': {
                    border: '1px solid #e63946',
                    bgcolor: 'white',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 20px rgba(230,57,70,0.15)',
                    '& img': {
                      transform: 'scale(1.1)',
                    }
                  },
                  transition: 'all 0.3s ease',
                  borderRadius: 2,
                  p: 2.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 120,
                }}
              >
                <Box
                  component="img"
                  src={brand.image}
                  alt={brand.name}
                  sx={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain',
                    mb: 1.5,
                    transition: 'transform 0.3s ease',
                    filter: 'grayscale(20%)',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: '12px',
                    color: '#333',
                    textAlign: 'center',
                  }}
                >
                  {brand.name}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  )
}

export default BrandShowcase

