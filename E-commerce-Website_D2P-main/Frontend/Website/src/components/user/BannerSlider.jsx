import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, IconButton } from '@mui/material'
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

const banners = [
  {
    id: 1,
    image: '/images/banner/banner_center.png',
    link: '/products?filter=promotion',
  },
  {
    id: 2,
    image: '/images/banner/banner_center_2.png',
    link: '/products?category=laptop',
  },
  {
    id: 3,
    image: '/images/banner/banner_center_3.png',
    link: '/products',
  },
  {
    id: 4,
    image: '/images/banner/banner_center_4.png',
    link: '/products',
  },
]

const BannerSlider = () => {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState(new Set())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleImageError = (imageUrl) => {
    setImageErrors((prev) => new Set(prev).add(imageUrl))
  }

  const goToPrevious = () => {
    setCurrentIndex((currentIndex - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setCurrentIndex((currentIndex + 1) % banners.length)
  }

  const currentBanner = banners[currentIndex]

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: { xs: 200, sm: 280, md: 380, lg: 450 }, 
      overflow: 'hidden', 
      borderRadius: 1,
      zIndex: 1,
      bgcolor: '#f5f5f5',
      cursor: 'pointer',
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
          onClick={() => navigate(currentBanner.link)}
        >
          {/* Banner Image - Full display without text overlay */}
          {!imageErrors.has(currentBanner.image) ? (
            <Box
              component="img"
              src={currentBanner.image}
              alt={`Banner ${currentBanner.id}`}
              onError={() => handleImageError(currentBanner.image)}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #e63946 0%, #c62828 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <IconButton
        onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
        sx={{
          position: 'absolute',
          left: { xs: 8, md: 16 },
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255,255,255,0.9)',
          color: '#e63946',
          width: { xs: 32, md: 40 },
          height: { xs: 32, md: 40 },
          '&:hover': { bgcolor: 'white', transform: 'translateY(-50%) scale(1.1)' },
          zIndex: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <ArrowBackIos sx={{ fontSize: { xs: 14, md: 18 }, ml: 0.5 }} />
      </IconButton>

      <IconButton
        onClick={(e) => { e.stopPropagation(); goToNext(); }}
        sx={{
          position: 'absolute',
          right: { xs: 8, md: 16 },
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255,255,255,0.9)',
          color: '#e63946',
          width: { xs: 32, md: 40 },
          height: { xs: 32, md: 40 },
          '&:hover': { bgcolor: 'white', transform: 'translateY(-50%) scale(1.1)' },
          zIndex: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <ArrowForwardIos sx={{ fontSize: { xs: 14, md: 18 } }} />
      </IconButton>

      {/* Dots indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 10, md: 16 },
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          zIndex: 2,
        }}
      >
        {banners.map((_, index) => (
          <Box
            key={index}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
            sx={{
              width: currentIndex === index ? 20 : 8,
              height: 8,
              borderRadius: 4,
              bgcolor: currentIndex === index ? 'white' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        ))}
      </Box>
    </Box>
  )
}

export default BannerSlider

