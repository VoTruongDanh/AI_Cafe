import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Tooltip,
} from '@mui/material'
import {
  LocalFireDepartment,
  AcUnit,
  HelpOutline,
  Psychology,
  Rule,
} from '@mui/icons-material'
import api from '../../services/api'
import { toast } from 'react-toastify'

const AIClassification = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({
    hot: 0,
    cold: 0,
    unknown: 0,
    total: 0,
    bySource: {
      RULE: 0,
      LOCAL_AI: 0,
      MODEL: 0,
      ATTRIBUTE: 0,
      UNKNOWN: 0,
    },
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/products/classify-temperature', {
        params: { limit: 1000 }, // Lấy tất cả
      })

      if (response.data.success) {
        const data = response.data.data || []
        setProducts(data)

        // Tính thống kê
        const statsData = {
          hot: 0,
          cold: 0,
          unknown: 0,
          total: data.length,
          bySource: {
            RULE: 0,
            LOCAL_AI: 0,
            MODEL: 0,
            ATTRIBUTE: 0,
            UNKNOWN: 0,
          },
        }

        data.forEach((product) => {
          const temp = product.temperature
          const source = product.source

          if (temp === 'HOT') statsData.hot++
          else if (temp === 'COLD') statsData.cold++
          else statsData.unknown++

          if (source in statsData.bySource) {
            statsData.bySource[source]++
          }
        })

        setStats(statsData)
      } else {
        setError(response.data.message || 'Có lỗi xảy ra')
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err.response?.data?.message || 'Không thể tải dữ liệu')
      toast.error('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const getTemperatureIcon = (temp) => {
    switch (temp) {
      case 'HOT':
        return <LocalFireDepartment sx={{ color: '#ff6b35' }} />
      case 'COLD':
        return <AcUnit sx={{ color: '#4a90e2' }} />
      default:
        return <HelpOutline sx={{ color: '#666' }} />
    }
  }

  const getTemperatureLabel = (temp) => {
    switch (temp) {
      case 'HOT':
        return 'Nóng'
      case 'COLD':
        return 'Lạnh'
      default:
        return 'Không biết'
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

  const getSourceIcon = (source) => {
    switch (source) {
      case 'RULE':
        return <Rule fontSize="small" />
      case 'LOCAL_AI':
      case 'MODEL':
        return <Psychology fontSize="small" />
      case 'ATTRIBUTE':
        return <HelpOutline fontSize="small" />
      default:
        return <HelpOutline fontSize="small" />
    }
  }

  const getSourceLabel = (source) => {
    switch (source) {
      case 'RULE':
        return 'Rule-Based'
      case 'LOCAL_AI':
        return 'AI Model'
      case 'MODEL':
        return 'AI Model'
      case 'ATTRIBUTE':
        return 'Attributes'
      default:
        return 'Unknown'
    }
  }

  const getSourceColor = (source) => {
    switch (source) {
      case 'RULE':
        return '#8B4513'
      case 'LOCAL_AI':
      case 'MODEL':
        return '#9c27b0'
      case 'ATTRIBUTE':
        return '#2196f3'
      default:
        return '#666'
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const hotProducts = products.filter((p) => p.temperature === 'HOT')
  const coldProducts = products.filter((p) => p.temperature === 'COLD')
  const unknownProducts = products.filter((p) => p.temperature === 'UNKNOWN')

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Phân Loại Nhiệt Độ Sản Phẩm (AI)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Xem các sản phẩm được phân loại bằng Rule-Based hoặc AI Model
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocalFireDepartment sx={{ fontSize: 40, color: '#ff6b35' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.hot}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sản phẩm Nóng
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AcUnit sx={{ fontSize: 40, color: '#4a90e2' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.cold}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sản phẩm Lạnh
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HelpOutline sx={{ fontSize: 40, color: '#666' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.unknown}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chưa phân loại
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Phân loại theo nguồn
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Rule-Based:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.bySource.RULE}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">AI Model:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.bySource.LOCAL_AI + stats.bySource.MODEL}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Attributes:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.bySource.ATTRIBUTE}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Products Grid - 3 Columns */}
      {!loading && (
        <Grid container spacing={3}>
          {/* Column 1: HOT */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LocalFireDepartment sx={{ color: '#ff6b35', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold" color="#ff6b35">
                  Nóng ({hotProducts.length})
                </Typography>
              </Box>
              <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {hotProducts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Không có sản phẩm
                  </Typography>
                ) : (
                  hotProducts.map((product) => (
                    <Card key={product.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {product.thumbnail && (
                            <Box
                              component="img"
                              src={product.thumbnail}
                              alt={product.name}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 1,
                              }}
                            />
                          )}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              {product.name}
                            </Typography>
                            {product.categoryName && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {product.categoryName}
                              </Typography>
                            )}
                            <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mt: 0.5 }}>
                              {formatPrice(product.price)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              <Tooltip title={getSourceLabel(product.source)}>
                                <Chip
                                  icon={getSourceIcon(product.source)}
                                  label={getSourceLabel(product.source)}
                                  size="small"
                                  sx={{
                                    bgcolor: getSourceColor(product.source),
                                    color: 'white',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </Tooltip>
                              <Chip
                                label={`${(product.confidence * 100).toFixed(0)}%`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                            {product.reason && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                {product.reason}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Column 2: COLD */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AcUnit sx={{ color: '#4a90e2', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold" color="#4a90e2">
                  Lạnh ({coldProducts.length})
                </Typography>
              </Box>
              <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {coldProducts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Không có sản phẩm
                  </Typography>
                ) : (
                  coldProducts.map((product) => (
                    <Card key={product.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {product.thumbnail && (
                            <Box
                              component="img"
                              src={product.thumbnail}
                              alt={product.name}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 1,
                              }}
                            />
                          )}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              {product.name}
                            </Typography>
                            {product.categoryName && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {product.categoryName}
                              </Typography>
                            )}
                            <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mt: 0.5 }}>
                              {formatPrice(product.price)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              <Tooltip title={getSourceLabel(product.source)}>
                                <Chip
                                  icon={getSourceIcon(product.source)}
                                  label={getSourceLabel(product.source)}
                                  size="small"
                                  sx={{
                                    bgcolor: getSourceColor(product.source),
                                    color: 'white',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </Tooltip>
                              <Chip
                                label={`${(product.confidence * 100).toFixed(0)}%`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                            {product.reason && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                {product.reason}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Column 3: UNKNOWN */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <HelpOutline sx={{ color: '#666', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold" color="#666">
                  Không biết ({unknownProducts.length})
                </Typography>
              </Box>
              <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {unknownProducts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Không có sản phẩm
                  </Typography>
                ) : (
                  unknownProducts.map((product) => (
                    <Card key={product.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {product.thumbnail && (
                            <Box
                              component="img"
                              src={product.thumbnail}
                              alt={product.name}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 1,
                              }}
                            />
                          )}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              {product.name}
                            </Typography>
                            {product.categoryName && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {product.categoryName}
                              </Typography>
                            )}
                            <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mt: 0.5 }}>
                              {formatPrice(product.price)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              <Tooltip title={getSourceLabel(product.source)}>
                                <Chip
                                  icon={getSourceIcon(product.source)}
                                  label={getSourceLabel(product.source)}
                                  size="small"
                                  sx={{
                                    bgcolor: getSourceColor(product.source),
                                    color: 'white',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </Tooltip>
                              <Chip
                                label={`${(product.confidence * 100).toFixed(0)}%`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                            {product.reason && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                {product.reason}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  )
}

export default AIClassification
