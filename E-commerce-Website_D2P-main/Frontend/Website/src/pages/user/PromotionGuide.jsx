import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Alert,
  Skeleton,
  Avatar,
} from '@mui/material'
import {
  ExpandMore,
  LocalOffer,
  CardGiftcard,
  Percent,
  Timer,
  CheckCircle,
  Star,
  TrendingUp,
  Loyalty,
  EmojiEvents,
  Redeem,
  CalendarMonth,
  MonetizationOn,
  Info,
  ArrowForward,
  Bolt,
  ContentCopy,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { promotionsApi } from '../../services/api'
import { usePreloader } from '../../contexts/PreloaderContext'
import { toast } from 'react-toastify'

const PromotionGuide = () => {
  const [expanded, setExpanded] = useState(false)
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const { markDataReady } = usePreloader()

  useEffect(() => {
    fetchPromotions()
  }, [])

  const fetchPromotions = async () => {
    try {
      const response = await promotionsApi.getPromotions({ is_active: true })
      setPromotions(response.data?.data || response.data || [])
    } catch (error) {
      console.error('Error fetching promotions:', error)
    } finally {
      setLoading(false)
      markDataReady()
    }
  }

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false)
  }

  // Copy mã giảm giá
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success(`Đã sao chép mã: ${code}`)
  }

  // Format ngày
  const formatDate = (dateString) => {
    if (!dateString) return 'Không giới hạn'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Format giảm giá
  const formatDiscount = (promotion) => {
    // Backend dùng promotion_type và value
    if (promotion.promotion_type === 'percentage') {
      return `Giảm ${promotion.value}%`
    } else {
      return `Giảm ${Number(promotion.value).toLocaleString('vi-VN')}đ`
    }
  }

  // Lấy màu theo loại khuyến mãi
  const getPromotionColor = (index) => {
    const colors = ['#e63946', '#4caf50', '#2196f3', '#9c27b0', '#ff6b35', '#00bcd4']
    return colors[index % colors.length]
  }

  // Kiểm tra khuyến mãi còn hiệu lực
  const isPromotionActive = (promotion) => {
    const now = new Date()
    // Backend dùng starts_at và ends_at
    const startDate = promotion.starts_at ? new Date(promotion.starts_at) : null
    const endDate = promotion.ends_at ? new Date(promotion.ends_at) : null
    
    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false
    return promotion.is_active
  }

  // Phân loại khuyến mãi
  const flashSalePromotions = promotions.filter(p => p.is_flash_sale && isPromotionActive(p))
  const regularPromotions = promotions.filter(p => !p.is_flash_sale && isPromotionActive(p))

  const promotionTypes = [
    {
      icon: <Percent sx={{ fontSize: 40, color: '#ff6b35' }} />,
      title: 'Giảm giá trực tiếp',
      description: 'Giảm ngay % hoặc số tiền cố định trên giá sản phẩm',
      example: 'VD: Giảm 20% cho TV Samsung, tối đa 2.000.000đ',
    },
    {
      icon: <CardGiftcard sx={{ fontSize: 40, color: '#4caf50' }} />,
      title: 'Quà tặng kèm',
      description: 'Nhận quà tặng giá trị khi mua sản phẩm',
      example: 'VD: Mua laptop tặng chuột + balo + túi chống sốc',
    },
    {
      icon: <Loyalty sx={{ fontSize: 40, color: '#2196f3' }} />,
      title: 'Voucher & Mã giảm giá',
      description: 'Nhập mã để được giảm giá thêm khi thanh toán',
      example: 'VD: Nhập mã SALE50 giảm thêm 50.000đ',
    },
    {
      icon: <MonetizationOn sx={{ fontSize: 40, color: '#9c27b0' }} />,
      title: 'Trả góp 0%',
      description: 'Mua trả góp không lãi suất qua các đối tác',
      example: 'VD: Trả góp 0% lãi suất qua thẻ tín dụng 6-12 tháng',
    },
  ]

  const faqItems = [
    {
      question: 'Làm thế nào để biết sản phẩm đang có khuyến mãi?',
      answer: 'Sản phẩm khuyến mãi sẽ hiển thị tag "SALE" hoặc "Khuyến mãi" trên hình ảnh. Giá gốc sẽ bị gạch và giá khuyến mãi hiển thị màu đỏ. Bạn cũng có thể vào trang "Tổng hợp khuyến mãi" để xem tất cả sản phẩm đang giảm giá.',
    },
    {
      question: 'Có thể sử dụng nhiều mã giảm giá cùng lúc không?',
      answer: 'Mỗi đơn hàng chỉ được áp dụng 1 mã giảm giá (voucher). Tuy nhiên, mã giảm giá có thể kết hợp với các chương trình khuyến mãi sẵn có của sản phẩm.',
    },
    {
      question: 'Khuyến mãi có áp dụng cho đơn trả góp không?',
      answer: 'Có! Hầu hết các chương trình khuyến mãi đều áp dụng cho cả thanh toán trực tiếp và trả góp. Một số chương trình còn hỗ trợ trả góp 0% lãi suất.',
    },
    {
      question: 'Làm sao để nhận thông báo về khuyến mãi mới?',
      answer: 'Bạn có thể đăng ký nhận email thông báo, theo dõi fanpage Facebook, hoặc bật thông báo trên app ElectroShop để không bỏ lỡ các chương trình ưu đãi hấp dẫn.',
    },
    {
      question: 'Sản phẩm khuyến mãi có được bảo hành không?',
      answer: 'Tất nhiên! Mọi sản phẩm dù có khuyến mãi hay không đều được bảo hành chính hãng đầy đủ theo quy định của nhà sản xuất.',
    },
  ]

  const tips = [
    'Theo dõi Flash Sale vào các khung giờ vàng: 12h và 20h hàng ngày',
    'Đăng ký thành viên để nhận voucher ưu đãi độc quyền',
    'Mua combo sản phẩm để được giảm giá thêm',
    'Thanh toán bằng ví điện tử để nhận thêm cashback',
    'Kiểm tra trang khuyến mãi thường xuyên để không bỏ lỡ deal hot',
  ]

  // Skeleton loading
  const PromotionSkeleton = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="rounded" width={100} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="80%" height={28} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Hero Section - Simple */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            bgcolor: '#1a1a2e',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            Chương Trình Khuyến Mãi
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Tổng hợp các chương trình ưu đãi và mã giảm giá đang có tại ElectroShop.
          </Typography>
        </Paper>

        {/* Flash Sale Promotions */}
        {flashSalePromotions.length > 0 && (
          <>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Bolt sx={{ color: '#e63946' }} /> Flash Sale đang diễn ra
            </Typography>
            <Grid container spacing={3} sx={{ mb: 5 }}>
              {flashSalePromotions.map((promo, index) => (
                <Grid item xs={12} sm={6} md={3} key={promo.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        borderTop: `4px solid #e63946`,
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 },
                        background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
                      }}
                    >
                      <CardContent>
                        <Chip
                          icon={<Bolt sx={{ color: 'white !important' }} />}
                          label={formatDiscount(promo)}
                          sx={{
                            bgcolor: '#e63946',
                            color: 'white',
                            fontWeight: 600,
                            mb: 2,
                          }}
                        />
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {promo.name}
                        </Typography>
                        {promo.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {promo.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                          <Timer fontSize="small" />
                          <Typography variant="body2">
                            {formatDate(promo.starts_at)} - {formatDate(promo.ends_at)}
                          </Typography>
                        </Box>
                        {promo.code && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ContentCopy />}
                            onClick={() => handleCopyCode(promo.code)}
                            sx={{ 
                              mt: 1, 
                              borderColor: '#e63946', 
                              color: '#e63946',
                              '&:hover': { bgcolor: '#fff5f5', borderColor: '#e63946' }
                            }}
                          >
                            Mã: {promo.code}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Regular Promotions */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp color="primary" /> Chương trình khuyến mãi
        </Typography>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {loading ? (
            [...Array(4)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <PromotionSkeleton />
              </Grid>
            ))
          ) : regularPromotions.length > 0 ? (
            regularPromotions.map((promo, index) => (
              <Grid item xs={12} sm={6} md={3} key={promo.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderTop: `4px solid ${getPromotionColor(index)}`,
                      transition: 'transform 0.3s',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 },
                    }}
                  >
                    <CardContent>
                      <Chip
                        label={formatDiscount(promo)}
                        sx={{
                          bgcolor: getPromotionColor(index),
                          color: 'white',
                          fontWeight: 600,
                          mb: 2,
                        }}
                      />
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {promo.name}
                      </Typography>
                      {promo.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {promo.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                        <Timer fontSize="small" />
                        <Typography variant="body2">
                          {formatDate(promo.starts_at)} - {formatDate(promo.ends_at)}
                        </Typography>
                      </Box>
                      {promo.code && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopy />}
                          onClick={() => handleCopyCode(promo.code)}
                          sx={{ 
                            mt: 1, 
                            borderColor: getPromotionColor(index), 
                            color: getPromotionColor(index),
                          }}
                        >
                          Mã: {promo.code}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">
                Hiện tại chưa có chương trình khuyến mãi nào. Vui lòng quay lại sau!
              </Alert>
            </Grid>
          )}
        </Grid>

        {/* Promotion Types */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CardGiftcard color="primary" /> Các loại khuyến mãi
        </Typography>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {promotionTypes.map((type, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', gap: 3 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        bgcolor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {type.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {type.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {type.description}
                      </Typography>
                      <Alert severity="info" sx={{ py: 0 }}>
                        {type.example}
                      </Alert>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Tips Section */}
        <Paper sx={{ p: 3, mb: 5, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents sx={{ color: '#ffc107' }} /> Mẹo săn deal hiệu quả
          </Typography>
          <Grid container spacing={2}>
            {tips.map((tip, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <CheckCircle sx={{ color: '#4caf50', mt: 0.5 }} />
                  <Typography>{tip}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* FAQ Section */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info color="primary" /> Câu hỏi thường gặp
        </Typography>
        <Box sx={{ mb: 5 }}>
          {faqItems.map((item, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChange(`panel${index}`)}
              sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight={500}>{item.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{item.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* CTA Section */}
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
          }}
        >
          <Redeem sx={{ fontSize: 60, mb: 2, color: '#ff6b35' }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Khám phá ngay các ưu đãi hấp dẫn!
          </Typography>
          <Typography sx={{ mb: 3, opacity: 0.8 }}>
            Hàng ngàn sản phẩm đang giảm giá sốc. Đừng bỏ lỡ!
          </Typography>
          <Button
            component={Link}
            to="/promotions"
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              bgcolor: '#ff6b35',
              px: 4,
              py: 1.5,
              fontSize: 16,
              '&:hover': { bgcolor: '#e55a2b' },
            }}
          >
            Xem tổng hợp khuyến mãi
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}

export default PromotionGuide
