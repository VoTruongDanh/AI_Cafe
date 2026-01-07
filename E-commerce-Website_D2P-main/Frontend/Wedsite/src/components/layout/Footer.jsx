import { Box, Container, Grid, Typography, IconButton, Divider } from '@mui/material'
import { Link } from 'react-router-dom'
import { 
  Phone, 
  Email, 
  LocationOn, 
  Facebook, 
  YouTube, 
  Instagram,
  Twitter,
  AccessTime,
  PhoneAndroid,
} from '@mui/icons-material'

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#2d3436',
        color: 'white',
        pt: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                bgcolor: '#e63946',
                px: 2,
                py: 1,
                borderRadius: 1,
                display: 'inline-block',
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px' }}>
                ELECTROSHOP
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
              Hệ thống bán lẻ điện máy, điện tử, điện gia dụng hàng đầu Việt Nam
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 18, color: '#e63946' }} />
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                    Hotline
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '14px' }}>
                    0328316192
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 18, color: '#e63946' }} />
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    phamduy14032004@gmail.com
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn sx={{ fontSize: 18, color: '#e63946', mt: 0.3 }} />
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                    Trụ sở chính
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '13px', lineHeight: 1.5 }}>
                    568 Lê Trọng Tấn, Phường Tây Thạnh, TP. Hồ Chí Minh
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={6} sm={6} md={2}>
            <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>
              Về công ty
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {[
                { label: 'Giới thiệu', to: '/about' },
                { label: 'Hệ thống siêu thị', to: '/stores' },
                { label: 'Liên hệ', to: '/contact' },
                { label: 'Tuyển dụng', to: '/careers' },
                { label: 'Tin tức', to: '/news' },
                { label: 'Chính sách bảo mật', to: '/privacy' },
              ].map((link) => (
                <Typography
                  key={link.label}
                  component={Link}
                  to={link.to}
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.75)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    '&:hover': { color: '#e63946', pl: 0.5 },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Customer Support */}
          <Grid item xs={6} sm={6} md={2}>
            <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>
              Hỗ trợ khách hàng
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {[
                { label: 'Hướng dẫn mua hàng', to: '/guide' },
                { label: 'Phương thức thanh toán', to: '/payment' },
                { label: 'Chính sách giao hàng', to: '/shipping' },
                { label: 'Chính sách đổi trả', to: '/return' },
                { label: 'Chính sách bảo hành', to: '/warranty' },
                { label: 'Câu hỏi thường gặp', to: '/faq' },
              ].map((link) => (
                <Typography
                  key={link.label}
                  component={Link}
                  to={link.to}
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.75)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    '&:hover': { color: '#e63946', pl: 0.5 },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Product Categories */}
          <Grid item xs={12} sm={6} md={2.5}>
            <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>
              Danh mục sản phẩm
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {[
                'Tivi & Âm thanh',
                'Máy lạnh - Máy giặt',
                'Tủ lạnh - Tủ đông',
                'Gia dụng nhà bếp',
                'Điện thoại - Tablet',
                'Laptop - Máy tính',
                'Phụ kiện & Thiết bị IT',
                'Đồ chơi công nghệ',
              ].map((item) => (
                <Typography
                  key={item}
                  component={Link}
                  to={`/products?search=${item}`}
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.75)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    '&:hover': { color: '#e63946', pl: 0.5 },
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Connect & App */}
          <Grid item xs={12} sm={6} md={2.5}>
            <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>
              Kết nối với chúng tôi
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              {[
                { icon: <Facebook />, color: '#1877f2', link: 'https://www.facebook.com/Duydz12' },
                { icon: <YouTube />, color: '#ff0000', link: '#' },
                { icon: <Instagram />, color: '#e4405f', link: '#' },
                { icon: <Twitter />, color: '#1da1f2', link: '#' },
              ].map((social, index) => (
                <IconButton
                  key={index}
                  component="a"
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    width: 36,
                    height: 36,
                    '&:hover': {
                      bgcolor: social.color,
                      transform: 'translateY(-3px)',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', fontSize: '13px' }}>
              Tải ứng dụng ngay
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box
                sx={{
                  bgcolor: '#000',
                  px: 1.5,
                  py: 0.8,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#333' },
                  transition: 'all 0.2s',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '10px', display: 'block' }}>
                  Download on the
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '13px', fontWeight: 'bold' }}>
                  App Store
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: '#000',
                  px: 1.5,
                  py: 0.8,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#333' },
                  transition: 'all 0.2s',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '10px', display: 'block' }}>
                  GET IT ON
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '13px', fontWeight: 'bold' }}>
                  Google Play
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime sx={{ fontSize: 16, color: '#e63946' }} />
                <Typography variant="caption" sx={{ fontSize: '12px' }}>
                  8:00 - 22:00 (Cả tuần)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneAndroid sx={{ fontSize: 16, color: '#e63946' }} />
                <Typography variant="caption" sx={{ fontSize: '12px' }}>
                  Hotline: 0328316192
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Bottom Section */}
        <Box sx={{ pb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                © 2024 ElectroShop. Tất cả quyền được bảo lưu.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Giấy chứng nhận ĐKKD số: 0123456789 do Sở KH & ĐT TP.HCM cấp ngày 01/01/2024
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/64px-Bitcoin.svg.png" 
                  alt="Payment" 
                  style={{ height: 28, opacity: 0.7 }}
                />
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/120px-Visa_Inc._logo.svg.png" 
                  alt="Visa" 
                  style={{ height: 28, opacity: 0.7 }}
                />
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/120px-Mastercard-logo.svg.png" 
                  alt="Mastercard" 
                  style={{ height: 28, opacity: 0.7 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
