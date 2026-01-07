import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Typography, CircularProgress } from '@mui/material'

const Preloader = ({ isLoading }) => {
  // Fixed positions for particles to avoid random changes on re-render
  const particles = [
    { x: -50, y: -30, color: '#e63946' },
    { x: 50, y: -40, color: '#d62839' },
    { x: -60, y: 40, color: '#e63946' },
    { x: 60, y: 30, color: '#d62839' },
    { x: -40, y: 50, color: '#e63946' },
    { x: 40, y: -50, color: '#d62839' },
  ]

  // Prevent scrolling when preloader is showing
  React.useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden'
    } else {
      // Allow exit animation to complete before allowing scroll
      const timer = setTimeout(() => {
        document.body.style.overflow = ''
      }, 500) // Match exit animation duration
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isLoading])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            pointerEvents: 'auto',
          }}
        >
          {/* Main Logo/Text Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
            }}
          >
            {/* Lightning Logo Animation */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                scale: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 24,
                background: 'linear-gradient(135deg, #e63946 0%, #d62839 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 40px rgba(230, 57, 70, 0.4)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Lightning bolt SVG */}
              <motion.svg
                viewBox="0 0 100 100"
                style={{
                  width: 60,
                  height: 60,
                }}
                animate={{
                  filter: [
                    'drop-shadow(0 0 5px rgba(255,255,255,0.5))',
                    'drop-shadow(0 0 15px rgba(255,255,255,0.8))',
                    'drop-shadow(0 0 5px rgba(255,255,255,0.5))',
                  ],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <path
                  d="M55 10 L30 48 L45 48 L40 90 L70 45 L52 45 L60 10 Z"
                  fill="white"
                />
              </motion.svg>
              
              {/* Shine effect */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                }}
                animate={{
                  left: ['−100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 1,
                }}
              />
            </motion.div>

            {/* Text Animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #e63946 0%, #d62839 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: { xs: '1.75rem', sm: '2.5rem' },
                  letterSpacing: '0.02em',
                }}
              >
                ElectroShop
              </Typography>
            </motion.div>

            {/* Loading Spinner */}
            <Box
              sx={{
                position: 'relative',
                width: 50,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Outer Spinner */}
              <CircularProgress
                size={50}
                thickness={4}
                sx={{
                  color: '#e63946',
                  position: 'absolute',
                  animationDuration: '1.2s',
                }}
              />
              {/* Inner Spinner */}
              <motion.div
                animate={{
                  rotate: -360,
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  position: 'absolute',
                  width: 30,
                  height: 30,
                  border: '3px solid #d62839',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                }}
              />
            </Box>

            {/* Loading Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                Đang tải...
              </Typography>
            </motion.div>
          </motion.div>

          {/* Animated Background Particles */}
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: particle.color,
                opacity: 0.3,
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, particle.x, 0],
                y: [0, particle.y, 0],
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Progress Bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{
              duration: 0.8,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 4,
              background: 'linear-gradient(90deg, #e63946 0%, #d62839 100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Preloader

