import { Box, Container, Typography, Grid, Paper, Chip } from '@mui/material'
import { CalendarToday, Visibility } from '@mui/icons-material'

const News = () => {
  const news = [
    {
      title: 'Ra mắt Smart TV Samsung 2024 - Công nghệ Neo QLED đỉnh cao',
      excerpt: 'Samsung chính thức giới thiệu dòng TV Neo QLED 2024 với công nghệ Quantum Matrix Pro và AI upscaling...',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500',
      category: 'Sản phẩm mới',
      date: '25/11/2024',
      views: 1234,
    },
    {
      title: 'Black Friday 2024 - Giảm giá lên đến 50% toàn bộ điện máy',
      excerpt: 'Sự kiện Black Friday lớn nhất năm với hàng ngàn sản phẩm điện máy giảm giá sâu, voucher khủng...',
      image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=500',
      category: 'Khuyến mãi',
      date: '20/11/2024',
      views: 5678,
    },
    {
      title: 'So sánh iPhone 15 Pro Max vs Samsung Galaxy S24 Ultra',
      excerpt: 'Đánh giá chi tiết hai siêu phẩm flagship của Apple và Samsung về hiệu năng, camera, pin...',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      category: 'Review',
      date: '18/11/2024',
      views: 3456,
    },
    {
      title: 'Top 5 máy lạnh tiết kiệm điện nhất 2024',
      excerpt: 'Gợi ý những dòng máy lạnh inverter tiết kiệm điện, làm lạnh nhanh, phù hợp mọi không gian...',
      image: 'https://images.unsplash.com/photo-1631700611307-37dbcb89ef7e?w=500',
      category: 'Tư vấn',
      date: '15/11/2024',
      views: 2345,
    },
    {
      title: 'MacBook Air M3 chính thức ra mắt tại Việt Nam',
      excerpt: 'Apple công bố MacBook Air chip M3 với hiệu năng vượt trội, pin 18 giờ, giá từ 28.999.000đ...',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
      category: 'Sản phẩm mới',
      date: '10/11/2024',
      views: 4567,
    },
    {
      title: 'Hướng dẫn chọn mua tủ lạnh phù hợp cho gia đình',
      excerpt: 'Những tiêu chí quan trọng khi chọn mua tủ lạnh: dung tích, công nghệ, tiết kiệm điện...',
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500',
      category: 'Tư vấn',
      date: '05/11/2024',
      views: 1890,
    },
  ]

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Sản phẩm mới':
        return '#e63946'
      case 'Khuyến mãi':
        return '#f72585'
      case 'Review':
        return '#7209b7'
      case 'Tư vấn':
        return '#4361ee'
      default:
        return '#636e72'
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: '#2d3436',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            Tin tức
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', opacity: 0.95 }}>
            Cập nhật tin tức công nghệ, sản phẩm mới và khuyến mãi
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Grid container spacing={4}>
          {news.map((item, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  height: '100%',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <Box
                  sx={{
                    height: 220,
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  <Chip
                    label={item.category}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      bgcolor: getCategoryColor(item.category),
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
                <Box sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      mb: 2,
                      color: '#2d3436',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#636e72',
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.excerpt}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 16, color: '#636e72' }} />
                      <Typography variant="caption" sx={{ color: '#636e72' }}>
                        {item.date}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Visibility sx={{ fontSize: 16, color: '#636e72' }} />
                      <Typography variant="caption" sx={{ color: '#636e72' }}>
                        {item.views.toLocaleString()} lượt xem
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default News
