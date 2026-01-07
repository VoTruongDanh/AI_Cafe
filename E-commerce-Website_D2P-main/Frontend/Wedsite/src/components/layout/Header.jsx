import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { logoutUser } from '../../store/slices/authSlice'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  TextField,
  InputAdornment,
  Button,
  Container,
  Menu as MenuMUI,
  MenuItem,
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  Search as SearchIcon,
  Phone,
  LocationOn,
  AccountCircle,
  LocalShipping,
  Receipt,
  LocalOffer,
  BusinessCenter,
  Store,
} from '@mui/icons-material'

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const userButtonRef = useRef(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { items } = useSelector((state) => state.cart)
  const { categories } = useSelector((state) => state.categories)

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleUserMenuOpen = () => {
    setMenuOpen(true)
  }

  const handleUserMenuClose = () => {
    setMenuOpen(false)
  }

  const handleLogout = () => {
    dispatch(logoutUser())
    handleUserMenuClose()
    navigate('/')
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1300,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      {/* Top Bar - NguyenKim Style */}
      <Box
        sx={{
          bgcolor: '#e63946',
          color: 'white',
          py: 0.8,
          display: { xs: 'none', md: 'block' },
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: '14px' }} />
                <Typography variant="caption" sx={{ fontSize: '12px', fontWeight: 500 }}>
                  Xem giá, tồn kho tại: TP. Hồ Chí Minh
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Store sx={{ fontSize: '14px' }} />
                <Typography 
                  variant="caption" 
                  component={Link}
                  to="/stores"
                  sx={{ fontSize: '12px', fontWeight: 500, color: 'white', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Hệ thống siêu thị
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
              {isAuthenticated ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccountCircle sx={{ fontSize: '14px' }} />
                  <Typography variant="caption" sx={{ fontSize: '12px', fontWeight: 500 }}>
                    Xin chào, {user?.name || 'Khách'}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Typography 
                    component={Link} 
                    to="/login" 
                    variant="caption"
                    sx={{ fontSize: '12px', fontWeight: 500, textDecoration: 'none', color: 'white', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Đăng nhập
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>•</Typography>
                  <Typography 
                    component={Link} 
                    to="/register" 
                    variant="caption"
                    sx={{ fontSize: '12px', fontWeight: 500, textDecoration: 'none', color: 'white', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Đăng ký
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Phone sx={{ fontSize: '14px' }} />
                <Typography variant="caption" sx={{ fontSize: '12px', fontWeight: 600 }}>
                  1900 1599
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '11px', opacity: 0.9, ml: 0.3 }}>
                  (Miễn phí)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Header - NguyenKim Red */}
      <AppBar 
        position="static" 
        elevation={2}
        sx={{ 
          bgcolor: '#fff', 
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ py: { xs: 1, md: 1.5 }, px: { xs: 0, md: 2 } }}>
            {/* Logo - NguyenKim Style */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                mr: { xs: 1, md: 2 },
                bgcolor: '#e63946',
                px: { xs: 2, md: 3 },
                py: { xs: 1, md: 1.2 },
                borderRadius: 0,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: 'white',
                  fontSize: { xs: '20px', md: '28px' },
                  letterSpacing: '1px',
                  fontFamily: '"Arial Black", Arial, sans-serif',
                }}
              >
                ELECTROSHOP
              </Typography>
            </Box>

            {/* Search Bar - NguyenKim Style */}
            <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: 650 }, mx: { xs: 1, md: 2 } }}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Bạn cần tìm gì hôm nay ?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconButton 
                          onClick={handleSearch} 
                          edge="end"
                          sx={{ 
                            bgcolor: '#e63946', 
                            color: 'white', 
                            borderRadius: '0',
                            '&:hover': { bgcolor: '#d62839' },
                            p: 1.5,
                            mr: -1.75
                          }}
                        >
                          <SearchIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                      </motion.div>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    bgcolor: '#fff',
                    border: '1px solid #e0e0e0',
                    '& fieldset': { border: 'none' },
                    '&:hover': { 
                      border: '1px solid #e63946',
                    },
                    '&.Mui-focused': { 
                      border: '1px solid #e63946',
                    },
                  },
                  '& input': {
                    fontSize: '14px',
                    py: 1.3,
                    pl: 2,
                  }
                }}
              />
            </Box>

            {/* Right Icons - NguyenKim Style */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2.5 }, ml: { xs: 0, md: 2 } }}>
              {/* Cart */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  component={Link}
                  to="/cart"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textDecoration: 'none',
                    color: '#333',
                    cursor: 'pointer',
                    '&:hover': { color: '#e63946' },
                    transition: 'color 0.2s',
                    px: 1,
                  }}
                >
                  <Badge 
                    badgeContent={cartItemCount} 
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: '#e63946',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '11px',
                      }
                    }}
                  >
                    <ShoppingCartIcon sx={{ fontSize: { xs: 26, md: 28 }, color: '#e63946' }} />
                  </Badge>
                  <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600, display: { xs: 'none', md: 'block' } }}>
                    Giỏ hàng
                  </Typography>
                </Box>
              </motion.div>

              {/* Order Tracking */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  component={Link}
                  to="/orders"
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    textDecoration: 'none',
                    color: '#333',
                    cursor: 'pointer',
                    '&:hover': { color: '#e63946' },
                    transition: 'color 0.2s',
                    px: 1,
                  }}
                >
                  <Receipt sx={{ fontSize: 28, color: '#e63946' }} />
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '11px', lineHeight: 1.2 }}>
                      Tra cứu
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>
                      đơn hàng
                    </Typography>
                  </Box>
                </Box>
              </motion.div>

              {/* User Account */}
              <Box
                ref={userButtonRef}
                onClick={isAuthenticated ? handleUserMenuOpen : () => navigate('/login')}
                sx={{
                  display: { xs: 'none', lg: 'flex' },
                  alignItems: 'center',
                  gap: 1,
                  color: '#333',
                  cursor: 'pointer',
                  '&:hover': { color: '#e63946' },
                  transition: 'color 0.2s',
                  px: 1,
                }}
              >
                <AccountCircle sx={{ fontSize: 28, color: '#e63946' }} />
                <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600 }}>
                  {isAuthenticated ? user?.name || 'Tài khoản' : 'Tài khoản'}
                </Typography>
              </Box>

              {/* Phone */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    color: '#333',
                    cursor: 'pointer',
                    '&:hover': { color: '#e63946' },
                    transition: 'color 0.2s',
                    px: 1,
                  }}
                >
                  <Phone sx={{ fontSize: 28, color: '#e63946' }} />
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '11px', lineHeight: 1.2 }}>
                      Gọi mua: 1800 6880
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.2 }}>
                      (Miễn phí)
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
              
              {/* User Menu */}
              <MenuMUI
                anchorEl={userButtonRef.current}
                open={menuOpen}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                disableScrollLock={true}
                sx={{
                  '& .MuiPaper-root': {
                    mt: 1,
                    minWidth: 180,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: 1,
                  }
                }}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
                  Thông tin tài khoản
                </MenuItem>
                <MenuItem onClick={() => { navigate('/orders'); handleUserMenuClose(); }}>
                  Đơn hàng của tôi
                </MenuItem>
                <MenuItem onClick={() => { navigate('/wishlist'); handleUserMenuClose(); }}>
                  Sản phẩm yêu thích
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: '#e63946' }}>
                  Đăng xuất
                </MenuItem>
              </MenuMUI>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Category Navigation Bar - NguyenKim Style */}
      <Box
        sx={{
          bgcolor: '#2d3436',
          color: 'white',
          py: 0,
          display: { xs: 'none', lg: 'block' },
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: '100%' }}>
            {/* Menu items without Danh mục sản phẩm */}
            {[
              { label: 'Cẩm nang khuyến mãi', link: '/promotion-guide', icon: <LocalOffer sx={{ fontSize: 18 }} /> },
              { label: 'Giao lắp, bảo hành chuyên nghiệp', link: '/service-warranty', icon: <LocalShipping sx={{ fontSize: 18 }} /> },
              { label: 'Tổng hợp khuyến mãi', link: '/promotions', icon: <Receipt sx={{ fontSize: 18 }} /> },
            ].map((item) => (
              <motion.div
                key={item.label}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                <Typography
                  component={Link}
                  to={item.link}
                  sx={{ 
                    color: 'white', 
                    textDecoration: 'none', 
                    fontSize: '14px',
                    fontWeight: 500,
                    px: 4,
                    py: 2.5,
                    borderRadius: 0,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    height: '100%',
                    justifyContent: 'center',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.1)',
                    } 
                  }}
                >
                  {item.icon}
                  {item.label}
                </Typography>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default Header
