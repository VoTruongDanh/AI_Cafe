import { Box, Container, Typography, Grid, Paper, Chip, Button } from '@mui/material'
import { Work, LocationOn, Schedule, AttachMoney } from '@mui/icons-material'

const Careers = () => {
  const jobs = [
    {
      title: 'Nhân viên bán hàng',
      location: 'TP.HCM, Hà Nội',
      type: 'Toàn thời gian',
      salary: '8-12 triệu',
      description: 'Tư vấn sản phẩm điện máy, chăm sóc khách hàng, đạt chỉ tiêu doanh số',
      requirements: [
        'Nhiệt tình, ham học hỏi',
        'Kỹ năng giao tiếp tốt',
        'Ưu tiên có kinh nghiệm',
      ],
    },
    {
      title: 'Kỹ thuật viên bảo hành',
      location: 'Các tỉnh thành',
      type: 'Toàn thời gian',
      salary: '10-15 triệu',
      description: 'Sửa chữa, bảo dưỡng các thiết bị điện tử, điện lạnh',
      requirements: [
        'Tốt nghiệp CĐ/ĐH chuyên ngành điện, điện tử',
        'Có kinh nghiệm từ 1 năm',
        'Kỹ năng xử lý sự cố tốt',
      ],
    },
    {
      title: 'Nhân viên kho vận',
      location: 'TP.HCM',
      type: 'Toàn thời gian',
      salary: '7-10 triệu',
      description: 'Kiểm kê, xuất nhập kho, vận chuyển hàng hóa',
      requirements: [
        'Sức khỏe tốt',
        'Trung thực, cẩn thận',
        'Biết sử dụng máy tính cơ bản',
      ],
    },
    {
      title: 'Nhân viên Marketing',
      location: 'TP.HCM',
      type: 'Toàn thời gian',
      salary: '10-18 triệu',
      description: 'Lên kế hoạch marketing, quản lý fanpage, quảng cáo online',
      requirements: [
        'Tốt nghiệp ĐH Marketing/Truyền thông',
        'Kinh nghiệm 1-2 năm',
        'Thành thạo Facebook Ads, Google Ads',
      ],
    },
    {
      title: 'Lập trình viên Full-stack',
      location: 'TP.HCM (Remote)',
      type: 'Toàn thời gian',
      salary: '15-30 triệu',
      description: 'Phát triển và bảo trì hệ thống website, app bán hàng',
      requirements: [
        'Thành thạo React, Laravel',
        'Kinh nghiệm 2+ năm',
        'Có khả năng làm việc độc lập',
      ],
    },
  ]

  const benefits = [
    '💰 Lương cạnh tranh + thưởng theo doanh số',
    '🏥 BHXH, BHYT, BHTN đầy đủ',
    '🎉 Du lịch hàng năm, team building',
    '📚 Đào tạo chuyên môn thường xuyên',
    '⏰ Làm việc giờ hành chính',
    '🎁 Thưởng lễ, tết, sinh nhật',
  ]

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
            Tuyển dụng
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', opacity: 0.95 }}>
            Cùng xây dựng sự nghiệp với ElectroShop
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Benefits */}
        <Paper sx={{ p: 4, mb: 6, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3436' }}>
            Quyền lợi của bạn
          </Typography>
          <Grid container spacing={2}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {benefit}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Jobs */}
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4, color: '#2d3436' }}>
          Vị trí đang tuyển
        </Typography>

        <Grid container spacing={3}>
          {jobs.map((job, index) => (
            <Grid item xs={12} key={index}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4,
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#2d3436' }}>
                      {job.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn sx={{ fontSize: 18, color: '#636e72' }} />
                        <Typography variant="body2" sx={{ color: '#636e72' }}>
                          {job.location}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 18, color: '#636e72' }} />
                        <Typography variant="body2" sx={{ color: '#636e72' }}>
                          {job.type}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AttachMoney sx={{ fontSize: 18, color: '#636e72' }} />
                        <Typography variant="body2" sx={{ color: '#636e72', fontWeight: 'bold' }}>
                          {job.salary}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: '#e63946',
                      '&:hover': { bgcolor: '#d62839' },
                      textTransform: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    Ứng tuyển
                  </Button>
                </Box>

                <Typography variant="body2" sx={{ mb: 2, color: '#636e72' }}>
                  {job.description}
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#2d3436' }}>
                  Yêu cầu:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {job.requirements.map((req, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: '#636e72', pl: 2 }}>
                      • {req}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Contact */}
        <Paper sx={{ p: 4, mt: 6, borderRadius: 3, bgcolor: '#e63946', color: 'white', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Không tìm thấy vị trí phù hợp?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
            Gửi CV về email: hr@electroshop.com hoặc gọi 1900 1599 để được tư vấn
          </Typography>
          <Button
            variant="contained"
            sx={{
              bgcolor: 'white',
              color: '#e63946',
              '&:hover': { bgcolor: '#f8f9fa' },
              fontWeight: 'bold',
              px: 4,
            }}
          >
            Liên hệ ngay
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}

export default Careers
