import { Box, Container, Typography, Paper } from '@mui/material'
import { Shield } from '@mui/icons-material'

const Privacy = () => {
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
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Shield sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            Chính sách bảo mật
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', opacity: 0.95 }}>
            Cam kết bảo vệ thông tin cá nhân của khách hàng
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            1. Thu thập thông tin
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, color: '#636e72' }}>
            ElectroShop thu thập thông tin cá nhân của bạn khi bạn đăng ký tài khoản, đặt hàng, đăng ký nhận email, 
            tham gia khảo sát hoặc tương tác với các dịch vụ của chúng tôi. Thông tin có thể bao gồm: họ tên, địa chỉ email, 
            số điện thoại, địa chỉ giao hàng, thông tin thanh toán.
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            2. Sử dụng thông tin
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: '#636e72' }}>
            Chúng tôi sử dụng thông tin thu thập được để:
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Xử lý và giao hàng cho đơn hàng của bạn</li>
            <li>Gửi thông tin về sản phẩm, dịch vụ, khuyến mãi</li>
            <li>Cải thiện trải nghiệm mua sắm của khách hàng</li>
            <li>Phân tích và nghiên cứu thị trường</li>
            <li>Phòng chống gian lận và bảo vệ an ninh</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            3. Bảo mật thông tin
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, color: '#636e72' }}>
            Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn bằng các biện pháp kỹ thuật và tổ chức phù hợp. 
            Thông tin thanh toán được mã hóa SSL 256-bit. Chúng tôi không bán hoặc chia sẻ thông tin cá nhân của 
            bạn cho bên thứ ba vì mục đích thương mại.
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            4. Cookies
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, color: '#636e72' }}>
            Website của chúng tôi sử dụng cookies để cải thiện trải nghiệm người dùng. Bạn có thể tùy chỉnh cài đặt 
            cookie trong trình duyệt của mình, tuy nhiên việc vô hiệu hóa cookies có thể ảnh hưởng đến một số chức năng 
            của website.
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            5. Quyền của khách hàng
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: '#636e72' }}>
            Bạn có quyền:
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Truy cập và cập nhật thông tin cá nhân</li>
            <li>Yêu cầu xóa thông tin cá nhân</li>
            <li>Từ chối nhận email marketing</li>
            <li>Khiếu nại về việc xử lý thông tin cá nhân</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            6. Liên hệ
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#636e72' }}>
            Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này, vui lòng liên hệ:<br />
            Email: privacy@electroshop.com<br />
            Hotline: 1900 1599<br />
            Địa chỉ: 123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh
          </Typography>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" sx={{ color: '#95a5a6', fontStyle: 'italic' }}>
              Chính sách này có hiệu lực từ ngày 01/01/2024 và có thể được cập nhật theo thời gian.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default Privacy
