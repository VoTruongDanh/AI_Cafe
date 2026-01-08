import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Slider,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Rating,
} from '@mui/material'
import { Search, FilterList } from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const AdvancedSearch = ({ open, onClose }) => {
  const navigate = useNavigate()
  const { categories } = useSelector((state) => state.categories)
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceRange: [0, 100000000],
    minRating: 0,
    inStock: '',
    sortBy: '',
  })

  const handleChange = (field, value) => {
    setFilters({ ...filters, [field]: value })
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.category) params.append('category', filters.category)
    if (filters.priceRange[0] > 0) params.append('minPrice', filters.priceRange[0])
    if (filters.priceRange[1] < 100000000) params.append('maxPrice', filters.priceRange[1])
    if (filters.minRating > 0) params.append('minRating', filters.minRating)
    if (filters.inStock) params.append('inStock', filters.inStock)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)

    navigate(`/products?${params.toString()}`)
    onClose()
  }

  const handleReset = () => {
    setFilters({
      search: '',
      category: '',
      priceRange: [0, 100000000],
      minRating: 0,
      inStock: '',
      sortBy: '',
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterList />
        Tìm kiếm nâng cao
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Search Text */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Từ khóa"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="Nhập tên sản phẩm, thương hiệu..."
            />
          </Grid>

          {/* Category */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={filters.category}
                label="Danh mục"
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sort By */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Sắp xếp</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sắp xếp"
                onChange={(e) => handleChange('sortBy', e.target.value)}
              >
                <MenuItem value="">Mặc định</MenuItem>
                <MenuItem value="price_asc">Giá: Thấp đến cao</MenuItem>
                <MenuItem value="price_desc">Giá: Cao đến thấp</MenuItem>
                <MenuItem value="newest">Mới nhất</MenuItem>
                <MenuItem value="popular">Phổ biến nhất</MenuItem>
                <MenuItem value="rating">Đánh giá cao</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Price Range */}
          <Grid item xs={12}>
            <Typography gutterBottom>
              Khoảng giá: {filters.priceRange[0].toLocaleString()}đ - {filters.priceRange[1].toLocaleString()}đ
            </Typography>
            <Slider
              value={filters.priceRange}
              onChange={(e, newValue) => handleChange('priceRange', newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={100000000}
              step={1000000}
              valueLabelFormat={(value) => `${(value / 1000000).toFixed(0)}tr`}
              sx={{
                '& .MuiSlider-thumb': {
                  bgcolor: '#e63946',
                },
                '& .MuiSlider-track': {
                  bgcolor: '#e63946',
                },
                '& .MuiSlider-rail': {
                  bgcolor: '#ddd',
                },
              }}
            />
          </Grid>

          {/* Min Rating */}
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Đánh giá tối thiểu</Typography>
            <Rating
              value={filters.minRating}
              onChange={(e, newValue) => handleChange('minRating', newValue)}
              size="large"
            />
          </Grid>

          {/* In Stock */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tình trạng</InputLabel>
              <Select
                value={filters.inStock}
                label="Tình trạng"
                onChange={(e) => handleChange('inStock', e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="true">Còn hàng</MenuItem>
                <MenuItem value="false">Hết hàng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleReset} color="inherit">
          Đặt lại
        </Button>
        <Button onClick={onClose}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<Search />}
          sx={{
            bgcolor: '#e63946',
            '&:hover': { bgcolor: '#d62839' },
          }}
        >
          Tìm kiếm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AdvancedSearch
