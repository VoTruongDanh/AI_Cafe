import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  InputAdornment,
  CircularProgress,
  Paper,
  Chip,
} from '@mui/material'
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  Security,
  CalendarMonth,
  VerifiedUser,
  Badge,
} from '@mui/icons-material'
import { updateProfile } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'

const AdminProfile = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || user?.address_line || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState({})
  const [phoneWarning, setPhoneWarning] = useState('') // ✅ Thêm state cho phone warning

  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || user?.address_line || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
    // Clear phone warning when user changes phone
    if (name === 'phone') {
      setPhoneWarning('')
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ và tên'
    }
    
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ Hàm check phone warning realtime
  const checkPhoneWarning = (phone) => {
    if (!phone || phone.trim().length === 0) {
      setPhoneWarning('')
      return
    }

    const cleanPhone = phone.replace(/\s/g, '')
    
    // Kiểm tra format trước
    if (!/^[0-9]*$/.test(cleanPhone)) {
      setPhoneWarning('⚠️ Số điện thoại chỉ được chứa chữ số')
      return
    }
    
    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      setPhoneWarning('⚠️ Số điện thoại phải có ít nhất 10 chữ số')
      return
    }
    
    if (cleanPhone.length > 11) {
      setPhoneWarning('⚠️ Số điện thoại không được quá 11 chữ số')
      return
    }

    // Nếu phone giống phone hiện tại của user → OK
    if (phone.trim() === user?.phone) {
      setPhoneWarning('✅ Số điện thoại hiện tại')
      return
    }

    // Nếu phone khác và hợp lệ → Cảnh báo sẽ check khi submit
    if (/^[0-9]{10,11}$/.test(cleanPhone)) {
      setPhoneWarning('ℹ️ Số điện thoại sẽ được kiểm tra khi cập nhật')
    } else {
      setPhoneWarning('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const result = await dispatch(updateProfile(formData))
      
      if (updateProfile.fulfilled.match(result)) {
        toast.success('Cập nhật thông tin thành công')
        setIsEditing(false)
        setPhoneWarning('') // ✅ Clear warning khi thành công
      } else {
        // ✅ Xử lý lỗi từ backend
        const errorPayload = result.payload
        
        // Nếu có lỗi validation từ backend (422)
        if (errorPayload?.errors) {
          const backendErrors = {}
          Object.keys(errorPayload.errors).forEach((key) => {
            backendErrors[key] = errorPayload.errors[key][0]
          })
          setErrors(backendErrors)
          
          // Hiển thị lỗi phone nếu có
          if (backendErrors.phone) {
            setPhoneWarning(`⚠️ ${backendErrors.phone}`)
            toast.error(backendErrors.phone)
          } else {
            toast.error('Vui lòng kiểm tra lại thông tin')
          }
        } else {
          const errorMessage = errorPayload?.message || errorPayload || 'Cập nhật thông tin thất bại'
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Có lỗi xảy ra khi cập nhật thông tin')
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'A'
    const names = name.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Quản trị viên',
      staff: 'Nhân viên',
      customer: 'Khách hàng'
    }
    return roles[role] || role
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4, 
        p: 3, 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        borderRadius: 3,
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Thông tin tài khoản
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Quản lý thông tin cá nhân của bạn
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            {/* Background decoration */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 80,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            }} />
            
            <Avatar
              sx={{
                width: 100,
                height: 100,
                margin: '40px auto 16px',
                bgcolor: 'white',
                color: '#1976d2',
                fontSize: '2rem',
                fontWeight: 700,
                border: '4px solid white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {getInitials(user?.name)}
            </Avatar>
            
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#333' }}>
              {user?.name || 'Admin'}
            </Typography>
            
            <Chip 
              icon={<Security sx={{ fontSize: 16 }} />}
              label={getRoleLabel(user?.role)}
              color="primary"
              size="small"
              sx={{ mb: 2, fontWeight: 500 }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Contact Info */}
            <Box sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Email sx={{ color: '#1976d2', fontSize: 22 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user?.email || 'Chưa cập nhật'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Phone sx={{ color: '#4caf50', fontSize: 22 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Số điện thoại</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user?.phone || 'Chưa cập nhật'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <LocationOn sx={{ color: '#ff9800', fontSize: 22 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Địa chỉ</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user?.address || user?.address_line || 'Chưa cập nhật'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <CalendarMonth sx={{ color: '#9c27b0', fontSize: 22 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Ngày tạo tài khoản</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatDate(user?.created_at)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: user?.is_active ? '#e8f5e9' : '#ffebee', borderRadius: 2 }}>
                <VerifiedUser sx={{ color: user?.is_active ? '#4caf50' : '#f44336', fontSize: 22 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Trạng thái</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: user?.is_active ? '#4caf50' : '#f44336' }}>
                    {user?.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Edit Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Edit sx={{ color: '#1976d2' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Chỉnh sửa thông tin
                </Typography>
              </Box>
              {!isEditing && (
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                  sx={{ 
                    bgcolor: '#1976d2',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Chỉnh sửa
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Họ và tên"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    error={!!errors.name}
                    helperText={errors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: isEditing ? '#1976d2' : '#999' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#999' }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Email không thể thay đổi"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: '#f5f5f5',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      handleChange(e)
                      if (isEditing) {
                        checkPhoneWarning(e.target.value) // ✅ Check warning khi gõ
                      }
                    }}
                    disabled={!isEditing}
                    error={!!errors.phone || (phoneWarning && phoneWarning.startsWith('⚠️'))}
                    helperText={
                      errors.phone || 
                      phoneWarning || 
                      'Nhập số điện thoại (10-11 chữ số)'
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: isEditing ? (errors.phone || (phoneWarning && phoneWarning.startsWith('⚠️')) ? '#f44336' : '#4caf50') : '#999' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Địa chỉ"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn sx={{ color: isEditing ? '#ff9800' : '#999' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
              </Grid>

              {isEditing && (
                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    disabled={isLoading}
                    sx={{ 
                      bgcolor: '#4caf50',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      '&:hover': { bgcolor: '#43a047' }
                    }}
                  >
                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        address: user?.address || user?.address_line || '',
                      })
                      setErrors({})
                      setPhoneWarning('') // ✅ Clear warning khi hủy
                    }}
                    disabled={isLoading}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Hủy
                  </Button>
                </Box>
              )}
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdminProfile
