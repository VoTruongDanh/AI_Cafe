import { Button, Box, Divider, Typography } from '@mui/material'
import { Google, Facebook } from '@mui/icons-material'

const SocialLogin = () => {
  const API_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api')
  
  // Check if OAuth is configured
  const isGoogleConfigured = import.meta.env.VITE_GOOGLE_OAUTH_ENABLED === 'true'
  const isFacebookConfigured = import.meta.env.VITE_FACEBOOK_OAUTH_ENABLED === 'true'
  
  // Don't render if no OAuth is configured
  if (!isGoogleConfigured && !isFacebookConfigured) {
    return null
  }

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_URL}/auth/google`
  }

  const handleFacebookLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_URL}/auth/facebook`
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Hoặc đăng nhập với
        </Typography>
      </Divider>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        {isGoogleConfigured && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Google />}
            onClick={handleGoogleLogin}
            sx={{
              borderColor: '#db4437',
              color: '#db4437',
              '&:hover': {
                borderColor: '#db4437',
                bgcolor: '#fef7f6',
              },
            }}
          >
            Google
          </Button>
        )}

        {isFacebookConfigured && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Facebook />}
            onClick={handleFacebookLogin}
            sx={{
              borderColor: '#1877f2',
              color: '#1877f2',
              '&:hover': {
                borderColor: '#1877f2',
                bgcolor: '#e7f3ff',
              },
            }}
          >
            Facebook
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default SocialLogin
