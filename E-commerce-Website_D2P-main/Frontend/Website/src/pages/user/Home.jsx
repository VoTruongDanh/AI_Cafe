import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import BannerSlider from '../../components/user/BannerSlider'
import FlashDeals from '../../components/user/FlashDeals'
import BrandSection from '../../components/common/BrandSection'
import RecentlyViewed from '../../components/common/RecentlyViewed'
import ProductCard from '../../components/common/ProductCard'
import CategoryMenu from '../../components/home/CategoryMenu'
import { usePreloader } from '../../contexts/PreloaderContext'
import { useHomeProducts } from '../../hooks/useHomeProducts'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Chip,
} from '@mui/material'
import {
  LocalOffer,
  Bolt,
  Star,
  Whatshot,
  NewReleases,
  LocalShipping,
  SupportAgent,
  ArrowForward,
  PhoneAndroid,
  Tv,
  Kitchen,
  Blender,
  Laptop,
  AcUnit,
  LocalLaundryService,
  Smartphone,
  Home as HomeIcon,
  Headphones,
  Router,
  Devices,
  TrendingUp,
} from '@mui/icons-material'
import { motion } from 'framer-motion'

const Home = () => {
  const navigate = useNavigate()
  const { categories } = useSelector((state) => state.categories)
  const { products: recentlyViewedProducts } = useSelector((state) => state.recentlyViewed)
  const { items: cartItems } = useSelector((state) => state.cart)
  const { markDataReady } = usePreloader()
  
  // ✅ Debug: Log khi component mount/unmount (chỉ trong development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🏠 [Home] Component MOUNTED');
      return () => {
        console.log('🏠 [Home] Component UNMOUNTED');
      };
    }
  }, []);
  
  // ✅ DÙNG REACT QUERY - Tự động cache, không gọi API lại khi quay lại trang
  const {
    featuredProducts,
    newProducts,
    bestsellers,
    promotionProducts,
    isLoading,
    invalidateAll,
  } = useHomeProducts()
  
  const [recommendedProducts, setRecommendedProducts] = useState([])

  // ❌ Removed WebSocket - Không cần realtime updates nữa

  // Map icon và màu cho từng danh mục
  const getCategoryStyle = (categoryName) => {
    const styleMap = {
      'Điện tử & Viễn thông': { icon: PhoneAndroid, color: '#e91e63' },      // Hồng
      'Tivi & Màn hình thông minh': { icon: Tv, color: '#3f51b5' },          // Xanh indigo
      'Tủ lạnh & Tủ đông': { icon: Kitchen, color: '#f44336' },              // Đỏ
      'Thiết bị nhà bếp': { icon: Blender, color: '#ff5722' },               // Cam đậm
      'Laptop & Máy tính cá nhân': { icon: Laptop, color: '#2196f3' },       // Xanh dương
      'Điện lạnh': { icon: AcUnit, color: '#00bcd4' },                       // Cyan
      'Máy giặt & Sấy': { icon: LocalLaundryService, color: '#9c27b0' },     // Tím
      'Điện thoại thông minh': { icon: Smartphone, color: '#4caf50' },       // Xanh lá
      'Gia dụng thông minh': { icon: HomeIcon, color: '#ff9800' },           // Cam
      'Phụ kiện công nghệ': { icon: Headphones, color: '#607d8b' },          // Xám xanh
      'Thiết bị mạng': { icon: Router, color: '#795548' },                   // Nâu
    }
    return styleMap[categoryName] || { icon: Devices, color: '#e63946' }
  }

  // ✅ Đánh dấu data ready khi React Query load xong (chỉ chạy 1 lần)
  useEffect(() => {
    if (!isLoading) {
      markDataReady()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  // Logic gợi ý thông minh - Wrap trong useCallback để tránh re-render
  const calculateRecommendations = useCallback((featured, newProds, bestsellers) => {
    let recommended = []
    const allProducts = [...featured, ...newProds, ...bestsellers]
    
    // Loại bỏ duplicate
    const uniqueProducts = allProducts.filter((product, index, self) =>
      index === self.findIndex((p) => p.id === product.id)
    )

    // STRATEGY 1: Dựa trên lịch sử xem (40% weight)
    if (recentlyViewedProducts.length > 0) {
      const viewedCategories = [...new Set(recentlyViewedProducts.map(p => p.category_id))]
      const viewedIds = recentlyViewedProducts.map(p => p.id)
      
      const sameCategoryProducts = uniqueProducts.filter(p => 
        viewedCategories.includes(p.category_id) && 
        !viewedIds.includes(p.id)
      )
      
      recommended.push(...sameCategoryProducts.slice(0, 3))
    }

    // STRATEGY 2: Dựa trên giỏ hàng (30% weight)
    if (cartItems.length > 0) {
      const cartCategories = [...new Set(cartItems.map(item => item.product?.category_id))]
      const cartIds = cartItems.map(item => item.product_id)
      
      const relatedProducts = uniqueProducts.filter(p => 
        cartCategories.includes(p.category_id) && 
        !cartIds.includes(p.id) &&
        !recommended.find(r => r.id === p.id)
      )
      
      recommended.push(...relatedProducts.slice(0, 2))
    }

    // STRATEGY 3: Trending + High Rating (30% weight)
    const trendingProducts = uniqueProducts
      .filter(p => 
        (p.sold_count > 20 || p.rating >= 4.5) &&
        !recommended.find(r => r.id === p.id)
      )
      .sort((a, b) => {
        const scoreA = (a.sold_count || 0) * 0.6 + (a.rating || 0) * 10
        const scoreB = (b.sold_count || 0) * 0.6 + (b.rating || 0) * 10
        return scoreB - scoreA
      })
    
    recommended.push(...trendingProducts.slice(0, 2))

    // Nếu chưa đủ 6 sản phẩm, thêm từ featured
    if (recommended.length < 6) {
      const remaining = uniqueProducts
        .filter(p => !recommended.find(r => r.id === p.id))
        .slice(0, 6 - recommended.length)
      recommended.push(...remaining)
    }

    // Giới hạn 6 sản phẩm
    setRecommendedProducts(recommended.slice(0, 6))
  }, [recentlyViewedProducts, cartItems])

  // Cập nhật recommendations khi có data từ React Query (chỉ khi featuredProducts thay đổi thực sự)
  useEffect(() => {
    if (featuredProducts.length > 0) {
      calculateRecommendations(featuredProducts, newProducts, bestsellers)
    }
  }, [featuredProducts, newProducts, bestsellers, calculateRecommendations])

  // Component cho Side Banner - Memoized để tránh re-render
  const SideBanner = useCallback(({ side }) => (
    <Box
      sx={{
        width: '100%',
        height: 'auto',
        cursor: 'pointer',
        transition: 'all 0.3s',
        borderRadius: side === 'left' ? '0 12px 12px 0' : '12px 0 0 12px',
        boxShadow: side === 'left' ? '4px 0 15px rgba(0,0,0,0.15)' : '-4px 0 15px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        '&:hover': { 
          transform: 'scale(1.02)',
          boxShadow: side === 'left' ? '6px 0 20px rgba(0,0,0,0.2)' : '-6px 0 20px rgba(0,0,0,0.2)',
        },
      }}
      onClick={() => navigate('/products?filter=promotion')}
    >
      <Box
        component="video"
        src="/images/banner.mp4"
        autoPlay
        loop
        muted
        playsInline
        sx={{
          width: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'cover',
        }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.style.background = 'linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%)';
          e.target.parentElement.innerHTML = `
            <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;padding:16px;text-align:center;">
              <div style="font-size:24px;margin-bottom:8px;">🎁</div>
              <div style="font-size:14px;font-weight:bold;margin-bottom:4px;">SALE</div>
              <div style="font-size:28px;font-weight:900;color:#ffd93d;">50%</div>
              <div style="font-size:11px;margin-top:8px;opacity:0.9;">Xem ngay</div>
            </div>
          `;
        }}
      />
    </Box>
  ), [navigate])

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', position: 'relative' }}>
      {/* Main Layout with Side Banners */}
      <Box sx={{ display: 'flex', maxWidth: '1920px', margin: '0 auto' }}>
        {/* Left Side Banner - Trong layout */}
        <Box
          sx={{
            width: '160px',
            flexShrink: 0,
            display: { xs: 'none', xl: 'block' },
            pt: 2,
          }}
        >
          <Box sx={{ position: 'sticky', top: '80px' }}>
            <SideBanner side="left" />
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Banner Slider Section - NguyenKim Layout */}
          <Container maxWidth="xl" sx={{ pt: 2, pb: 3 }}>
            <Grid container spacing={1.5}>
              {/* Left - Category Menu */}
          <Grid item xs={12} md={2.5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <CategoryMenu />
          </Grid>

          {/* Center - Main Banner */}
          <Grid item xs={12} md={6.5}>
            <Box sx={{ height: { xs: 200, sm: 280, md: 380, lg: 450 } }}>
              <BannerSlider />
            </Box>
          </Grid>
          
          {/* Right - Side Banners */}
          <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: { md: 380, lg: 450 } }}>
              {/* Top Banner - Khuyến mãi */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': { 
                    transform: 'translateY(-3px)', 
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)' 
                  },
                  transition: 'all 0.3s',
                }}
                onClick={() => navigate('/products?filter=promotion')}
              >
                <Box
                  component="img"
                  src="/images/banner/banner_right_1.png"
                  alt="Ưu đãi đặc biệt"
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback gradient */}
                <Box
                  sx={{
                    display: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, #e63946 0%, #ff6b6b 100%)',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    p: 2,
                  }}
                >
                  <LocalOffer sx={{ fontSize: 40, mb: 1, color: '#ffd93d' }} />
                  <Typography variant="h6" fontWeight="800" sx={{ textAlign: 'center' }}>
                    Ưu đãi đặc biệt
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Giảm đến 50%
                  </Typography>
                </Box>
              </Paper>
              
              {/* Bottom Banner - Hàng mới về */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': { 
                    transform: 'translateY(-3px)', 
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)' 
                  },
                  transition: 'all 0.3s',
                }}
                onClick={() => navigate('/products?sort=newest')}
              >
                <Box
                  component="img"
                  src="/images/banner/banner_right_2.png"
                  alt="Hàng mới về"
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback gradient */}
                <Box
                  sx={{
                    display: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    p: 2,
                  }}
                >
                  <NewReleases sx={{ fontSize: 40, mb: 1, color: '#ffd93d' }} />
                  <Typography variant="h6" fontWeight="800" sx={{ textAlign: 'center' }}>
                    Hàng mới về
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Cập nhật hàng ngày
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="xl" sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {[
            { icon: <LocalShipping sx={{ fontSize: 32, color: '#e63946' }} />, title: 'Giao hàng nhanh 2h', desc: 'Nội thành TP.HCM' },
            { icon: <Box component="img" src="/home/icon_shied_check.jpg" alt="Bảo hành" sx={{ width: 32, height: 32 }} />, title: 'Bảo hành chính hãng', desc: 'Hỗ trợ 24/7' },
            { icon: <SupportAgent sx={{ fontSize: 32, color: '#e63946' }} />, title: 'Tư vấn miễn phí', desc: 'Hotline: 1900 1599' },
            { icon: <LocalOffer sx={{ fontSize: 32, color: '#e63946' }} />, title: 'Giá tốt nhất', desc: 'Hoàn tiền nếu rẻ hơn' },
          ].map((service, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'white',
                  borderRadius: 2,
                  border: '1px solid #f0f0f0',
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(230,57,70,0.15)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Box sx={{ mb: 1 }}>{service.icon}</Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, color: '#333' }}>
                  {service.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                  {service.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Flash Deals Section */}
      <FlashDeals />

      {/* Categories Section - NguyenKim Style */}
      {categories.length > 0 && (
        <Container maxWidth="xl" sx={{ mb: 5 }}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: '#ff4444',
                    p: 1,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 68, 68, 0.3)',
                  }}
                >
                  <Whatshot sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  sx={{ 
                    color: '#333',
                    fontSize: { xs: '20px', md: '24px' },
                    position: 'relative',
                    background: 'linear-gradient(135deg, #e63946 0%, #ff6b6b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -8,
                      left: 0,
                      width: 60,
                      height: 4,
                      background: 'linear-gradient(90deg, #e63946 0%, #ff6b6b 100%)',
                      borderRadius: 2,
                    }
                  }}
                >
                  DANH MỤC NỔI BẬT
                </Typography>
              </Box>
              <Button
                endIcon={<ArrowForward />}
                onClick={() => navigate('/products')}
                sx={{
                  color: '#e63946',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Xem tất cả
              </Button>
            </Box>
            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={16}
              slidesPerView={2}
              loop={true}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              navigation={true}
              breakpoints={{
                640: {
                  slidesPerView: 3,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 4,
                  spaceBetween: 16,
                },
                1024: {
                  slidesPerView: 5,
                  spaceBetween: 16,
                },
                1280: {
                  slidesPerView: 6,
                  spaceBetween: 16,
                },
              }}
              style={{ 
                padding: '10px 0',
                '--swiper-navigation-color': '#e63946',
                '--swiper-navigation-size': '30px',
              }}
            >
              {categories.map((category, index) => {
                const { icon: IconComponent, color } = getCategoryStyle(category.name)
                
                // Sử dụng total_products_count (bao gồm cả children) hoặc products_count
                const productsCount = category.total_products_count ?? category.products_count ?? 0
                const isHot = productsCount > 15 // Danh mục có > 15 sản phẩm là HOT
                
                return (
                  <SwiperSlide key={category.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.05,
                        duration: 0.4,
                        ease: 'easeOut'
                      }}
                      whileHover={{ y: -8 }}
                    >
                      <Card
                        elevation={0}
                        onClick={() => navigate(`/products?category=${category.id}`)}
                        sx={{
                          cursor: 'pointer',
                          border: '1px solid #f0f0f0',
                          background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
                          position: 'relative',
                          overflow: 'visible',
                          '&:hover': { 
                            border: `1px solid ${color}`,
                            background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                            boxShadow: `0 8px 24px ${color}30`,
                            '& .category-icon': {
                              transform: 'scale(1.1) rotate(5deg)',
                            },
                            '& .product-count': {
                              color: color,
                            }
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          borderRadius: 3,
                          height: '100%',
                        }}
                      >
                        {/* Badge HOT */}
                        {isHot && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 + 0.3, type: 'spring' }}
                          >
                            <Chip
                              icon={<Whatshot sx={{ fontSize: 14 }} />}
                              label="HOT"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                bgcolor: '#ff4444',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '10px',
                                height: 22,
                                zIndex: 1,
                                boxShadow: '0 2px 8px rgba(255, 68, 68, 0.4)',
                                '& .MuiChip-icon': {
                                  color: 'white',
                                  marginLeft: '4px',
                                }
                              }}
                            />
                          </motion.div>
                        )}

                        <CardContent sx={{ textAlign: 'center', p: 2.5, '&:last-child': { pb: 2.5 } }}>
                          {/* Icon với pulse animation */}
                          <motion.div
                            animate={{ 
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <Box
                              className="category-icon"
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                bgcolor: '#fff',
                                border: `2px solid ${color}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 12px',
                                transition: 'all 0.3s ease',
                                boxShadow: `0 4px 12px ${color}20`,
                              }}
                            >
                              <IconComponent sx={{ color: color, fontSize: 30 }} />
                            </Box>
                          </motion.div>

                          {/* Tên danh mục */}
                          <Typography 
                            variant="body2" 
                            align="center"
                            sx={{ 
                              fontWeight: 600,
                              fontSize: '14px',
                              color: '#333',
                              lineHeight: 1.3,
                              mb: 0.5,
                            }}
                          >
                            {category.name}
                          </Typography>

                          {/* Số sản phẩm */}
                          <Typography 
                            className="product-count"
                            variant="caption" 
                            align="center"
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5,
                              fontSize: '12px',
                              color: 'text.secondary',
                              fontWeight: 500,
                              transition: 'color 0.3s ease',
                            }}
                          >
                            <TrendingUp sx={{ fontSize: 14 }} />
                            {productsCount} SP
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </Paper>
        </Container>
      )}

      {/* Brand Showcase */}
      <BrandSection />

      {/* Promotion Products - Special Section */}
      {promotionProducts.length > 0 && (
        <Container maxWidth="xl" sx={{ mb: 5 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              bgcolor: 'white', 
              borderRadius: 2,
              border: '2px solid #e63946',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: '#e63946',
                    p: 1,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bolt sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold" 
                    sx={{ color: '#e63946', fontSize: { xs: '20px', md: '24px' } }}
                  >
                    KHUYẾN MÃI ĐẶC BIỆT
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                    Giá tốt nhất - Số lượng có hạn
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/products?filter=special')}
                sx={{
                  bgcolor: '#e63946',
                  '&:hover': { bgcolor: '#d62839' },
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Xem tất cả
              </Button>
            </Box>
            <Grid container spacing={2}>
              {promotionProducts.map((product) => (
                <Grid item xs={6} sm={4} md={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Container>
      )}

      {/* Featured Products */}
      <Container maxWidth="xl" sx={{ mb: 5 }}>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Star sx={{ color: '#ffd93d', fontSize: 32 }} />
              <Typography 
                variant="h5" 
                fontWeight="bold"
                sx={{ color: '#333', fontSize: { xs: '20px', md: '24px' } }}
              >
                SẢN PHẨM NỔI BẬT
              </Typography>
            </Box>
            <Button 
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/products?filter=featured')}
              sx={{
                borderColor: '#e63946',
                color: '#e63946',
                '&:hover': { 
                  bgcolor: '#fff5f5', 
                  borderColor: '#e63946' 
                },
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Xem tất cả
            </Button>
          </Box>
          <Grid container spacing={2}>
            {featuredProducts.map((product) => (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <Container maxWidth="xl" sx={{ mb: 5 }}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Whatshot sx={{ color: '#ff6b6b', fontSize: 32 }} />
                <Box>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    sx={{ color: '#333', fontSize: { xs: '20px', md: '24px' } }}
                  >
                    BÁN CHẠY NHẤT
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#ff6b6b', fontWeight: 600 }}>
                    🔥 Top sản phẩm được mua nhiều nhất
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/products?filter=bestseller')}
                sx={{
                  borderColor: '#ff6b6b',
                  color: '#ff6b6b',
                  '&:hover': { bgcolor: '#fff5f5', borderColor: '#ff6b6b' },
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Xem tất cả
              </Button>
            </Box>
            <Grid container spacing={2}>
              {bestsellers.map((product) => (
                <Grid item xs={6} sm={4} md={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Container>
      )}

      {/* New Products */}
      {newProducts.length > 0 && (
        <Container maxWidth="xl" sx={{ mb: 5, pb: 3 }}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <NewReleases sx={{ color: '#00bcd4', fontSize: 32 }} />
                <Box>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    sx={{ color: '#333', fontSize: { xs: '20px', md: '24px' } }}
                  >
                    SẢN PHẨM MỚI
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#00bcd4', fontWeight: 600 }}>
                    ⚡ Cập nhật liên tục hàng tuần
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/products?filter=new')}
                sx={{
                  borderColor: '#00bcd4',
                  color: '#00bcd4',
                  '&:hover': { bgcolor: '#e0f7fa', borderColor: '#00bcd4' },
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Xem tất cả
              </Button>
            </Box>
            <Grid container spacing={2}>
              {newProducts.map((product) => (
                <Grid item xs={6} sm={4} md={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Container>
      )}

      {/* Recommended Products Section */}
      <Container maxWidth="xl" sx={{ mb: 5 }}>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Star sx={{ color: '#ffd93d', fontSize: 32 }} />
              <Box>
                <Typography 
                  variant="h5" 
                  fontWeight="bold"
                  sx={{ color: '#333', fontSize: { xs: '20px', md: '24px' } }}
                >
                  GỢI Ý CHO BẠN
                </Typography>
                <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600 }}>
                  ⭐ Những sản phẩm được chọn riêng dành cho bạn
                </Typography>
              </Box>
            </Box>
            <Button 
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/products')}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': { bgcolor: '#f5f5ff', borderColor: '#667eea' },
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Xem tất cả
            </Button>
          </Box>
          <Grid container spacing={2}>
            {recommendedProducts.length > 0 ? (
              recommendedProducts.map((product) => (
                <Grid item xs={6} sm={4} md={2} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  Chưa có sản phẩm gợi ý
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Container>

      {/* Recently Viewed Section */}
      <Container maxWidth="xl" sx={{ py: 5 }}>
        <RecentlyViewed />
      </Container>
        </Box>
        {/* End Main Content */}

        {/* Right Side Banner - Trong layout */}
        <Box
          sx={{
            width: '160px',
            flexShrink: 0,
            display: { xs: 'none', xl: 'block' },
            pt: 2,
          }}
        >
          <Box sx={{ position: 'sticky', top: '80px' }}>
            <SideBanner side="right" />
          </Box>
        </Box>
      </Box>
      {/* End Main Layout */}
    </Box>
  )
}

export default Home
