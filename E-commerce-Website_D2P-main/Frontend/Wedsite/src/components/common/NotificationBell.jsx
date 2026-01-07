import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { markAsRead, markAllAsRead, clearNotifications } from '../../store/slices/notificationsSlice'
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Avatar,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  ShoppingBag,
  LocalOffer,
  CheckCircle,
  Info,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

const NotificationBell = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, unreadCount } = useSelector((state) => state.notifications)
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (notification) => {
    dispatch(markAsRead(notification.id))
    if (notification.link) {
      navigate(notification.link)
    }
    handleClose()
  }

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead())
  }

  const handleClear = () => {
    dispatch(clearNotifications())
    handleClose()
  }

  const getIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingBag sx={{ color: '#e63946' }} />
      case 'promotion':
        return <LocalOffer sx={{ color: '#f72585' }} />
      case 'success':
        return <CheckCircle sx={{ color: '#06d6a0' }} />
      default:
        return <Info sx={{ color: '#4361ee' }} />
    }
  }

  return (
    <>
      <IconButton onClick={handleClick} sx={{ color: 'white' }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Thông báo ({unreadCount})
          </Typography>
          {items.length > 0 && (
            <Box>
              <Button size="small" onClick={handleMarkAllRead}>
                Đánh dấu đã đọc
              </Button>
              <Button size="small" color="error" onClick={handleClear}>
                Xóa tất cả
              </Button>
            </Box>
          )}
        </Box>

        <Divider />

        {items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Chưa có thông báo nào
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {items.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.read ? 'transparent' : '#f0f4ff',
                  borderLeft: notification.read ? 'none' : '4px solid #e63946',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: notification.read ? '#f8f9fa' : '#e8f0ff',
                  },
                }}
              >
                <Avatar sx={{ mr: 2, bgcolor: 'transparent' }}>
                  {getIcon(notification.type)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}
      </Menu>
    </>
  )
}

export default NotificationBell
