import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { resetPasswordSchema } from '../../utils/validationSchemas'
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
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
  LockReset,
  ShoppingBag,
  LocalShipping,
  Security,
  Support,
  ErrorOutline,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { authApi } from '../../services/api'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { markDataReady } = usePreloader()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(null)
  const [tokenError, setTokenError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      passwordConfirmation: '',
    },
    mode: 'onChange',
  })

  const features = [
    { icon: <ShoppingBag />, text: 'Mua sắm dễ dàng' },
    { icon: <LocalShipping />, text: 'Giao hàng nhanh' },
    { icon: <Security />, text: 'Bảo mật tuyệt đối' },
    { icon: <Support />, text: 'Hỗ trợ 24/7' },
  ]

  // Mark preloader as ready since auth pages don't need data loading
  useEffect(() => {
    markDataReady()
  }, [markDataReady])

  // Verify token on mount
  useEffect(() => {
    if (!token || !email) {
      setIsTokenValid(false)
      setTokenError('Link không hợp lệ. Thiếu thông tin token hoặc email.')
      setIsVerifying(false)
      return
    }

    const verifyToken = async () => {
      try {
        const response = await authApi.verifyResetToken(token, email)
        if (response.data.valid) {
          setIsTokenValid(true)
        } else {
          setIsTokenValid(false)
          const reason = response.data.reason
          if (reason === 'expired') {
            setTokenError('Link đã hết hạn. Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.')
          } else if (reason === 'invalid_token') {
            setTokenError('Link không hợp lệ hoặc đã được sử dụng.')
          } else {
            setTokenError('Link không hợp lệ.')
          }
        }
      } catch (error) {
        setIsTokenValid(false)
        setTokenError('Không thể xác thực link. Vui lòng thử lại.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token, email])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await authApi.resetPassword({
        email,
        token,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
      })
      setIsSuccess(true)
      toast.success(response.message || 'Đặt lại mật khẩu thành công!')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.email?.[0] || 'Có lỗi xảy ra. Vui lòng thử lại.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Left Side Component (reused across all states)
  const LeftSide = () => (
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
  )

  // Loading state
  if (isVerifying) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <LeftSide />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)',
            p: { xs: 3, md: 6 },
          }}
        >
          <Box
            sx={{
              background: 'white',
              borderRadius: 4,
              p: 5,
              boxShadow: '0 25px 80px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}
          >
            <CircularProgress sx={{ mb: 3, color: '#ff6b35' }} size={50} />
            <Typography variant="h6" sx={{ color: '#1a1a2e' }}>
              Đang kiểm tra link...
            </Typography>
          </Box>
        </Box>
      </Box>
    )
  }

  // Invalid token state
  if (!isTokenValid) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <LeftSide />
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

              <Box
                sx={{
                  background: 'white',
                  borderRadius: 4,
                  p: { xs: 3, md: 5 },
                  boxShadow: '0 25px 80px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Red accent line */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'linear-gradient(90deg, #ef5350 0%, #f44336 100%)',
                  }}
                />

                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(239,83,80,0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <ErrorOutline sx={{ fontSize: 45, color: '#f44336' }} />
                </Box>

                <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a2e', mb: 2 }}>
                  Link không hợp lệ
                </Typography>
                
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 4, 
                    textAlign: 'left',
                    borderRadius: 2,
                    border: '1px solid #ffcdd2',
                  }}
                >
                  {tokenError}
                </Alert>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="contained"
                    component={Link}
                    to="/forgot-password"
                    fullWidth
                    size="large"
                    sx={{
                      py: 1.8,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                      fontSize: 16,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 8px 30px rgba(255, 107, 53, 0.35)',
                      mb: 2,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e55a2b 0%, #e0841a 100%)',
                        boxShadow: '0 12px 40px rgba(255, 107, 53, 0.45)',
                      },
                    }}
                  >
                    Yêu cầu gửi lại email
                  </Button>
                </motion.div>

                <Typography
                  component={Link}
                  to="/login"
                  sx={{
                    color: '#ff6b35',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Quay về đăng nhập
                </Typography>
              </Box>
            </motion.div>
          </Container>
        </Box>
      </Box>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <LeftSide />
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
          
          <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
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

              <Box
                sx={{
                  background: 'white',
                  borderRadius: 4,
                  p: { xs: 3, md: 5 },
                  boxShadow: '0 25px 80px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Green accent line */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)',
                  }}
                />

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(102,187,106,0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 60, color: '#4caf50' }} />
                  </Box>
                </motion.div>

                <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a2e', mb: 2 }}>
                  Đặt lại mật khẩu thành công! 🎉
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                  Mật khẩu của bạn đã được đặt lại. Đang chuyển đến trang đăng nhập...
                </Typography>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="contained"
                    onClick={() => navigate('/login')}
                    fullWidth
                    size="large"
                    sx={{
                      py: 1.8,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                      fontSize: 16,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 8px 30px rgba(255, 107, 53, 0.35)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e55a2b 0%, #e0841a 100%)',
                        boxShadow: '0 12px 40px rgba(255, 107, 53, 0.45)',
                      },
                    }}
                  >
                    Đăng nhập ngay
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          </Container>
        </Box>
      </Box>
    )
  }

  // Main form
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <LeftSide />

      {/* Right Side - Form */}
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
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(247,147,30,0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <LockReset sx={{ fontSize: 35, color: '#ff6b35' }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#1a1a2e',
                    mb: 1,
                  }}
                >
                  Đặt lại mật khẩu
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  Nhập mật khẩu mới của bạn 🔐
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                {/* Email Field (disabled) */}
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  disabled
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: '#f0f0f0',
                    },
                  }}
                />

                {/* New Password Field */}
                <motion.div
                  animate={{
                    scale: isPasswordFocused ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <TextField
                    fullWidth
                    label="Mật khẩu mới"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
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

                {/* Confirm Password Field */}
                <motion.div
                  animate={{
                    scale: isConfirmPasswordFocused ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <TextField
                    fullWidth
                    label="Xác nhận mật khẩu"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('passwordConfirmation')}
                    error={!!errors.passwordConfirmation}
                    helperText={errors.passwordConfirmation?.message}
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
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
                          <Lock sx={{ color: isConfirmPasswordFocused ? '#ff6b35' : '#999' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{
                              color: '#999',
                              '&:hover': { color: '#ff6b35' },
                            }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </motion.div>

                {/* Submit Button */}
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
                    startIcon={isLoading ? null : <Lock />}
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
                      'Đặt lại mật khẩu'
                    )}
                  </Button>
                </motion.div>

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

                {/* Back to Login Link */}
                <Box textAlign="center">
                  <Typography sx={{ color: '#666', fontSize: 15 }}>
                    Đã nhớ mật khẩu?{' '}
                    <Typography
                      component={Link}
                      to="/login"
                      sx={{
                        color: '#ff6b35',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Đăng nhập ngay
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

export default ResetPassword

