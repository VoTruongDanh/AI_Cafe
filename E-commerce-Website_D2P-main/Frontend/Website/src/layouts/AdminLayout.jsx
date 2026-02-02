import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../store/slices/authSlice'
import { motion, AnimatePresence } from 'framer-motion'
import { useGlobalPolling } from '../hooks/useGlobalPolling'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory2 as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  LocalOffer as LocalOfferIcon,
  Inventory as InventoryBoxIcon,
  Analytics as AnalyticsIcon,
  Psychology as PsychologyIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Person,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { fadeIn, slideInLeft, slideInRight, smoothSpring } from '../utils/animations'

const drawerWidthExpanded = 260
const drawerWidthCollapsed = 70

const DashboardCustomIcon = () => (
  <img src="/admin/icon/icon_dashboard_2.png" alt="Dashboard" style={{ width: 24, height: 24 }} />
)

const ProductCustomIcon = () => (
  <img src="/admin/icon/icon_product_manager.png" alt="Sản phẩm" style={{ width: 24, height: 24 }} />
)

const OrderCustomIcon = () => (
  <img src="/admin/icon/icon_shopping_cart.png" alt="Đơn hàng" style={{ width: 24, height: 24 }} />
)

const UserCustomIcon = () => (
  <img src="/admin/icon/icon_user.png" alt="Người dùng" style={{ width: 24, height: 24 }} />
)

const CategoryCustomIcon = () => (
  <img src="/admin/icon/icon_category.png" alt="Danh mục" style={{ width: 24, height: 24 }} />
)

const PromotionCustomIcon = () => (
  <img src="/admin/icon/icon_discount.png" alt="Khuyến mãi" style={{ width: 24, height: 24 }} />
)

const InventoryCustomIcon = () => (
  <img src="/admin/icon/icon_inventory.png" alt="Tồn kho" style={{ width: 24, height: 24 }} />
)

const AnalyticsCustomIcon = () => (
  <img src="/admin/icon/icon_analytics.png" alt="Phân tích" style={{ width: 24, height: 24 }} />
)

const AICustomIcon = () => (
  <PsychologyIcon sx={{ fontSize: 24 }} />
)

const FaceRecognitionIcon = () => (
  <img src="/admin/icon/icon_face_recognition.png" alt="Nhận diện" style={{ width: 24, height: 24 }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'block'); }} />
)

