import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from '@mui/material'
import {
  Thermostat,
  LocalFireDepartment,
  AcUnit,
  ShoppingCart,
  Favorite,
  Visibility,
  LocationOn,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import api from '../../services/api'

const AIPage = () => {
  const navigate = useNavigate()
  const [temperature, setTemperature] = useState('32')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState(null)
  const [minConfidence, setMinConfidence] = useState(0.6)
  const [useLocation, setUseLocation] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationInfo, setLocationInfo] = useState(null)

  // Gợi ý món ăn theo nhiệt độ
  const fetchSuggestions = async (tempValue) => {
    if (!tempValue || tempValue === '') {
      return
    }

    const parsedTemp = parseFloat(tempValue)
    if (isNaN(parsedTemp)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Logic: Trời nóng (>=31°C) → uống đồ lạnh (COLD), Trời lạnh (<31°C) → uống đồ nóng (HOT)
      const tempType = parsedTemp >= 30 ? 'COLD' : 'HOT'

      const response = await api.get('/products/suggest-by-temperature', {
        params: {
          temperature: tempType,
          limit: 12,
          min_confidence: minConfidence,
        },
      })

      if (response.data.success) {
        setSuggestions(response.data.data || [])
      } else {
        setError(response.data.message || 'Có lỗi xảy ra')
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err)
      setError(err.response?.data?.message || 'Không thể tải gợi ý. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Lấy nhiệt độ từ vị trí
  const fetchTemperatureFromLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ lấy vị trí')
      setUseLocation(false)
      return
    }

    setLocationLoading(true)
    setError(null)

    try {
      // Kiểm tra quyền truy cập vị trí trước
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' })
          console.log('Geolocation permission status:', permission.state)
          
          if (permission.state === 'denied') {
            toast.error('Quyền truy cập vị trí đã bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.')
            setUseLocation(false)
            return
          }
        } catch (permErr) {
          console.warn('Cannot check permission:', permErr)
          // Tiếp tục thử lấy vị trí
        }
      }

      // Lấy vị trí hiện tại với options tối ưu hơn
      const position = await new Promise((resolve, reject) => {
        let hasResolved = false
        
        // Thử với high accuracy trước
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!hasResolved) {
              hasResolved = true
              resolve(pos)
            }
          },
          (error) => {
            console.warn('High accuracy failed, trying low accuracy:', error)
            // Nếu high accuracy thất bại, thử với low accuracy
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (!hasResolved) {
                  hasResolved = true
                  resolve(pos)
                }
              },
              (err) => {
                if (!hasResolved) {
                  hasResolved = true
                  reject(err)
                }
              },
              {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 300000, // Cache 5 phút
              }
            )
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        )
      })

      const { latitude, longitude } = position.coords
      console.log('Location obtained:', { latitude, longitude })

      // Gọi API để lấy nhiệt độ
      const response = await api.get('/weather/temperature', {
        params: { lat: latitude, lon: longitude },
      })

      if (response.data.success) {
        const temp = response.data.temperature
        setTemperature(temp.toString())
        setLocationInfo({
          city: response.data.city,
          country: response.data.country,
          description: response.data.description,
        })
        toast.success(`Đã lấy nhiệt độ: ${temp}°C${response.data.city ? ` tại ${response.data.city}` : ''}`)
      } else {
        throw new Error(response.data.message || 'Không thể lấy nhiệt độ')
      }
    } catch (err) {
      console.error('Error fetching temperature from location:', err)
      
      // Xử lý lỗi geolocation
      if (err.code !== undefined) {
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            toast.error('Người dùng đã từ chối cấp quyền vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt.')
            break
          case 2: // POSITION_UNAVAILABLE
            toast.error('Không thể xác định vị trí. Vui lòng kiểm tra kết nối GPS/WiFi.')
            break
          case 3: // TIMEOUT
            toast.error('Hết thời gian chờ lấy vị trí. Vui lòng thử lại.')
            break
          default:
            toast.error('Lỗi không xác định khi lấy vị trí')
        }
      } else if (err.response) {
        // Lỗi từ API
        toast.error(err.response?.data?.message || 'Không thể lấy nhiệt độ từ API')
      } else {
        // Lỗi khác
        toast.error(err.message || 'Không thể lấy nhiệt độ từ vị trí')
      }
      setUseLocation(false)
    } finally {
      setLocationLoading(false)
    }
  }

  // Tự động lấy nhiệt độ khi bật useLocation
  useEffect(() => {
    if (useLocation) {
      fetchTemperatureFromLocation()
    } else {
      setLocationInfo(null)
    }
  }, [useLocation])

  // Tự động load khi temperature thay đổi (với debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (temperature && !locationLoading) {
        fetchSuggestions(temperature)
      }
    }, 500) // Debounce 500ms

    return () => clearTimeout(timer)
  }, [temperature, minConfidence, locationLoading])

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const getTemperatureIcon = (temp) => {
    switch (temp) {
      case 'HOT':
        return <LocalFireDepartment sx={{ color: '#ff6b35' }} />
      case 'COLD':
        return <AcUnit sx={{ color: '#4a90e2' }} />
      default:
        return <Thermostat sx={{ color: '#666' }} />
    }
  }

  const getTemperatureLabel = (temp) => {
    switch (temp) {
      case 'HOT':
        return 'Nóng'
      case 'COLD':
        return 'Lạnh'
      default:
        return 'Không xác định'
    }
  }

  const getTemperatureColor = (temp) => {
    switch (temp) {
      case 'HOT':
        return '#ff6b35'
      case 'COLD':
        return '#4a90e2'
      default:
        return '#666'
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        {/* Input Form */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12}>
              {/* Responsive layout: Stack on mobile, side-by-side on desktop */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: { xs: 2, sm: 2 },
                  mb: 2 
                }}
              >
                <TextField
                  fullWidth
                  label="Nhiệt độ hiện tại (°C)"
                  type="number"
                  value={temperature}
                  onChange={(e) => {
                    setTemperature(e.target.value)
                    setUseLocation(false) // Tắt auto-detect khi người dùng tự nhập
                  }}
                  placeholder="Nhập nhiệt độ..."
                  disabled={useLocation && locationLoading}
                  sx={{
                    flex: { xs: '1 1 100%', sm: '1 1 auto' },
                    minWidth: { xs: '100%', sm: 200 },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Thermostat sx={{ color: '#8B4513', fontSize: { xs: 20, sm: 24 } }} />
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                  }}
                />
                <Tooltip 
                  title={
                    !navigator.geolocation 
                      ? "Trình duyệt không hỗ trợ lấy vị trí"
                      : "Lấy nhiệt độ tự động theo vị trí hiện tại (yêu cầu cấp quyền vị trí)"
                  }
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useLocation}
                        onChange={(e) => {
                          if (!navigator.geolocation) {
                            toast.error('Trình duyệt không hỗ trợ lấy vị trí')
                            return
                          }
                          setUseLocation(e.target.checked)
                        }}
                        disabled={!navigator.geolocation}
                        sx={{
                          color: '#8B4513',
                          '&.Mui-checked': {
                            color: '#8B4513',
                          },
                          '&.Mui-disabled': {
                            color: '#ccc',
                          },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn 
                          sx={{ 
                            fontSize: { xs: 18, sm: 20 }, 
                            color: useLocation ? '#8B4513' : (!navigator.geolocation ? '#ccc' : '#666'),
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: useLocation ? '#8B4513' : (!navigator.geolocation ? '#ccc' : '#666'),
                            fontWeight: 'medium',
                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Tự động
                        </Typography>
                      </Box>
                    }
                    sx={{
                      flexShrink: 0,
                      marginLeft: { xs: 0, sm: 1 },
                      marginRight: { xs: 0, sm: 0 },
                    }}
                  />
                </Tooltip>
              </Box>
              
              {locationInfo && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    📍 {locationInfo.city && `${locationInfo.city}, `}
                    {locationInfo.country}
                    {locationInfo.description && ` - ${locationInfo.description}`}
                  </Typography>
                </Box>
              )}
              
              {(loading || locationLoading) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} sx={{ color: '#8B4513' }} />
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {suggestions.length > 0 && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
              Gợi ý cho bạn ({suggestions.length} sản phẩm)
            </Typography>
            <Grid container spacing={3}>
              {suggestions.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                    }}
                    onClick={() => handleProductClick(product.id)}
                  >
                    {/* Product Image */}
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '75%',
                        overflow: 'hidden',
                        bgcolor: '#f5f5f5',
                      }}
                    >
                      {product.thumbnail ? (
                        <Box
                          component="img"
                          src={product.thumbnail}
                          alt={product.name}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#ccc',
                          }}
                        >
                          <ShoppingCart sx={{ fontSize: 48 }} />
                        </Box>
                      )}
                      
                      {/* Temperature Badge */}
                      <Chip
                        icon={getTemperatureIcon(product.temperature)}
                        label={getTemperatureLabel(product.temperature)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: getTemperatureColor(product.temperature),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />

                    </Box>

                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          mb: 1,
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {product.name}
                      </Typography>

                      {product.categoryName && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {product.categoryName}
                        </Typography>
                      )}

                      {product.short_description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            flexGrow: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {product.short_description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {formatPrice(product.price)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Handle favorite
                            }}
                          >
                            <Favorite fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProductClick(product.id)
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Reason */}
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {product.reason}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Empty State */}
        {!loading && suggestions.length === 0 && !error && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Thermostat sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Đang tải gợi ý...
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  )
}

export default AIPage
