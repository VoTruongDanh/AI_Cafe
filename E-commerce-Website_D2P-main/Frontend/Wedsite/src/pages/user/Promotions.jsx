import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Skeleton,
  Paper,
  Tabs,
  Tab,
} from '@mui/material'
import {
  LocalOffer,
  Percent,
  Timer,
  Whatshot,
  Star,
  NewReleases,
  Bolt,
  ArrowForward,
  FlashOn,
} from '@mui/icons-material'
import { Link, useSearchParams } from 'react-router-dom'
import { productsApi, promotionsApi } from '../../services/api'
import { toast } from 'react-toastify'
import ProductCard from '../../components/common/ProductCard'

const Promotions = () => {
  const [searchParams] = useSearchParams()
  const [flashSaleProducts, setFlashSaleProducts] = useState([])
  const [specialPromoProducts, setSpecialPromoProducts] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [bestsellerProducts, setBestsellerProducts] = useState([])
  const [newProducts, setNewProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [flashSaleEndTime, setFlashSaleEndTime] = useState(null)

  // Map tab param to tab index
  const tabMapping = {
    'flash-sale': 1,
    'promotion': 2,
    'featured': 3,
    'bestseller': 4,
    'new': 5,
  }

  // Scroll to top when page loads or tab changes from URL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Set active tab from URL param
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabMapping[tabParam] !== undefined) {
      setActiveTab(tabMapping[tabParam])
      // Scroll to top when tab changes from URL
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [searchParams])

  useEffect(() => {
    fetchAllProducts()
    fetchFlashSalePromotion()
  }, [])

  // Countdown timer - chỉ chạy khi có thời gian kết thúc thực tế
  useEffect(() => {
    if (!flashSaleEndTime) return

    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const endTime = new Date(flashSaleEndTime).getTime()
      return Math.max(0, Math.floor((endTime - now) / 1000))
    }

    setTimeRemaining(calculateTimeRemaining())

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)
      if (remaining <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [flashSaleEndTime])

  const fetchFlashSalePromotion = async () => {
    try {
      const response = await promotionsApi.getPromotions({ is_active: true })
      const promotions = response.data?.data || response.data || []
      
      const now = new Date()
      const activeFlashSale = promotions.find(promo => {
        if (!promo.is_flash_sale) return false
        const endDate = promo.ends_at ? new Date(promo.ends_at) : null
        const startDate = promo.starts_at ? new Date(promo.starts_at) : null
        if (startDate && now < startDate) return false
        if (endDate && now > endDate) return false
        return true
      })

      if (activeFlashSale?.ends_at) {
        setFlashSaleEndTime(activeFlashSale.ends_at)
      }
    } catch (error) {
      console.error('Error fetching flash sale promotion:', error)
    }
  }

  const fetchAllProducts = async () => {
    setLoading(true)
    try {
      const [flashRes, specialRes, featuredRes, bestsellerRes, newRes] = await Promise.all([
        // Flash Sale - sản phẩm có khuyến mãi flash sale (is_flash_sale = true)
        productsApi.getProducts({ limit: 8, filters: { is_flash_sale: true } }),
        // Khuyến mãi đặc biệt - sản phẩm giảm giá thường (không phải flash sale)
        productsApi.getProducts({ limit: 8, filters: { has_promotion: true } }),
        // Sản phẩm nổi bật
        productsApi.getProducts({ limit: 8, filters: { is_featured: true } }),
        // Bán chạy nhất
        productsApi.getProducts({ limit: 8, sort: 'bestseller' }),
        // Sản phẩm mới
        productsApi.getProducts({ limit: 8, sort: 'latest' }),
      ])

      console.log('API Responses:', { flashRes, specialRes, featuredRes, bestsellerRes, newRes })

      setFlashSaleProducts(flashRes.data?.data || [])
      setSpecialPromoProducts(specialRes.data?.data || [])
      setFeaturedProducts(featuredRes.data?.data || [])
      setBestsellerProducts(bestsellerRes.data?.data || [])
      setNewProducts(newRes.data?.data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
    }
  }

  const time = formatTime(timeRemaining)

  // Skeleton loading component
  const ProductSkeleton = () => (
    <Card sx={{ height: '100%' }}>
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </CardContent>
    </Card>
  )

  const sections = [
    {
      id: 'promotion',
      title: 'FLASH SALE - GIỜ VÀNG GIÁ SỐC',
      subtitle: '🔥 Săn deal ngay - Số lượng có hạn!',
      icon: <FlashOn sx={{ fontSize: 32, color: '#e63946' }} />,
      products: flashSaleProducts,
      borderColor: '#e63946',
      showTimer: true,
    },
    {
      id: 'special',
      title: 'KHUYẾN MÃI ĐẶC BIỆT',
      subtitle: 'Giá tốt nhất - Số lượng có hạn',
      icon: <Bolt sx={{ fontSize: 32, color: '#333' }} />,
      products: specialPromoProducts,
      borderColor: '#e0e0e0',
    },
    {
      id: 'featured',
      title: 'SẢN PHẨM NỔI BẬT',
      subtitle: '⭐ Được đánh giá cao nhất',
      icon: <Star sx={{ fontSize: 32, color: '#ffc107' }} />,
      products: featuredProducts,
      borderColor: '#e0e0e0',
    },
    {
      id: 'bestseller',
      title: 'BÁN CHẠY NHẤT',
      subtitle: '🔥 Top sản phẩm được mua nhiều nhất',
      icon: <Whatshot sx={{ fontSize: 32, color: '#ff6b6b' }} />,
      products: bestsellerProducts,
      borderColor: '#e0e0e0',
    },
    {
      id: 'new',
      title: 'SẢN PHẨM MỚI',
      subtitle: '⚡ Cập nhật liên tục hàng tuần',
      icon: <NewReleases sx={{ fontSize: 32, color: '#333' }} />,
      products: newProducts,
      borderColor: '#e0e0e0',
    },
  ]

  const tabLabels = [
    { label: 'Tất cả', icon: <LocalOffer /> },
    { label: 'Flash Sale', icon: <FlashOn /> },
    { label: 'Khuyến mãi', icon: <Bolt /> },
    { label: 'Nổi bật', icon: <Star /> },
    { label: 'Bán chạy', icon: <Whatshot /> },
    { label: 'Mới nhất', icon: <NewReleases /> },
  ]

  const getFilteredSections = () => {
    if (activeTab === 0) return sections
    return [sections[activeTab - 1]]
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Filter Tabs */}
        <Paper sx={{ mb: 4, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 60,
                fontSize: 14,
              },
              '& .Mui-selected': {
                color: '#e63946 !important',
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#e63946',
                height: 3,
              },
            }}
          >
            {tabLabels.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>

        {/* Product Sections */}
        {getFilteredSections().map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <Paper
              sx={{
                mb: 4,
                borderRadius: 3,
                overflow: 'hidden',
                border: section.id === 'promotion' ? `2px solid ${section.borderColor}` : '1px solid #e0e0e0',
              }}
            >
              {/* Section Header */}
              <Box
                sx={{
                  bgcolor: 'white',
                  color: '#333',
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                  borderBottom: section.id === 'promotion' ? `2px solid ${section.borderColor}` : '1px solid #e0e0e0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      bgcolor: '#f5f5f5',
                      p: 1.5,
                      borderRadius: 2,
                      display: 'flex',
                    }}
                  >
                    {section.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#333' }}>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {section.subtitle}
                    </Typography>
                  </Box>
                </Box>

                {/* Timer for Flash Sale */}
                {section.showTimer && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      bgcolor: '#e63946',
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    <Timer sx={{ fontSize: 24, color: 'white' }} />
                    <Typography fontWeight={600} sx={{ color: 'white' }}>Kết thúc sau:</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[
                        { label: 'Giờ', value: time.hours },
                        { label: 'Phút', value: time.minutes },
                        { label: 'Giây', value: time.seconds },
                      ].map((item, index) => (
                        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              bgcolor: 'white',
                              color: '#e63946',
                              fontWeight: 'bold',
                              fontSize: 20,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              minWidth: 45,
                              textAlign: 'center',
                            }}
                          >
                            {item.value}
                          </Box>
                          {index < 2 && (
                            <Typography sx={{ mx: 0.5, fontWeight: 'bold', fontSize: 20, color: 'white' }}>
                              :
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Products Grid */}
              <Box sx={{ p: 3, bgcolor: 'white' }}>
                <Grid container spacing={2}>
                  {loading ? (
                    [...Array(8)].map((_, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <ProductSkeleton />
                      </Grid>
                    ))
                  ) : section.products.length > 0 ? (
                    section.products.map((product, index) => (
                      <Grid item xs={6} sm={4} md={3} key={product.id}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography textAlign="center" color="text.secondary" py={4}>
                        Đang cập nhật sản phẩm...
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {/* View More Button */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Button
                    component={Link}
                    to={`/products?filter=${section.id}`}
                    variant="outlined"
                    endIcon={<ArrowForward />}
                    sx={{
                      borderColor: section.id === 'promotion' ? '#e63946' : '#333',
                      color: section.id === 'promotion' ? '#e63946' : '#333',
                      fontWeight: 600,
                      px: 4,
                      '&:hover': {
                        borderColor: section.id === 'promotion' ? '#e63946' : '#333',
                        bgcolor: section.id === 'promotion' ? '#fff5f5' : '#f5f5f5',
                      },
                    }}
                  >
                    Xem tất cả
                  </Button>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        ))}

        {/* Bottom CTA */}
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Không tìm thấy sản phẩm bạn cần?
          </Typography>
          <Typography sx={{ mb: 3, opacity: 0.9 }}>
            Khám phá thêm hàng ngàn sản phẩm khác tại ElectroShop
          </Typography>
          <Button
            component={Link}
            to="/products"
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#ff6b35',
              px: 5,
              py: 1.5,
              fontSize: 16,
              fontWeight: 600,
              '&:hover': { bgcolor: '#e55a2b' },
            }}
          >
            Xem tất cả sản phẩm
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}

export default Promotions
