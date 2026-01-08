import { Box, Container, Typography, Grid, Paper, Chip } from '@mui/material'
import { LocationOn, Phone, AccessTime } from '@mui/icons-material'

const Stores = () => {
  const stores = [
    {
      city: 'TP. Hồ Chí Minh',
      branches: [
        {
          name: 'ElectroShop Nguyễn Trãi',
          address: '123 Nguyễn Trãi, Quận 1',
          phone: '028 3822 1234',
          hours: '8:00 - 22:00',
          isHeadquarter: true,
        },
        {
          name: 'ElectroShop Cộng Hòa',
          address: '456 Cộng Hòa, Tân Bình',
          phone: '028 3844 5678',
          hours: '8:00 - 22:00',
        },
        {
          name: 'ElectroShop Lê Văn Việt',
          address: '789 Lê Văn Việt, Quận 9',
          phone: '028 3733 9012',
          hours: '8:00 - 22:00',
        },
      ],
    },
    {
      city: 'Hà Nội',
      branches: [
        {
          name: 'ElectroShop Hoàng Quốc Việt',
          address: '234 Hoàng Quốc Việt, Cầu Giấy',
          phone: '024 3755 1234',
          hours: '8:00 - 22:00',
        },
        {
          name: 'ElectroShop Giải Phóng',
          address: '567 Giải Phóng, Hai Bà Trưng',
          phone: '024 3633 5678',
          hours: '8:00 - 22:00',
        },
      ],
    },
    {
      city: 'Đà Nẵng',
      branches: [
        {
          name: 'ElectroShop Hùng Vương',
          address: '123 Hùng Vương, Hải Châu',
          phone: '0236 3888 1234',
          hours: '8:00 - 22:00',
        },
      ],
    },
    {
      city: 'Cần Thơ',
      branches: [
        {
          name: 'ElectroShop Mậu Thân',
          address: '456 Mậu Thân, Ninh Kiều',
          phone: '0292 3888 5678',
          hours: '8:00 - 22:00',
        },
      ],
    },
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
            Hệ thống cửa hàng
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', opacity: 0.95 }}>
            Hơn 50 cửa hàng trên toàn quốc
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {stores.map((store, index) => (
          <Box key={index} sx={{ mb: 6 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                mb: 3,
                color: '#2d3436',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <LocationOn sx={{ color: '#e63946' }} />
              {store.city}
            </Typography>

            <Grid container spacing={3}>
              {store.branches.map((branch, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '100%',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2d3436' }}>
                        {branch.name}
                      </Typography>
                      {branch.isHeadquarter && (
                        <Chip
                          label="Trụ sở chính"
                          size="small"
                          sx={{
                            bgcolor: '#e63946',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '10px',
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <LocationOn sx={{ fontSize: 20, color: '#636e72', mt: 0.3 }} />
                        <Typography variant="body2" sx={{ color: '#636e72' }}>
                          {branch.address}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Phone sx={{ fontSize: 20, color: '#636e72' }} />
                        <Typography variant="body2" sx={{ color: '#636e72', fontWeight: 'bold' }}>
                          {branch.phone}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <AccessTime sx={{ fontSize: 20, color: '#636e72' }} />
                        <Typography variant="body2" sx={{ color: '#636e72' }}>
                          {branch.hours} (Cả tuần)
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Container>
    </Box>
  )
}

export default Stores
