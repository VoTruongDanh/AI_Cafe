import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fab, Box, Tooltip } from '@mui/material'
import { KeyboardArrowUp } from '@mui/icons-material'

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Hiển thị nút khi scroll xuống hơn 300px
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
      setIsVisible(scrollPosition > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 100 }}
          transition={{ 
            type: 'spring', 
            stiffness: 260, 
            damping: 20 
          }}
        >
          <Box
            sx={{
              position: 'fixed',
              bottom: { xs: 80, md: 24 },
              left: { xs: 16, md: 24 },
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <Tooltip title="Lên đầu trang" arrow placement="right">
              <motion.div
                whileHover={{ 
                  scale: 1.1, 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.9 }}
              >
                <Fab
                  aria-label="scroll to top"
                  onClick={scrollToTop}
                  sx={{
                    bgcolor: '#e63946',
                    color: 'white',
                    width: { xs: 48, md: 56 },
                    height: { xs: 48, md: 56 },
                    boxShadow: '0 6px 20px rgba(230,57,70,0.4)',
                    '&:hover': {
                      bgcolor: '#d62839',
                      boxShadow: '0 8px 28px rgba(230,57,70,0.6)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <KeyboardArrowUp 
                    sx={{ 
                      fontSize: { xs: 28, md: 32 },
                      fontWeight: 'bold'
                    }} 
                  />
                </Fab>
              </motion.div>
            </Tooltip>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ScrollToTop

