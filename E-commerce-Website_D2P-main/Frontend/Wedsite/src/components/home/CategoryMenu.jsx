import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Box,
  Typography,
} from '@mui/material'
import {
  Menu,
  Store,
  ChevronRight,
} from '@mui/icons-material'

const CategoryMenu = () => {
  const navigate = useNavigate()
  const { categories } = useSelector((state) => state.categories)

  const handleCategoryClick = (categoryId) => {
    if (categoryId) {
      navigate(`/products?category=${categoryId}`)
    } else {
      navigate('/products')
    }
  }

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        height: { md: 380, lg: 450 },
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        border: '1px solid #e8e8e8',
        borderRadius: 1,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: '#e63946',
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Menu sx={{ color: 'white', fontSize: 20 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '14px', color: 'white' }}>
          Danh mục sản phẩm
        </Typography>
      </Box>

      {/* Menu Items */}
      <Box sx={{ overflowY: 'auto', height: { md: 'calc(380px - 48px)', lg: 'calc(450px - 48px)' } }}>
        {(categories || []).map((category, index) => {
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Box
                onClick={() => handleCategoryClick(category.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.2,
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  bgcolor: '#fff',
                  '&:hover': {
                    bgcolor: '#fff5f5',
                    '& .category-icon': {
                      color: '#e63946',
                    },
                    '& .category-text': {
                      color: '#e63946',
                    },
                    '& .arrow-icon': {
                      color: '#e63946',
                      transform: 'translateX(3px)',
                    }
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Store className="category-icon" sx={{ fontSize: 16, color: '#666', transition: 'color 0.2s' }} />
                <Typography 
                  className="category-text"
                  sx={{ 
                    fontSize: '13px', 
                    color: '#333',
                    flex: 1,
                    lineHeight: 1.3,
                    fontWeight: 400,
                    transition: 'color 0.2s',
                  }}
                >
                  {category.name}
                </Typography>
                <ChevronRight className="arrow-icon" sx={{ fontSize: 16, color: '#ccc', transition: 'all 0.2s' }} />
              </Box>
            </motion.div>
          )
        })}
      </Box>
    </Box>
  )
}

export default CategoryMenu

