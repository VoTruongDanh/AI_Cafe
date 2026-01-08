import { Box, Container, Typography, Grid, Paper, Avatar } from '@mui/material'
import { 
  Store, 
  People, 
  Verified, 
  LocalShipping,
  EmojiEvents,
  TrendingUp 
} from '@mui/icons-material'

const About = () => {
  const stats = [
    { icon: <Store />, value: '50+', label: 'Cửa hàng', color: '#e63946' },
    { icon: <People />, value: '1M+', label: 'Khách hàng', color: '#f72585' },
    { icon: <Verified />, value: '100%', label: 'Chính hãng', color: '#7209b7' },
    { icon: <LocalShipping />, value: '24h', label: 'Giao hàng', color: '#4361ee' },
  ]

  const values = [
    {
      icon: <EmojiEvents />,
      title: 'Uy tín hàng đầu',
      description: 'Được khách hàng tin tưởng với hơn 10 năm kinh nghiệm trong ngành điện máy'
    },
    {
      icon: <Verified />,
      title: 'Sản phẩm chính hãng',
      description: '100% sản phẩm chính hãng, có tem bảo hành từ nhà sản xuất'
    },
    {
      icon: <LocalShipping />,
      title: 'Giao hàng nhanh chóng',
      description: 'Giao hàng nhanh trong 24h với hệ thống kho bãi rộng khắp cả nước'
    },
    {
      icon: <TrendingUp />,
      title: 'Giá cả cạnh tranh',
      description: 'Cam kết giá tốt nhất thị trường với nhiều chương trình khuyến mãi hấp dẫn'
    },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Hero Section */}
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
            Về ElectroShop
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', opacity: 0.95, maxWidth: 800, mx: 'auto' }}>
            Hệ thống bán lẻ điện máy, điện tử hàng đầu Việt Nam
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'white',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: stat.color,
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Story */}
        <Paper sx={{ p: 4, mb: 6, borderRadius: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            Câu chuyện của chúng tôi
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: '#636e72' }}>
            ElectroShop được thành lập vào năm 2014 với mục tiêu mang đến cho người tiêu dùng Việt Nam những sản phẩm điện máy, điện tử chính hãng với giá cả hợp lý nhất. Từ một cửa hàng nhỏ tại TP.HCM, chúng tôi đã không ngừng phát triển và mở rộng.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: '#636e72' }}>
            Đến nay, ElectroShop đã có hơn 50 cửa hàng trên toàn quốc, phục vụ hàng triệu khách hàng mỗi năm. Chúng tôi tự hào là đối tác chính thức của các thương hiệu điện máy hàng đầu thế giới như Samsung, LG, Sony, Panasonic, Apple...
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#636e72' }}>
            Với đội ngũ nhân viên chuyên nghiệp, nhiệt tình và hệ thống cửa hàng hiện đại, chúng tôi cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất cho khách hàng.
          </Typography>
        </Paper>

        {/* Values */}
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center', color: '#2d3436' }}>
          Giá trị cốt lõi
        </Typography>
        <Grid container spacing={3}>
          {values.map((value, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4,
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: '#e63946',
                      width: 50,
                      height: 50,
                    }}
                  >
                    {value.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#2d3436' }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#636e72', lineHeight: 1.6 }}>
                      {value.description}
                    </Typography>
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

export default About
