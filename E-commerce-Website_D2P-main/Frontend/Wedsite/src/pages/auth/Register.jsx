import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { registerSchema } from '../../utils/validationSchemas'
import { registerUser } from '../../store/slices/authSlice'
import { usePreloader } from '../../contexts/PreloaderContext'
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  LocationOn,
  HowToReg,
  CheckCircle,
  Verified,
  CardGiftcard,
  Discount,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import SocialLogin from '../../components/auth/SocialLogin'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [focusedField, setFocusedField] = useState('')
  
  // State for provinces/communes (Phường/Xã)
  const [provinces, setProvinces] = useState([])
  const [communes, setCommunes] = useState([])
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCommune, setSelectedCommune] = useState('')
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { markDataReady } = usePreloader()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      ward: '',
      password: '',
      passwordConfirmation: '',
    },
    mode: 'onChange',
  })

  const password = watch('password')
  const passwordConfirmation = watch('passwordConfirmation')

  // Mark preloader as ready since auth pages don't need data loading
  useEffect(() => {
    markDataReady()
  }, [markDataReady])

  // Fetch provinces on mount
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    fetch(`${API_URL}/address/provinces`)
      .then(res => res.json())
      .then(data => {
        setProvinces(data || [])
      })
      .catch(error => {
        console.error('Error fetching provinces:', error)
      })
  }, [])

  // Handle province change
  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value
    const province = provinces.find(p => p.code === provinceCode)
    setSelectedProvince(provinceCode)
    setSelectedCommune('')
    setValue('city', province?.name || '')
    setValue('ward', '')
    setCommunes([])
    
    if (provinceCode) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        const res = await fetch(`${API_URL}/address/provinces/${provinceCode}/communes`)
        const data = await res.json()
        setCommunes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching communes:', error)
      }
    }
  }

  // Handle commune change
  const handleCommuneChange = (e) => {
    const communeCode = e.target.value
    const commune = communes.find(c => c.code === communeCode)
    setSelectedCommune(communeCode)
    setValue('ward', commune?.name || '')
  }

  const steps = ['Thông tin cơ bản', 'Địa chỉ', 'Bảo mật']

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    const { passwordConfirmation, ...registerData } = data
    const result = await dispatch(registerUser(registerData))
    
    if (registerUser.fulfilled.match(result)) {
      toast.success('Đăng ký thành công! 🎉')
      navigate('/')
    } else {
      if (result.payload && result.payload.errors) {
        // Set server-side errors to form
        Object.keys(result.payload.errors).forEach(key => {
          setError(key, { message: result.payload.errors[key][0] })
        })
        toast.error(result.payload.message || 'Đăng ký thất bại')
      } else {
        const errorMessage = result.payload || 'Đăng ký thất bại. Vui lòng thử lại!'
        toast.error(errorMessage)
      }
    }
    setIsLoading(false)
  }

  const benefits = [
    { icon: <Verified />, title: 'Xác thực tài khoản', desc: 'Bảo vệ thông tin cá nhân' },
    { icon: <CardGiftcard />, title: 'Quà tặng chào mừng', desc: 'Nhận ngay voucher 50K' },
    { icon: <Discount />, title: 'Ưu đãi độc quyền', desc: 'Giảm giá đến 50%' },
    { icon: <CheckCircle />, title: 'Mua sắm an toàn', desc: 'Bảo hành chính hãng' },
  ]

  const inputStyle = (fieldName) => ({
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
  })

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <motion.div
                animate={{ scale: focusedField === 'name' ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <TextField
                  fullWidth
                  label="Họ và tên"
                  {...register('name')}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={inputStyle('name')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: focusedField === 'name' ? '#ff6b35' : '#999' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </motion.div>
            </Grid>
            <Grid item xs={12}>
              <motion.div
                animate={{ scale: focusedField === 'email' ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  {...register('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={inputStyle('email')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: focusedField === 'email' ? '#ff6b35' : '#999' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </motion.div>
            </Grid>
            <Grid item xs={12}>
              <motion.div
                animate={{ scale: focusedField === 'phone' ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  {...register('phone')}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField('')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  sx={inputStyle('phone')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: focusedField === 'phone' ? '#ff6b35' : '#999' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </motion.div>
            </Grid>
          </Grid>
        )
      case 1:
        return (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <motion.div
                animate={{ scale: focusedField === 'address' ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <TextField
                  fullWidth
                  label="Địa chỉ chi tiết"
                  {...register('address')}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField('')}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                  sx={inputStyle('address')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: focusedField === 'address' ? '#ff6b35' : '#999' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6}>
              <motion.div
                animate={{ scale: focusedField === 'city' ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <FormControl fullWidth error={!!errors.city}>
                  <InputLabel>Tỉnh/Thành phố</InputLabel>
                  <Select
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    label="Tỉnh/Thành phố"
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField('')}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: focusedField === 'city' ? '#ff6b35' : '#e0e0e0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ff6b35',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ff6b35',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>-- Chọn Tỉnh/Thành phố --</em>
                    </MenuItem>
                    {provinces.map((province) => (
                      <MenuItem key={province.code} value={province.code}>
                        {province.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6}>
              <motion.div
                animate={{ scale: focusedField === 'ward' ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <FormControl fullWidth error={!!errors.ward} disabled={!selectedProvince}>
                  <InputLabel>Phường/Xã</InputLabel>
                  <Select
                    value={selectedCommune}
                    onChange={handleCommuneChange}
                    label="Phường/Xã"
                    onFocus={() => setFocusedField('ward')}
                    onBlur={() => setFocusedField('')}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: focusedField === 'ward' ? '#ff6b35' : '#e0e0e0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ff6b35',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ff6b35',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>-- Chọn Phường/Xã --</em>
                    </MenuItem>
                    {communes.map((commune) => (
                      <MenuItem key={commune.code} value={commune.code}>
                        {commune.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>
          </Grid>
        )
      case 2:
        return (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <motion.div
                animate={{ scale: focusedField === 'password' ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <TextField
                  fullWidth
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  error={!!errors.password}
                  helperText={errors.password?.message || 'Ít nhất 8 ký tự'}
                  sx={inputStyle('password')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: focusedField === 'password' ? '#ff6b35' : '#999' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#999', '&:hover': { color: '#ff6b35' } }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </motion.div>
            </Grid>
            <Grid item xs={12}>
              <motion.div
                animate={{ scale: focusedField === 'passwordConfirmation' ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <TextField
                  fullWidth
                  label="Xác nhận mật khẩu"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('passwordConfirmation')}
                  onFocus={() => setFocusedField('passwordConfirmation')}
                  onBlur={() => setFocusedField('')}
                  error={!!errors.passwordConfirmation}
                  helperText={errors.passwordConfirmation?.message}
                  sx={inputStyle('passwordConfirmation')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: focusedField === 'passwordConfirmation' ? '#ff6b35' : '#999' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: '#999', '&:hover': { color: '#ff6b35' } }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </motion.div>
            </Grid>
          </Grid>
        )
      default:
        return null
    }
  }

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
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          position: 'relative',
          p: 6,
        }}
      >
        {/* Animated Background */}
        <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: Math.random() * 250 + 50,
                height: Math.random() * 250 + 50,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(255,107,53,${Math.random() * 0.12}) 0%, transparent 70%)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 80 - 40],
                y: [0, Math.random() * 80 - 40],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: Math.random() * 12 + 8,
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
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '25px',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 20px 60px rgba(255, 107, 53, 0.4)',
                }}
              >
                <Typography sx={{ fontSize: 45 }}>⚡</Typography>
              </Box>
            </motion.div>
            
            <Typography
              variant="h3"
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
              variant="subtitle1"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 300,
                letterSpacing: 2,
              }}
            >
              THAM GIA NGAY HÔM NAY
            </Typography>
          </Box>
        </motion.div>

        {/* Benefits */}
        <Box sx={{ mt: 6, position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
          <Typography
            variant="h6"
            sx={{ color: 'white', mb: 3, textAlign: 'center', fontWeight: 600 }}
          >
            Quyền lợi thành viên
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.15 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)',
                      transform: 'translateX(10px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 15 }}>
                      {benefit.title}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                      {benefit.desc}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Side - Register Form */}
      <Box
        sx={{
          flex: { xs: 1, lg: 1.2 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)',
          p: { xs: 2, md: 4 },
          position: 'relative',
          overflowY: 'auto',
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(247,147,30,0.04) 100%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(26,26,46,0.04) 0%, rgba(15,52,96,0.08) 100%)',
          }}
        />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Mobile Logo */}
            <Box sx={{ display: { xs: 'block', lg: 'none' }, textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 10px 40px rgba(255, 107, 53, 0.3)',
                }}
              >
                <Typography sx={{ fontSize: 32 }}>⚡</Typography>
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
                p: { xs: 3, md: 4 },
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

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 1 }}>
                  Tạo tài khoản
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  Bắt đầu hành trình mua sắm của bạn 🚀
                </Typography>
              </Box>

              {/* Stepper */}
              <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{
                  mb: 4,
                  '& .MuiStepLabel-root .Mui-completed': {
                    color: '#ff6b35',
                  },
                  '& .MuiStepLabel-root .Mui-active': {
                    color: '#ff6b35',
                  },
                  '& .MuiStepConnector-line': {
                    borderColor: '#e0e0e0',
                  },
                  '& .Mui-completed .MuiStepConnector-line': {
                    borderColor: '#ff6b35',
                  },
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          fontSize: { xs: 11, sm: 13 },
                          mt: 1,
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStepContent(activeStep)}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                  {activeStep > 0 && (
                    <Button
                      onClick={handleBack}
                      variant="outlined"
                      sx={{
                        flex: 1,
                        py: 1.5,
                        borderRadius: 3,
                        borderColor: '#ddd',
                        color: '#666',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#ff6b35',
                          color: '#ff6b35',
                          bgcolor: 'rgba(255, 107, 53, 0.05)',
                        },
                      }}
                    >
                      Quay lại
                    </Button>
                  )}
                  
                  {activeStep < steps.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      variant="contained"
                      sx={{
                        flex: 1,
                        py: 1.5,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #e55a2b 0%, #e0841a 100%)',
                        },
                      }}
                    >
                      Tiếp tục
                    </Button>
                  ) : (
                    <motion.div
                      style={{ flex: 1 }}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    >
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        startIcon={isLoading ? null : <HowToReg />}
                        sx={{
                          py: 1.5,
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
                          '&:disabled': {
                            background: '#ccc',
                          },
                        }}
                      >
                        {isLoading ? (
                          <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : (
                          'Hoàn tất đăng ký'
                        )}
                      </Button>
                    </motion.div>
                  )}
                </Box>

                {/* Progress indicator */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {steps.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: index === activeStep ? 24 : 8,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: index <= activeStep ? '#ff6b35' : '#e0e0e0',
                          transition: 'all 0.3s',
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Social Login */}
                <SocialLogin />

                {/* Divider */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    my: 3,
                  }}
                >
                  <Box sx={{ flex: 1, height: 1, bgcolor: '#e0e0e0' }} />
                  <Typography sx={{ px: 3, color: '#999', fontSize: 14 }}>
                    hoặc
                  </Typography>
                  <Box sx={{ flex: 1, height: 1, bgcolor: '#e0e0e0' }} />
                </Box>

                {/* Login Link */}
                <Box textAlign="center">
                  <Typography sx={{ color: '#666', fontSize: 15 }}>
                    Đã có tài khoản?{' '}
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
            <Box sx={{ textAlign: 'center', mt: 3 }}>
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

export default Register
