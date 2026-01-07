import { Box, Container, Typography, Paper } from '@mui/material'
import { Payment, CreditCard, AccountBalance, Money } from '@mui/icons-material'

const PaymentMethods = () => {
  const methods = [
    {
      icon: <Money />,
      title: 'Thanh toán khi nhận hàng (COD)',
      description: 'Thanh toán bằng tiền mặt khi nhận hàng. Áp dụng cho đơn hàng dưới 20 triệu đồng.',
      color: '#e63946',
    },
    {
      icon: <AccountBalance />,
      title: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản qua Vietcombank, Techcombank, ACB. Đơn hàng được xử lý sau khi xác nhận thanh toán.',
      color: '#f72585',
    },
    {
      icon: <CreditCard />,
      title: 'Thanh toán thẻ ATM/Visa/Mastercard',
      description: 'Thanh toán online an toàn qua cổng OnePay. Hỗ trợ trả góp 0% qua thẻ tín dụng.',
      color: '#7209b7',
    },
    {
      icon: <Payment />,
      title: 'Ví điện tử MoMo/ZaloPay',
      description: 'Thanh toán nhanh chóng qua ví điện tử. Nhận nhiều ưu đãi và hoàn tiền.',
      color: '#4361ee',
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
            Phương thức thanh toán
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 8 }}>
        {methods.map((method, index) => (
          <Paper
            key={index}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 4,
              },
            }}
          >
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  bgcolor: method.color,
                  color: 'white',
                  p: 2,
                  borderRadius: 2,
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {method.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#2d3436' }}>
                  {method.title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#636e72', lineHeight: 1.8 }}>
                  {method.description}
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Container>
    </Box>
  )
}

export default PaymentMethods