const menuItems = [
  { text: 'Dashboard', icon: DashboardCustomIcon, path: 'dashboard' },
  { text: 'Sản phẩm', icon: ProductCustomIcon, path: 'products' },
  { text: 'Đơn hàng', icon: OrderCustomIcon, path: 'orders' },
  { text: 'Người dùng', icon: UserCustomIcon, path: 'users' },
  { text: 'Danh mục', icon: CategoryCustomIcon, path: 'categories' },
  { text: 'Khuyến mãi', icon: PromotionCustomIcon, path: 'promotions' },
  { text: 'Tồn kho', icon: InventoryCustomIcon, path: 'inventory' },
  { text: 'Phân tích', icon: AnalyticsCustomIcon, path: 'analytics' },
  { text: 'AI Phân Loại', icon: AICustomIcon, path: 'ai-classification' },
  { text: 'Nhận diện KH', icon: PeopleIcon, path: 'face-recognition-v2' },
]

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { user } = useSelector((state) => state.auth)

  // ❌ TẮT GLOBAL POLLING - Gây conflict với React Query, dùng React Query cache thay thế
  // const { refreshAll } = useGlobalPolling({
  //   products: true,
  //   orders: true,
  //   inventory: true,
  //   categories: true,
  //   users: true,
  //   promotions: true,
  //   interval: 5000
  // })

  // Lấy chữ cái đầu tiên của tên
  const getInitials = (name) => {
    if (!name) return 'A'
    const names = name.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const drawerWidth = collapsed ? drawerWidthCollapsed : drawerWidthExpanded

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    await dispatch(logoutUser())
    toast.success('Đăng xuất thành công')
    navigate('/login')
  }

  const isActive = (path) => {
    const currentPath = location.pathname
    if (path === 'dashboard') {
      return currentPath === '/admin' || currentPath === '/admin/dashboard'
    }
    return currentPath === `/admin/${path}`
  }

  const drawer = (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <Box
        sx={{
          height: '100%',
          backgroundColor: '#1976d2',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          sx={{
            py: 2,
            px: collapsed ? 1 : 2,
            backgroundColor: '#1976d2',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            minHeight: 64,
            position: 'relative',
            gap: 1,
            cursor: collapsed ? 'pointer' : 'default',
          }}
          onClick={collapsed ? handleToggleCollapse : undefined}
          title={collapsed ? 'Nhấn để mở rộng sidebar' : ''}
        >
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', textAlign: 'center' }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: '1.5rem',
                      color: 'white',
                      userSelect: 'none',
                    }}
                  >
                    E
                  </Typography>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 8 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    pr: 1,
                  }}
                >
                  ElectroShop Admin
                </Typography>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    onClick={handleToggleCollapse}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      width: 28,
                      height: 28,
                      minWidth: 28,
                      padding: 0,
                      flexShrink: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      display: { xs: 'none', sm: 'flex' },
                    }}
                    title="Thu gọn sidebar"
                  >
                    <img 
                      src="/admin/icon/icon_sidebar.png" 
                      alt="Toggle sidebar" 
                      style={{ width: 30, height: 30 }} 
                    />
                  </IconButton>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </motion.div>

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, px: collapsed ? 0.5 : 1, py: 2 }}>
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.path)
            const menuItemContent = (
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%' }}
              >
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={{
                    borderRadius: 1,
                    py: 1.5,
                    px: collapsed ? 1.5 : 2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    },
                    '&.active': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    },
                minHeight: 48,
                    width: '100%',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <motion.div
                    animate={active ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? 0 : 40,
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <Icon />
                    </ListItemIcon>
                  </motion.div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.95rem',
                            fontWeight: active ? 600 : 400,
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ListItemButton>
              </motion.div>
            )

            return (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  {collapsed ? (
                    <Tooltip title={item.text} placement="right" arrow>
                      <Box sx={{ width: '100%' }}>{menuItemContent}</Box>
                    </Tooltip>
                  ) : (
                    menuItemContent
                  )}
                </ListItem>
              </motion.div>
            )
          })}
        </motion.div>
      </List>

      {/* Toggle Button for Collapsed State - at bottom */}
      <AnimatePresence>
        {collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                px: 1,
                py: 1.5,
                display: 'flex',
                justifyContent: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Tooltip title="Mở rộng sidebar" placement="right" arrow>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    onClick={handleToggleCollapse}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      padding: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.35)',
                      },
                      display: { xs: 'none', sm: 'flex' },
                    }}
                  >
                    <ChevronRight fontSize="small" />
                  </IconButton>
                </motion.div>
              </Tooltip>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
      </Box>
    </motion.div>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: {
            sm: collapsed
              ? `calc(100% - ${drawerWidthCollapsed}px)`
              : `calc(100% - ${drawerWidthExpanded}px)`
          },
          ml: {
            sm: collapsed
              ? `${drawerWidthCollapsed}px`
              : `${drawerWidthExpanded}px`
          },
          backgroundColor: 'white',
          color: '#1a1a1a',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'width 0.3s ease, margin-left 0.3s ease',
          display: { xs: 'block', sm: 'none' },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: '#1a1a1a' }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              color: '#1a1a1a',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Trang quản trị
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleMenuClick}
              sx={{
                color: '#1a1a1a',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: '#1976d2',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {getInitials(user?.name)}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { navigate('/admin/profile'); handleMenuClose(); }}>
          <Person sx={{ mr: 1 }} /> Thông tin
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} /> Đăng xuất
        </MenuItem>
      </Menu>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidthExpanded,
              borderRight: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
              borderRight: 'none',
              backgroundColor: '#1976d2',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden',
            },
          }}
          open
        >
          <motion.div
            initial={false}
            animate={{
              width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ height: '100%' }}
          >
            {drawer}
          </motion.div>
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            sm: collapsed
              ? `calc(100% - ${drawerWidthCollapsed}px)`
              : `calc(100% - ${drawerWidthExpanded}px)`
          },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          transition: 'width 0.3s ease',
        }}
      >
        {/* Desktop Header */}
        <AppBar
          position="static"
          sx={{
            display: { xs: 'none', sm: 'block' },
            backgroundColor: 'white',
            color: '#1a1a1a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Toolbar>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                color: '#1a1a1a',
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              Trang quản trị
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={handleMenuClick}
                sx={{
                  color: '#1a1a1a',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: '#1976d2',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {getInitials(user?.name)}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ mt: { xs: 8, sm: 0 } }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default AdminLayout
