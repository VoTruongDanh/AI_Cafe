import { Paper } from '@mui/material'
import { motion } from 'framer-motion'

const PremiumCard = ({ children, isDark = false, noPadding = false, ...props }) => {
  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
      elevation={0}
      sx={{
        p: noPadding ? 0 : 3,
        border: 'none',
        background: isDark 
          ? 'linear-gradient(135deg, rgba(18,24,38,0.95) 0%, rgba(26,35,50,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.95) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: isDark
          ? '0 20px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(230,57,70,0.2) inset'
          : '0 20px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(230,57,70,0.1) inset',
        borderRadius: 6,
        color: isDark ? '#f5f7fb' : '#1a1f36',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: 'linear-gradient(90deg, #E63946 0%, #F72585 20%, #7209B7 40%, #3A0CA3 60%, #F4A261 80%, #E63946 100%)',
          backgroundSize: '200% 100%',
          animation: 'gradientFlow 6s linear infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 5,
          left: 0,
          right: 0,
          height: '100%',
          background: isDark
            ? 'radial-gradient(circle at 50% 0%, rgba(230,57,70,0.05) 0%, transparent 50%)'
            : 'radial-gradient(circle at 50% 0%, rgba(230,57,70,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
        '@keyframes gradientFlow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        ...props.sx,
      }}
      {...props}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </Paper>
  )
}

export default PremiumCard
