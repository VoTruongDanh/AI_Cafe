import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'

const PremiumPageWrapper = ({ 
  title, 
  subtitle, 
  icon = '🎯',
  children,
  isDark = false 
}) => {
  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      position: 'relative',
      background: isDark 
        ? 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0f1729 100%)'
        : 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #d6e4ff 100%)',
      p: { xs: 2, sm: 3 },
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(230,57,70,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite',
        pointerEvents: 'none',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDark
          ? 'radial-gradient(circle at 20% 50%, rgba(230,57,70,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(244,162,97,0.08) 0%, transparent 50%)'
          : 'radial-gradient(circle at 20% 50%, rgba(230,57,70,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(244,162,97,0.06) 0%, transparent 50%)',
        pointerEvents: 'none',
      },
      '@keyframes gridMove': {
        '0%': { transform: 'translate(0, 0)' },
        '100%': { transform: 'translate(50px, 50px)' },
      },
    }}>
      {/* Premium Hero Header */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: -50, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
        sx={{
          background: 'linear-gradient(135deg, #E63946 0%, #F72585 35%, #7209B7 70%, #F4A261 100%)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 8s ease infinite',
          borderRadius: 5,
          p: { xs: 3, md: 5 },
          mb: 4,
          boxShadow: '0 20px 60px rgba(230, 57, 70, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset',
          position: 'relative',
          overflow: 'hidden',
          transform: 'perspective(1000px)',
          transformStyle: 'preserve-3d',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -150,
            right: -150,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse',
          },
          '@keyframes gradientShift': {
            '0%, 100%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
          },
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
            '33%': { transform: 'translate(30px, -30px) rotate(120deg)' },
            '66%': { transform: 'translate(-20px, 20px) rotate(240deg)' },
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
          <Box
            component={motion.div}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            sx={{
              fontSize: '4rem',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography 
              variant="h2" 
              fontWeight="900"
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                color: '#fff',
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ 
                color: 'rgba(255,255,255,0.95)', 
                fontSize: '1.05rem',
                fontWeight: 500,
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                mt: 0.5,
              }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  )
}

export default PremiumPageWrapper
