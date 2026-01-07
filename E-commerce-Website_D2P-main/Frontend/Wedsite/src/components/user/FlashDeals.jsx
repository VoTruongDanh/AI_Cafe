import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Paper,
  Skeleton,
  Card,
  CardContent,
} from '@mui/material'
import { FlashOn, Timer, ArrowForward } from '@mui/icons-material'
import ProductCard from '../common/ProductCard'
import { productsApi, promotionsApi } from '../../services/api'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'

const FlashDeals = () => {
  const navigate = useNavigate()
  const [flashDeals, setFlashDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [flashSaleEndTime, setFlashSaleEndTime] = useState(null)

  // Fetch flash deals data
  const fetchFlashDeals = useCallback(async () => {
    try {
      console.log('🔄 [FlashDeals] Fetching flash deals...');
      
      // Lấy sản phẩm Flash Sale từ API (is_flash_sale = true)
      const response = await productsApi.getProducts({
        limit: 6,
        filters: { is_flash_sale: true }
      })
      const products = response.data?.data || [];
      console.log('✅ [FlashDeals] Flash deals fetched:', products.length, 'products');
      if (products.length > 0) {
        console.log('   Products:', products.map(p => p.name));
      }
      setFlashDeals(products)
    } catch (error) {
      console.error('❌ [FlashDeals] Error fetching flash deals:', error)
    } finally {
      setLoading(false)
    }
  }, []) // No dependencies - function is stable

  const fetchFlashSalePromotion = useCallback(async () => {
    try {
      // Lấy tất cả promotions đang active
      const response = await promotionsApi.getPromotions({ 
        only_active: true
      })
      const promotions = response.data?.data || response.data || []
      
      // Tìm flash sale promotion đang active và có thời gian kết thúc (filter ở client)
      const now = new Date()
      const activeFlashSale = promotions.find(promo => {
        if (!promo.is_flash_sale) return false
        const endDate = promo.ends_at ? new Date(promo.ends_at) : null
        const startDate = promo.starts_at ? new Date(promo.starts_at) : null
        
        // Kiểm tra promotion đang trong thời gian hoạt động
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
  }, []) // No dependencies - function is stable

  // Refresh function for auto-refresh hook - Memoized properly
  const refreshFlashDeals = useCallback(async () => {
    console.log('🔄 refreshFlashDeals called');
    await Promise.all([
      fetchFlashDeals(),
      fetchFlashSalePromotion()
    ])
  }, [fetchFlashDeals, fetchFlashSalePromotion]) // Stable dependencies

  // ❌ Removed WebSocket - Không cần realtime updates nữa

  // 🔄 Auto-refresh: Tự động cập nhật Flash Sale mỗi 5 phút
  useAutoRefresh(refreshFlashDeals, {
    interval: 5 * 60 * 1000, // 5 phút (giảm tần suất refresh)
    enabled: true,
    refreshOnFocus: false, // Tắt refresh khi focus
    refreshOnMount: true, // Fetch ngay khi mount
  })

  // Countdown timer effect
  useEffect(() => {
    // Chỉ chạy countdown khi có thời gian kết thúc thực tế
    if (!flashSaleEndTime) return

    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const endTime = new Date(flashSaleEndTime).getTime()
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
      return remaining
    }

    // Set initial time
    setTimeRemaining(calculateTimeRemaining())

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)
      
      // Khi hết thời gian, refresh để lấy Flash Sale mới (nếu có)
      if (remaining <= 0) {
        clearInterval(timer)
        refreshFlashDeals()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [flashSaleEndTime, refreshFlashDeals])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0')
    }
  }

  // Skeleton loading
  const ProductSkeleton = () => (
    <Card sx={{ height: '100%' }}>
      <Skeleton variant="rectangular" height={180} />
      <CardContent>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </CardContent>
    </Card>
  )

  const time = formatTime(timeRemaining)

  // ✅ Ẩn component nếu không có flash deals và không đang loading
  if (!loading && flashDeals.length === 0) {
    console.log('🚫 [FlashDeals] No flash deals, hiding component');
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="xl" sx={{ mb: 5 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            overflow: 'hidden',
            borderRadius: 2,
            border: '2px solid #e63946',
          }}
        >
        {/* Flash Deals Header - NguyenKim Style */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #e63946 0%, #c62828 100%)',
            color: 'white',
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlashOn sx={{ fontSize: 40, color: '#ffd93d' }} />
            </Box>
            <Box>
              <Typography 
                variant="h5" 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '18px', md: '24px' },
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                ⚡ FLASH SALE - GIỜ VÀNG GIÁ SỐC
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.95,
                  fontSize: { xs: '12px', md: '14px' },
                  mt: 0.5
                }}
              >
                🔥 Săn deal ngay - Số lượng có hạn!
              </Typography>
            </Box>
          </Box>

          {/* Countdown Timer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: 'rgba(0,0,0,0.25)',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Timer sx={{ fontSize: 24 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { label: 'Giờ', value: time.hours },
                { label: 'Phút', value: time.minutes },
                { label: 'Giây', value: time.seconds }
              ].map((item, index) => (
                <Box key={item.label} sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: 'white',
                      color: '#e63946',
                      fontWeight: 'bold',
                      fontSize: { xs: '18px', md: '24px' },
                      px: { xs: 1, md: 1.5 },
                      py: { xs: 0.5, md: 0.8 },
                      borderRadius: 1,
                      minWidth: { xs: 40, md: 50 },
                      fontFamily: 'monospace',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    {item.value}
                  </Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: { xs: '9px', md: '10px' },
                      mt: 0.3,
                      display: 'block',
                      opacity: 0.9
                    }}
                  >
                    {item.label}
                  </Typography>
                  {index < 2 && (
                    <Typography 
                      sx={{ 
                        position: 'absolute',
                        right: -8,
                        top: '30%',
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}
                    >
                      :
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

          {/* Flash Deals Products */}
          <Box sx={{ p: 3, bgcolor: 'white' }}>
            <Grid container spacing={2}>
              {loading ? (
                [...Array(6)].map((_, index) => (
                  <Grid item xs={6} sm={4} md={2} key={index}>
                    <ProductSkeleton />
                  </Grid>
                ))
              ) : flashDeals.length > 0 ? (
                flashDeals.map((product, index) => (
                  <Grid item xs={6} sm={4} md={2} key={product.id}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography textAlign="center" color="text.secondary" py={4}>
                    Đang cập nhật sản phẩm Flash Sale...
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* View More Button */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/promotions?tab=flash-sale')}
                  sx={{
                    bgcolor: '#e63946',
                    px: 5,
                    py: 1.5,
                    fontSize: '15px',
                    '&:hover': { bgcolor: '#d62839' },
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(230,57,70,0.3)',
                  }}
                >
                  Xem tất cả Flash Deal
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Paper>
      </Container>
    </motion.div>
  )
}

export default FlashDeals
