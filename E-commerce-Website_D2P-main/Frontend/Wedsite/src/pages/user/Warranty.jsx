import { Box, Container, Typography, Paper } from '@mui/material'
import { Build } from '@mui/icons-material'

const Warranty = () => {
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
            Chính sách bảo hành
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            1. Thời gian bảo hành
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Điện thoại, laptop: 12 tháng</li>
            <li>Tivi, tủ lạnh, máy giặt: 24 tháng</li>
            <li>Máy lạnh: 24-36 tháng</li>
            <li>Phụ kiện: 6-12 tháng</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            2. Hình thức bảo hành
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Bảo hành chính hãng tại trung tâm bảo hành của hãng</li>
            <li>Bảo hành tại cửa hàng ElectroShop (sản phẩm nhỏ)</li>
            <li>Bảo hành tận nhà (máy lạnh, tủ lạnh, máy giặt lớn)</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            3. Điều kiện bảo hành
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Sản phẩm còn trong thời hạn bảo hành</li>
            <li>Tem bảo hành còn nguyên vẹn</li>
            <li>Có phiếu bảo hành hoặc hóa đơn mua hàng</li>
            <li>Lỗi do nhà sản xuất</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            4. Không bảo hành
          </Typography>
          <Box component="ul" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Rơi vỡ, va đập, vào nước</li>
            <li>Tự ý sửa chữa, thay đổi linh kiện</li>
            <li>Sử dụng sai nguồn điện, quá tải</li>
            <li>Hết thời hạn bảo hành</li>
            <li>Thiên tai, hỏa hoạn</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            5. Quy trình bảo hành
          </Typography>
          <Box component="ol" sx={{ mb: 3, pl: 4, color: '#636e72' }}>
            <li>Mang sản phẩm đến cửa hàng hoặc trung tâm bảo hành</li>
            <li>Nhân viên kiểm tra và viết phiếu tiếp nhận</li>
            <li>Sửa chữa trong 7-15 ngày làm việc</li>
            <li>Thông báo và giao sản phẩm cho khách hàng</li>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            6. Chính sách đổi mới
          </Typography>
          <Box component="ul" sx={{ pl: 4, color: '#636e72' }}>
            <li>Đổi mới sản phẩm nếu sửa chữa 3 lần chưa khắc phục</li>
            <li>Đổi mới nếu lỗi nghiêm trọng do nhà sản xuất</li>
            <li>Hotline bảo hành: 1900 1599</li>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default Warranty
