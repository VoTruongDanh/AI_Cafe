import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material'
import {
  Phone,
  Email,
  LocationOn,
  AccessTime,
  Send,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { pageVariants, fadeIn } from '../../utils/animations'
import api from '../../services/api'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const contactMutation = useMutation({
    mutationFn: (data) => api.post('/contact', data),
    onSuccess: () => {
      toast.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    contactMutation.mutate(formData)
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" align="center" sx={{ mb: 4 }}>
          Liên hệ với chúng tôi
        </Typography>

        <Grid container spacing={4}>
          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Phone sx={{ fontSize: 40, color: '#e63946', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Điện thoại
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1900 1599
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    (Miễn phí cuộc gọi)
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Email sx={{ fontSize: 40, color: '#e63946', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Email
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    support@electroshop.vn
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    info@electroshop.vn
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <LocationOn sx={{ fontSize: 40, color: '#e63946', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Địa chỉ
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    123 Nguyễn Huệ, Quận 1
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hồ Chí Minh, Việt Nam
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <AccessTime sx={{ fontSize: 40, color: '#e63946', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Giờ làm việc
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thứ 2 - Thứ 6: 8:00 - 18:00
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thứ 7 - Chủ nhật: 9:00 - 17:00
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                Gửi tin nhắn cho chúng tôi
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Chủ đề"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nội dung"
                      multiline
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={contactMutation.isLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                      disabled={contactMutation.isLoading}
                      sx={{
                        bgcolor: '#e63946',
                        '&:hover': { bgcolor: '#d62839' },
                        px: 4,
                      }}
                    >
                      {contactMutation.isLoading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </motion.div>
  )
}

export default Contact

