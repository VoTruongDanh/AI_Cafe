import { Box, Container, Typography, Paper } from '@mui/material'
import { Autorenew } from '@mui/icons-material'

const Return = () => {
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
            Chính sách đổi trả
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            1. Điều kiện đổi trả
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Sản phẩm còn nguyên seal, chưa qua sử dụng</li>
            <li>Đầy đủ phụ kiện, hộp, sách hướng dẫn</li>
            <li>Có hóa đơn mua hàng</li>
            <li>Trong thời hạn đổi trả (xem bảng dưới)</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            2. Thời hạn đổi trả
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Điện thoại, laptop, máy tính bảng: 7 ngày</li>
            <li>Tivi, tủ lạnh, máy giặt: 15 ngày</li>
            <li>Phụ kiện, đồ gia dụng nhỏ: 30 ngày</li>
            <li>Đổi 1-1 trong 24 giờ nếu lỗi nhà sản xuất</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            3. Trường hợp được đổi/trả
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Sản phẩm bị lỗi kỹ thuật do nhà sản xuất</li>
            <li>Giao sai sản phẩm, sai màu sắc</li>
            <li>Thiếu phụ kiện đi kèm</li>
            <li>Hư hỏng trong quá trình vận chuyển</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            4. Trường hợp KHÔNG đổi/trả
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Sản phẩm đã qua sử dụng, có dấu hiệu va đập</li>
            <li>Tự ý tháo seal, sửa chữa</li>
            <li>Rơi vỡ, vào nước do lỗi người dùng</li>
            <li>Quá thời hạn đổi trả</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            5. Quy trình đổi trả
          </Typography>
          <Box component="ol" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Liên hệ hotline 1900 1599 hoặc đến cửa hàng</li>
            <li>Nhân viên kiểm tra sản phẩm</li>
            <li>Xác nhận đổi/trả và xử lý</li>
            <li>Hoàn tiền trong 5-7 ngày làm việc (nếu trả hàng)</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            6. Chi phí đổi trả
          </Typography>
          <Box component="ul" sx={{ pl: 4, color: '#636e72' }}>
            <li>Miễn phí nếu lỗi nhà sản xuất hoặc giao sai hàng</li>
            <li>Khách hàng chịu phí vận chuyển nếu đổi ý không mua</li>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default Return
