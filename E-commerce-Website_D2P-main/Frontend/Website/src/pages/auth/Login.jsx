import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { loginSchema } from '../../utils/validationSchemas'
import { loginUser } from '../../store/slices/authSlice'
import { usePreloader } from '../../contexts/PreloaderContext'
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon,
  ShoppingBag,
  LocalShipping,
  Security,
  Support,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import SocialLogin from '../../components/auth/SocialLogin'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading, error } = useSelector((state) => state.auth)
  const { markDataReady } = usePreloader()
  
  // Lấy URL trước đó từ state (nếu có)
  const from = location.state?.from || null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  })

  // Mark preloader as ready since auth pages don't need data loading
  useEffect(() => {
    markDataReady()
  }, [markDataReady])

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser({ email: data.email, password: data.password }))
    
    if (loginUser.fulfilled.match(result)) {
      toast.success('Đăng nhập thành công! 🎉')
      
      const userRole = result.payload?.user?.role
      
      // Nếu là admin/employee, luôn redirect về dashboard
      if (userRole === 'admin' || userRole === 'employee') {
        navigate('/admin/dashboard')
      } else {
        // Nếu có URL trước đó (từ ProductDetail, Checkout...), quay lại đó
        if (from) {
          navigate(from, { replace: true })
        } else {
          // Không có URL trước đó, về trang chủ
          navigate('/')
        }
      }
    } else {
      toast.error(error || 'Đăng nhập thất bại')
    }
  }

  const features = [
    { icon: <ShoppingBag />, text: 'Mua sắm dễ dàng' },
    { icon: <LocalShipping />, text: 'Giao hàng nhanh' },
    { icon: <Security />, text: 'Bảo mật tuyệt đối' },
    { icon: <Support />, text: 'Hỗ trợ 24/7' },
  ]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left Side - Branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          position: 'relative',
          p: 6,
        }}
      >
        {/* Animated Background Elements */}
        <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: Math.random() * 300 + 50,
                height: Math.random() * 300 + 50,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(255,107,53,${Math.random() * 0.1}) 0%, transparent 70%)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          ))}
        </Box>

        {/* Logo & Brand */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <motion.div
              animate={{ 
                rotateY: [0, 360],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '30px',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 20px 60px rgba(255, 107, 53, 0.4)',
                }}
              >
                <Typography sx={{ fontSize: 50 }}>⚡</Typography>
              </Box>
            </motion.div>
            
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: 'white',
                mb: 1,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              ElectroShop
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 300,
                letterSpacing: 3,
              }}
            >
              ĐIỆN TỬ CHÍNH HÃNG
            </Typography>
          </Box>
        </motion.div>

        {/* Features */}
        <Box sx={{ mt: 8, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Box
                    sx={{
                      color: '#ff6b35',
                      display: 'flex',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                    {feature.text}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)',
          p: { xs: 3, md: 6 },
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(247,147,30,0.05) 100%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(26,26,46,0.05) 0%, rgba(15,52,96,0.1) 100%)',
          }}
        />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Mobile Logo */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 10px 40px rgba(255, 107, 53, 0.3)',
                }}
              >
                <Typography sx={{ fontSize: 36 }}>⚡</Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} color="#1a1a2e">
                ElectroShop
              </Typography>
            </Box>

            {/* Form Card */}
            <Box
              sx={{
                background: 'white',
                borderRadius: 4,
                p: { xs: 3, md: 5 },
                boxShadow: '0 25px 80px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Orange accent line */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 100%)',
                }}
              />

              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#1a1a2e',
                    mb: 1,
                  }}
                >
                  Đăng nhập
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  Chào mừng bạn quay trở lại! 👋
                </Typography>
              </Box>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        border: '1px solid #ffcdd2',
                      }}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                {/* Email Field */}
                <motion.div
                  animate={{
                    scale: isEmailFocused ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        bgcolor: '#f8f9fa',
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: '#fff',
                        },
                        '&.Mui-focused': {
                          bgcolor: '#fff',
                          boxShadow: '0 0 0 4px rgba(255, 107, 53, 0.1)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ff6b35',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#ff6b35',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: isEmailFocused ? '#ff6b35' : '#999' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </motion.div>

                {/* Password Field */}
                <motion.div
                  animate={{
                    scale: isPasswordFocused ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <TextField
                    fullWidth
                    label="Mật khẩu"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        bgcolor: '#f8f9fa',
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: '#fff',
                        },
                        '&.Mui-focused': {
                          bgcolor: '#fff',
                          boxShadow: '0 0 0 4px rgba(255, 107, 53, 0.1)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ff6b35',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#ff6b35',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: isPasswordFocused ? '#ff6b35' : '#999' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{
                              color: '#999',
                              '&:hover': { color: '#ff6b35' },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </motion.div>

                {/* Forgot Password */}
                <Box sx={{ textAlign: 'right', mb: 3 }}>
                  <Typography
                    component={Link}
                    to="/forgot-password"
                    sx={{
                      color: '#ff6b35',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: 14,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Quên mật khẩu?
                  </Typography>
                </Box>

                {/* Login Button */}
                <motion.div
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    startIcon={isLoading ? null : <LoginIcon />}
                    sx={{
                      py: 1.8,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                      fontSize: 16,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 8px 30px rgba(255, 107, 53, 0.35)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e55a2b 0%, #e0841a 100%)',
                        boxShadow: '0 12px 40px rgba(255, 107, 53, 0.45)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: '#ccc',
                      },
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      'Đăng nhập'
                    )}
                  </Button>
                </motion.div>

                {/* Social Login */}
                <SocialLogin />

                {/* Divider */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    my: 4,
                  }}
                >
                  <Box sx={{ flex: 1, height: 1, bgcolor: '#e0e0e0' }} />
                  <Typography
                    sx={{
                      px: 3,
                      color: '#999',
                      fontSize: 14,
                    }}
                  >
                    hoặc
                  </Typography>
                  <Box sx={{ flex: 1, height: 1, bgcolor: '#e0e0e0' }} />
                </Box>

                {/* Register Link */}
                <Box textAlign="center">
                  <Typography sx={{ color: '#666', fontSize: 15 }}>
                    Chưa có tài khoản?{' '}
                    <Typography
                      component={Link}
                      to="/register"
                      sx={{
                        color: '#ff6b35',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Đăng ký ngay
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" sx={{ color: '#999' }}>
                © 2024 ElectroShop. Mua sắm điện tử tin cậy
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  )
}

export default Login
