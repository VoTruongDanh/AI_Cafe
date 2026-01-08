import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Box, CircularProgress, Typography } from '@mui/material'
import { syncAuthState } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'

/**
 * OAuth Callback Handler
 * Handles the redirect from social login providers
 */
const OAuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')
    const error = searchParams.get('error')

    if (error) {
      // Handle error
      console.error('OAuth error:', error)
      toast.error('Đăng nhập thất bại. Vui lòng thử lại.')
      navigate('/login')
      return
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        
        // Save to localStorage based on role
        const role = user?.role || 'customer'
        if (role === 'admin' || role === 'employee') {
          localStorage.setItem('admin_token', token)
          localStorage.setItem('admin_user', JSON.stringify(user))
        } else {
          localStorage.setItem('user_token', token)
          localStorage.setItem('user_user', JSON.stringify(user))
        }
        
        // Keep legacy keys for backward compatibility
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Update Redux store
        dispatch(syncAuthState())
        
        // Show success message
        toast.success('Đăng nhập thành công! 🎉')
        
        // Redirect based on role
        if (role === 'admin' || role === 'employee') {
          navigate('/admin/dashboard')
        } else {
          navigate('/')
        }
      } catch (err) {
        console.error('Failed to parse user data:', err)
        toast.error('Dữ liệu không hợp lệ. Vui lòng thử lại.')
        navigate('/login')
      }
    } else {
      toast.error('Thiếu thông tin đăng nhập. Vui lòng thử lại.')
      navigate('/login')
    }
  }, [searchParams, navigate, dispatch])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        Đang đăng nhập...
      </Typography>
    </Box>
  )
}

export default OAuthCallback
