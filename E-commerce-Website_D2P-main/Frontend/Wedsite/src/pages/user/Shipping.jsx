import { Box, Container, Typography, Paper } from '@mui/material'
import { LocalShipping } from '@mui/icons-material'

const Shipping = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
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
            Chính sách giao hàng
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            1. Phạm vi giao hàng
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, color: '#636e72' }}>
            ElectroShop giao hàng toàn quốc. Ưu tiên giao hàng nhanh trong nội thành các thành phố lớn: TP.HCM, Hà Nội, Đà Nẵng.
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            2. Thời gian giao hàng
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Nội thành TP.HCM, Hà Nội: 12-24 giờ</li>
            <li>Ngoại thành và tỉnh lân cận: 1-2 ngày</li>
            <li>Các tỉnh thành khác: 2-5 ngày</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            3. Phí giao hàng
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Miễn phí giao hàng cho đơn hàng từ 500.000đ</li>
            <li>Phí giao hàng tiêu chuẩn: 30.000đ - 50.000đ tùy khu vực</li>
            <li>Giao hàng ngoại thành: 50.000đ - 100.000đ</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            4. Quy trình giao hàng
          </Typography>
          <Box component="ol" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Xác nhận đơn hàng qua điện thoại</li>
            <li>Đóng gói và chuyển hàng cho đơn vị vận chuyển</li>
            <li>Cập nhật mã vận đơn cho khách hàng</li>
            <li>Giao hàng và thu tiền (nếu COD)</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            5. Lưu ý
          </Typography>
          <Box component="ul" sx={{ pl: 4, color: '#636e72' }}>
            <li>Khách hàng vui lòng kiểm tra hàng trước khi thanh toán</li>
            <li>Giữ lại phiếu giao hàng để được hỗ trợ bảo hành</li>
            <li>Liên hệ 1900 1599 nếu có vấn đề với đơn hàng</li>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default Shipping
