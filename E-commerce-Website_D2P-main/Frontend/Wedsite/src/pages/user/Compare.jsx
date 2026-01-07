import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { removeFromCompare, clearCompare } from '../../store/slices/compareSlice'
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Rating,
} from '@mui/material'
import { Close, ShoppingCart, ArrowBack } from '@mui/icons-material'

const Compare = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { products } = useSelector((state) => state.compare)

  const handleRemove = (id) => {
    dispatch(removeFromCompare(id))
  }

  const handleClear = () => {
    dispatch(clearCompare())
  }

  if (products.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          Chưa có sản phẩm để so sánh
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: '#636e72' }}>
          Hãy thêm sản phẩm vào danh sách so sánh để xem chi tiết
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/products')}
          sx={{
            bgcolor: '#e63946',
            '&:hover': { bgcolor: '#d62839' },
          }}
        >
          Xem sản phẩm
        </Button>
      </Container>
    )
  }

  const attributes = [
    { key: 'name', label: 'Tên sản phẩm' },
    { key: 'price', label: 'Giá bán', format: (val) => `${val?.toLocaleString()}đ` },
    { key: 'original_price', label: 'Giá gốc', format: (val) => val ? `${val.toLocaleString()}đ` : '-' },
    { key: 'category', label: 'Danh mục', format: (val) => val?.name },
    { key: 'rating', label: 'Đánh giá', isRating: true },
    { key: 'quantity', label: 'Tồn kho' },
    { key: 'warranty_months', label: 'Bảo hành', format: (val) => `${val} tháng` },
    { key: 'weight', label: 'Trọng lượng', format: (val) => `${val} kg` },
    { key: 'dimensions', label: 'Kích thước' },
  ]

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2d3436' }}>
            So sánh sản phẩm ({products.length}/4)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/products')}
            >
              Tiếp tục mua sắm
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleClear}
            >
              Xóa tất cả
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold', width: 200 }}>Thuộc tính</TableCell>
                {products.map((product) => (
                  <TableCell key={product.id} align="center" sx={{ width: `${100 / products.length}%` }}>
                    <Box sx={{ position: 'relative' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(product.id)}
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          bgcolor: '#e63946',
                          color: 'white',
                          '&:hover': { bgcolor: '#d62839' },
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                      <Box
                        component="img"
                        src={product.thumbnail || '/placeholder.png'}
                        alt={product.name}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'contain',
                          mb: 2,
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/products/${product.id}`)}
                      />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {attributes.map((attr, index) => (
                <TableRow key={attr.key} sx={{ bgcolor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#2d3436' }}>
                    {attr.label}
                  </TableCell>
                  {products.map((product) => (
                    <TableCell key={product.id} align="center">
                      {attr.isRating ? (
                        <Box>
                          <Rating value={product[attr.key] || 0} readOnly size="small" />
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            ({product[attr.key] || 0})
                          </Typography>
                        </Box>
                      ) : attr.key === 'name' ? (
                        <Typography
                          sx={{
                            fontWeight: 'bold',
                            color: '#2d3436',
                            cursor: 'pointer',
                            '&:hover': { color: '#e63946' },
                          }}
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          {product[attr.key]}
                        </Typography>
                      ) : attr.key === 'price' && product.has_active_promotion && product.effective_price && product.price > product.effective_price ? (
                        <Box>
                          <Typography variant="h6" sx={{ color: '#e63946', fontWeight: 'bold' }}>
                            {attr.format ? attr.format(product.effective_price) : product.effective_price}
                          </Typography>
                          <Chip
                            label={`-${Math.round((1 - product.effective_price / product.price) * 100)}%`}
                            size="small"
                            sx={{ bgcolor: '#e63946', color: 'white', mt: 0.5 }}
                          />
                        </Box>
                      ) : (
                        <Typography>
                          {attr.format ? attr.format(product[attr.key]) : product[attr.key] || '-'}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                {products.map((product) => (
                  <TableCell key={product.id} align="center">
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ShoppingCart />}
                      sx={{
                        bgcolor: '#e63946',
                        '&:hover': { bgcolor: '#d62839' },
                      }}
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      Xem chi tiết
                    </Button>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  )
}

export default Compare
