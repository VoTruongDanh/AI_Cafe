import { useState } from 'react'
import { motion } from 'framer-motion'
import * as yup from 'yup'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Business,
  CheckCircle,
  Percent,
  LocalShipping,
  Support,
  AccountBalance,
  Phone,
  Email,
  ExpandMore,
  Star,
  Groups,
  Handshake,
  TrendingUp,
} from '@mui/icons-material'
import { toast } from 'react-toastify'

// Validation schema
const businessFormSchema = yup.object({
  companyName: yup.string().required('Vui lòng nhập tên công ty').min(2, 'Tên công ty phải có ít nhất 2 ký tự'),
  contactPerson: yup.string().required('Vui lòng nhập tên người liên hệ'),
  phone: yup.string().required('Vui lòng nhập số điện thoại').matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ'),
  email: yup.string().required('Vui lòng nhập email').email('Email không hợp lệ'),
  taxCode: yup.string().matches(/^[0-9]{10,13}$/, { message: 'Mã số thuế phải có 10-13 chữ số', excludeEmptyString: true }),
})

const BusinessSales = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    taxCode: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    productNeeds: '',
    quantity: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await businessFormSchema.validate(formData, { abortEarly: false })
      setErrors({})
      // Handle form submission
      console.log('Form submitted:', formData)
      toast.success('Gửi yêu cầu tư vấn thành công! Chúng tôi sẽ liên hệ bạn sớm.')
      // Reset form
      setFormData({
        companyName: '',
        taxCode: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        productNeeds: '',
        quantity: '',
      })
    } catch (validationError) {
      const newErrors = {}
      validationError.inner.forEach(err => {
        newErrors[err.path] = err.message
      })
      setErrors(newErrors)
      toast.error('Vui lòng kiểm tra lại thông tin')
    }
  }

  const benefits = [
    {
      icon: <Percent sx={{ fontSize: 40 }} />,
      title: 'Giá ưu đãi đặc biệt',
      description: 'Chiết khấu lên đến 30% cho đơn hàng số lượng lớn',
      color: '#ff6b35',
    },
    {
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      title: 'Giao hàng ưu tiên',
      description: 'Miễn phí vận chuyển và lắp đặt toàn quốc',
      color: '#4caf50',
    },
    {
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      title: 'Thanh toán linh hoạt',
      description: 'Hỗ trợ công nợ, chuyển khoản, trả chậm',
      color: '#2196f3',
    },
    {
      icon: <Support sx={{ fontSize: 40 }} />,
      title: 'Hỗ trợ chuyên biệt',
      description: 'Đội ngũ Account Manager riêng 24/7',
      color: '#9c27b0',
    },
  ]

  const processSteps = [
    { label: 'Đăng ký tư vấn', description: 'Điền form yêu cầu hoặc gọi hotline' },
    { label: 'Nhận báo giá', description: 'Chuyên viên liên hệ trong 2 giờ' },
    { label: 'Ký hợp đồng', description: 'Thỏa thuận điều khoản & thanh toán' },
    { label: 'Giao hàng & Lắp đặt', description: 'Triển khai theo tiến độ cam kết' },
    { label: 'Bảo hành & Hậu mãi', description: 'Hỗ trợ kỹ thuật trọn đời' },
  ]

  const pricingTiers = [
    {
      tier: 'Cơ bản',
      minOrder: '10 - 49 sản phẩm',
      discount: '10%',
      payment: 'Đặt cọc 30%',
      support: 'Email & Hotline',
    },
    {
      tier: 'Doanh nghiệp',
      minOrder: '50 - 199 sản phẩm',
      discount: '15-20%',
      payment: 'Công nợ 30 ngày',
      support: 'Account Manager',
      highlight: true,
    },
    {
      tier: 'Đối tác',
      minOrder: '200+ sản phẩm',
      discount: '20-30%',
      payment: 'Công nợ 45 ngày',
      support: 'Chuyên viên riêng 24/7',
    },
  ]

  const partners = [
    { name: 'FPT', logo: '🏢' },
    { name: 'Viettel', logo: '📱' },
    { name: 'BIDV', logo: '🏦' },
    { name: 'VinGroup', logo: '🏗️' },
    { name: 'Samsung', logo: '📺' },
    { name: 'LG', logo: '🖥️' },
  ]

  const testimonials = [
    {
      company: 'Công ty ABC',
      person: 'Nguyễn Văn A - Giám đốc IT',
      content: 'Dịch vụ B2B của ElectroShop rất chuyên nghiệp. Chúng tôi đã mua 500 laptop cho nhân viên với giá cực kỳ ưu đãi.',
      rating: 5,
    },
    {
      company: 'Tập đoàn XYZ',
      person: 'Trần Thị B - Trưởng phòng mua sắm',
      content: 'Quy trình mua hàng nhanh gọn, hỗ trợ nhiệt tình. Đặc biệt ấn tượng với chính sách công nợ linh hoạt.',
      rating: 5,
    },
  ]

  const faqs = [
    {
      question: 'Doanh nghiệp cần điều kiện gì để đăng ký?',
      answer: 'Quý doanh nghiệp chỉ cần có giấy phép kinh doanh và mã số thuế còn hiệu lực. Chúng tôi phục vụ tất cả các loại hình doanh nghiệp.',
    },
    {
      question: 'Thời gian xử lý đơn hàng mất bao lâu?',
      answer: 'Sau khi nhận yêu cầu, chúng tôi sẽ liên hệ trong vòng 2 giờ làm việc. Đơn hàng thông thường được xử lý trong 1-3 ngày.',
    },
    {
      question: 'Có hỗ trợ xuất hóa đơn VAT không?',
      answer: 'Có, tất cả đơn hàng doanh nghiệp đều được xuất hóa đơn VAT đầy đủ theo quy định.',
    },
    {
      question: 'Chính sách bảo hành cho doanh nghiệp như thế nào?',
      answer: 'Doanh nghiệp được hưởng bảo hành chính hãng tiêu chuẩn, cộng thêm hỗ trợ kỹ thuật tại chỗ và ưu tiên xử lý khi có sự cố.',
    },
  ]

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            sx={{
              p: 5,
              mb: 4,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              color: 'white',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Business sx={{ fontSize: 50, color: '#ff6b35' }} />
                  <Typography variant="h3" fontWeight={700}>
                    Bán Hàng Doanh Nghiệp
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
                  Giải pháp mua sắm toàn diện cho doanh nghiệp. Giá tốt nhất - Dịch vụ
                  chuyên nghiệp - Hỗ trợ tận tâm.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<Percent />}
                    label="Chiết khấu đến 30%"
                    sx={{ bgcolor: '#ff6b35', color: 'white', fontWeight: 600 }}
                  />
                  <Chip
                    icon={<Handshake />}
                    label="500+ đối tác tin tưởng"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                  {[
                    { icon: <Groups />, value: '500+', label: 'Đối tác' },
                    { icon: <TrendingUp />, value: '10K+', label: 'Đơn hàng' },
                  ].map((stat, index) => (
                    <Box key={index} sx={{ textAlign: 'center' }}>
                      <Box sx={{ color: '#ff6b35', mb: 1 }}>{stat.icon}</Box>
                      <Typography variant="h4" fontWeight={700}>
                        {stat.value}
                      </Typography>
                      <Typography sx={{ opacity: 0.7 }}>{stat.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'rgba(255,107,53,0.1)',
              }}
            />
          </Paper>
        </motion.div>

        {/* Benefits */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          Quyền lợi dành cho doanh nghiệp
        </Typography>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    borderTop: `4px solid ${benefit.color}`,
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'translateY(-5px)' },
                  }}
                >
                  <Box sx={{ color: benefit.color, mb: 2 }}>{benefit.icon}</Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {benefit.title}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {benefit.description}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Pricing Tiers */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          Bảng giá ưu đãi theo quy mô
        </Typography>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {pricingTiers.map((tier, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    border: tier.highlight ? '2px solid #ff6b35' : '1px solid #e0e0e0',
                    overflow: 'visible',
                  }}
                >
                  {tier.highlight && (
                    <Chip
                      label="Phổ biến nhất"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: '#ff6b35',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
                      {tier.tier}
                    </Typography>
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      textAlign="center"
                      color="primary"
                      gutterBottom
                    >
                      {tier.discount}
                    </Typography>
                    <Typography textAlign="center" color="text.secondary" gutterBottom>
                      Chiết khấu
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={tier.minOrder} secondary="Số lượng tối thiểu" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={tier.payment} secondary="Hình thức thanh toán" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={tier.support} secondary="Hỗ trợ" />
                      </ListItem>
                    </List>
                    <Button
                      fullWidth
                      variant={tier.highlight ? 'contained' : 'outlined'}
                      sx={{
                        mt: 2,
                        ...(tier.highlight && {
                          bgcolor: '#ff6b35',
                          '&:hover': { bgcolor: '#e55a2b' },
                        }),
                      }}
                    >
                      Liên hệ ngay
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Process */}
        <Paper sx={{ p: 4, mb: 5, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Quy trình hợp tác
          </Typography>
          <Stepper alternativeLabel>
            {processSteps.map((step, index) => (
              <Step key={index} active={true}>
                <StepLabel
                  StepIconProps={{
                    sx: { color: '#ff6b35 !important', fontSize: 30 },
                  }}
                >
                  <Typography fontWeight={600}>{step.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Contact Form */}
        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, borderRadius: 3, height: '100%' }}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Đăng ký tư vấn
              </Typography>
              <Typography color="text.secondary" paragraph>
                Để lại thông tin, chúng tôi sẽ liên hệ trong 2 giờ làm việc
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tên công ty *"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      error={!!errors.companyName}
                      helperText={errors.companyName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mã số thuế"
                      name="taxCode"
                      value={formData.taxCode}
                      onChange={handleChange}
                      error={!!errors.taxCode}
                      helperText={errors.taxCode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Người liên hệ *"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      error={!!errors.contactPerson}
                      helperText={errors.contactPerson}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại *"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      error={!!errors.phone}
                      helperText={errors.phone}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nhu cầu sản phẩm"
                      name="productNeeds"
                      value={formData.productNeeds}
                      onChange={handleChange}
                      multiline
                      rows={3}
                      placeholder="VD: 100 laptop văn phòng, 50 màn hình 24 inch..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        bgcolor: '#ff6b35',
                        py: 1.5,
                        fontSize: 16,
                        '&:hover': { bgcolor: '#e55a2b' },
                      }}
                    >
                      Gửi yêu cầu tư vấn
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, borderRadius: 3, height: '100%' }}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Liên hệ trực tiếp
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#ff6b35' }}>
                    <Phone />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Hotline B2B
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      1900 xxxx (Nhấn 2)
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#4caf50' }}>
                    <Email />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      b2b@electroshop.vn
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Đối tác tin tưởng
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {partners.map((partner, index) => (
                  <Chip
                    key={index}
                    avatar={<Avatar>{partner.logo}</Avatar>}
                    label={partner.name}
                    variant="outlined"
                  />
                ))}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Nhận xét từ đối tác
              </Typography>
              {testimonials.map((testimonial, index) => (
                <Card key={index} sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', mb: 1 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} sx={{ color: '#ffc107', fontSize: 18 }} />
                      ))}
                    </Box>
                    <Typography variant="body2" paragraph>
                      &ldquo;{testimonial.content}&rdquo;
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {testimonial.person}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {testimonial.company}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>
        </Grid>

        {/* FAQ */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          Câu hỏi thường gặp
        </Typography>
        <Box sx={{ mb: 5 }}>
          {faqs.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 1, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight={500}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* CTA */}
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Sẵn sàng bắt đầu?
          </Typography>
          <Typography sx={{ mb: 3, opacity: 0.9 }}>
            Liên hệ ngay để nhận báo giá tốt nhất cho doanh nghiệp của bạn
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Phone />}
              sx={{
                bgcolor: 'white',
                color: '#ff6b35',
                fontWeight: 600,
                px: 4,
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
            >
              Gọi ngay: 1900 xxxx
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Email />}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Gửi email
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default BusinessSales
