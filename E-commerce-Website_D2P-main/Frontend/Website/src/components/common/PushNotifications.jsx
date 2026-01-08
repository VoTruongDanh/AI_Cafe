import { useEffect, useState } from 'react'
import { Snackbar, Alert, IconButton } from '@mui/material'
import { Close, Notifications } from '@mui/icons-material'
import { requestNotificationPermission, onMessageListener } from '../../services/firebase'
import axios from 'axios'

const PushNotifications = () => {
  const [notification, setNotification] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const setupNotifications = async () => {
      const token = await requestNotificationPermission()
      
      if (token) {
        // Send token to backend
        try {
          await axios.post('/api/notifications/register-device', {
            fcm_token: token,
            device_type: 'web',
          })
        } catch (error) {
          console.error('Error registering device:', error)
        }
      }
    }

    setupNotifications()

    // Listen for foreground messages
    onMessageListener()
      .then((payload) => {
        setNotification({
          title: payload.notification.title,
          body: payload.notification.body,
        })
        setOpen(true)
      })
      .catch((err) => console.error('Error receiving message:', err))
  }, [])

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity="info"
        icon={<Notifications />}
        action={
          <IconButton size="small" onClick={handleClose}>
            <Close fontSize="small" />
          </IconButton>
        }
        sx={{ width: '100%', maxWidth: 400 }}
      >
        <strong>{notification?.title}</strong>
        <br />
        {notification?.body}
      </Alert>
    </Snackbar>
  )
}

export default PushNotifications
