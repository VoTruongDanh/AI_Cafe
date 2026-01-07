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
} from '@mui/material'
import {
  Thermostat,
  LocalFireDepartment,
  AcUnit,
  ShoppingCart,
  Favorite,
  Visibility,
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
      const tempType = parsedTemp >= 31 ? 'COLD' : 'HOT'

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

  // Tự động load khi temperature thay đổi (với debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (temperature) {
        fetchSuggestions(temperature)
      }
    }, 500) // Debounce 500ms

    return () => clearTimeout(timer)
  }, [temperature, minConfidence])

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
        <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nhiệt độ hiện tại (°C)"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="Nhập nhiệt độ..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Thermostat sx={{ color: '#8B4513' }} />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                }}
              />
              {loading && (
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
