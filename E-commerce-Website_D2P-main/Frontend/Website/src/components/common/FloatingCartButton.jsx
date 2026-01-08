import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Fab, Badge, Box, Typography } from '@mui/material'
import { ShoppingCart } from '@mui/icons-material'

const FloatingCartButton = () => {
  const navigate = useNavigate()
  const { items } = useSelector((state) => state.cart)
  const [isVisible, setIsVisible] = useState(false)
  const [isPulse, setIsPulse] = useState(false)

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.pageYOffset
      setIsVisible(scrollPosition > 200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (cartItemCount > 0) {
      setIsPulse(true)
      const timer = setTimeout(() => setIsPulse(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [cartItemCount])

  if (cartItemCount === 0) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, x: 100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0, x: 100 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <Box
            onClick={() => navigate('/cart')}
            sx={{
              position: 'fixed',
              bottom: { xs: 80, md: 24 },
              right: { xs: 16, md: 24 },
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
              whileTap={{ scale: 0.9 }}
              animate={isPulse ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Fab
                aria-label="cart"
                sx={{
                  bgcolor: '#e63946',
                  color: 'white',
                  width: 64,
                  height: 64,
                  boxShadow: '0 6px 20px rgba(230,57,70,0.4)',
                  '&:hover': {
                    bgcolor: '#d62839',
                    boxShadow: '0 8px 28px rgba(230,57,70,0.5)',
                  },
                }}
              >
                <Badge 
                  badgeContent={cartItemCount} 
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#ffd93d',
                      color: '#333',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      minWidth: '22px',
                      height: '22px',
                      border: '2px solid white',
                    }
                  }}
                >
                  <ShoppingCart sx={{ fontSize: 28 }} />
                </Badge>
              </Fab>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  bgcolor: 'rgba(230,57,70,0.95)',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 'bold',
                  fontSize: '11px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                Giỏ hàng
              </Typography>
            </motion.div>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloatingCartButton

