import { Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { LocalShipping, Payment, Autorenew, Build } from '@mui/icons-material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const Guide = () => {
  const steps = [
    {
      icon: <LocalShipping />,
      title: 'Bước 1: Tìm kiếm sản phẩm',
      description: 'Tìm kiếm sản phẩm qua thanh tìm kiếm hoặc danh mục. Xem chi tiết thông tin, hình ảnh, giá cả và đánh giá.',
    },
    {
      icon: <Payment />,
      title: 'Bước 2: Thêm vào giỏ hàng',
      description: 'Chọn số lượng và nhấn "Thêm vào giỏ hàng". Kiểm tra giỏ hàng và điều chỉnh số lượng nếu cần.',
    },
    {
      icon: <Autorenew />,
      title: 'Bước 3: Thanh toán',
      description: 'Điền đầy đủ thông tin giao hàng. Chọn phương thức thanh toán: COD, chuyển khoản, hoặc thẻ.',
    },
    {
      icon: <Build />,
      title: 'Bước 4: Nhận hàng',
      description: 'Nhận hàng trong 24-48h. Kiểm tra sản phẩm trước khi thanh toán (nếu COD).',
    },
  ]

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
            Hướng dẫn mua hàng
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 8 }}>
        {steps.map((step, index) => (
          <Paper key={index} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  bgcolor: '#e63946',
                  color: 'white',
                  p: 2,
                  borderRadius: 2,
                }}
              >
                {step.icon}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#2d3436' }}>
                  {step.title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#636e72', lineHeight: 1.8 }}>
                  {step.description}
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Container>
    </Box>
  )
}

export default Guide
