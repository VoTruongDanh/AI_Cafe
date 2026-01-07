import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { debounce } from 'lodash'
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  Pagination,
  CircularProgress,
  Drawer,
  IconButton,
  Chip,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Slider,
} from '@mui/material'
import {
  Tune as TuneIcon,
  ViewModule,
  ViewList,
  Clear,
  ExpandMore,
} from '@mui/icons-material'
import { fetchProducts, updateProduct } from '../../store/slices/productsSlice'
import ProductCard from '../../components/common/ProductCard'
import { formatCurrency } from '../../services/utils'
import { usePreloader } from '../../contexts/PreloaderContext'

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useDispatch()
  const { products, pagination, isLoading, isInitialized } = useSelector((state) => state.products)
  const { categories } = useSelector((state) => state.categories)
  const { markDataReady } = usePreloader()
  
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  
  // Accordion state
  const [expandedAccordion, setExpandedAccordion] = useState({
    category: true,
    priceRange: true,
    quickFilters: false,
  })
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [priceRange, setPriceRange] = useState([0, 50000000])
  const [sortBy, setSortBy] = useState('newest')
  const [showPromotionsOnly, setShowPromotionsOnly] = useState(false)
  const [showInStockOnly, setShowInStockOnly] = useState(false)

  // ✅ WebSocket: Global listener trong App.jsx sẽ tự động cập nhật Redux store
  // Redux store sẽ trigger re-render khi có product update

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion((prev) => ({
      ...prev,
      [panel]: isExpanded,
    }))
  }

  const search = searchParams.get('search') || ''
  const categoryParam = searchParams.get('category') || ''
  const filterParam = searchParams.get('filter') || ''

  // Sync URL filter params with state
  useEffect(() => {
    // Auto-enable promotions filter for promotion and special filters
    if ((filterParam === 'promotion' || filterParam === 'special') && !showPromotionsOnly) {
      setShowPromotionsOnly(true)
    }
    // Auto-set sort for bestseller filter
    if (filterParam === 'bestseller' && sortBy !== 'bestseller') {
      setSortBy('bestseller')
    }
    // Auto-set sort for new products filter
    if (filterParam === 'new' && sortBy !== 'newest') {
      setSortBy('newest')
    }
  }, [filterParam, showPromotionsOnly, sortBy])

  // Sync selectedCategory with URL params only when URL changes
  useEffect(() => {
    if (categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam)
      setPage(1)
    }
  }, [categoryParam, selectedCategory])

  // ✅ OPTIMIZATION: Debounce fetch để tránh gọi API quá nhiều lần
  const debouncedFetch = useMemo(
    () => debounce((filters) => {
      dispatch(fetchProducts(filters))
    }, 500), // Đợi 500ms sau lần thay đổi cuối cùng
    [dispatch]
  )

  useEffect(() => {
    // Build filters based on filterParam
    const buildFilters = () => {
      const filters = {
        price_min: priceRange[0],
        price_max: priceRange[1],
      }
      
      // Handle different filter types from URL
      if (filterParam === 'promotion') {
        // Flash Sale - sản phẩm có khuyến mãi flash sale
        filters.is_flash_sale = true
      }
      if (filterParam === 'special' || showPromotionsOnly) {
        // Khuyến mãi đặc biệt - sản phẩm giảm giá thường
        filters.has_promotion = true
      }
      if (filterParam === 'featured') {
        filters.is_featured = true
      }
      
      return filters
    }

    // Determine sort based on filterParam
    const getSortBy = () => {
      if (filterParam === 'bestseller') return 'bestseller'
      if (filterParam === 'new') return 'newest'
      return sortBy
    }

    // ✅ Sử dụng debounced function thay vì dispatch trực tiếp
    debouncedFetch({ 
      page, 
      limit: 20, 
      search, 
      categoryId: selectedCategory || undefined,
      filters: buildFilters(),
      sort: getSortBy()
    })
    
    // ✅ Cleanup: Cancel debounce khi component unmount
    return () => debouncedFetch.cancel()
  }, [dispatch, page, search, selectedCategory, priceRange[0], priceRange[1], sortBy, showPromotionsOnly, filterParam, debouncedFetch])

  // Đánh dấu preloader đã sẵn sàng khi dữ liệu đã load
  useEffect(() => {
    if (isInitialized) {
      markDataReady()
    }
  }, [isInitialized, markDataReady])

  const handlePageChange = (event, value) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearFilters = () => {
    setSelectedCategory('')
    setSelectedBrand('')
    setPriceRange([0, 50000000])
    setShowPromotionsOnly(false)
    setShowInStockOnly(false)
    setSearchParams({})
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setPage(1)
    setSearchParams({ category: categoryId })
  }

  const hasActiveFilters = selectedCategory || selectedBrand || priceRange[0] > 0 || priceRange[1] < 50000000 || showPromotionsOnly

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        py: 3,
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h5" fontWeight="bold">
              {search 
                ? `Kết quả tìm kiếm: "${search}"` 
                : filterParam === 'promotion' 
                  ? '🔥 Flash Sale - Giờ Vàng Giá Sốc'
                  : filterParam === 'special'
                    ? '⚡ Khuyến Mãi Đặc Biệt'
                  : filterParam === 'featured'
                    ? '⭐ Sản Phẩm Nổi Bật'
                  : filterParam === 'bestseller'
                    ? '🔥 Bán Chạy Nhất'
                  : filterParam === 'new'
                    ? '🆕 Sản Phẩm Mới'
                    : 'Tất cả sản phẩm'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pagination.total} sản phẩm
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {/* Mobile Filter Button */}
            <IconButton
              onClick={() => setMobileFilterOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <TuneIcon />
            </IconButton>

            {/* View Toggle */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <IconButton
                onClick={() => setViewMode('grid')}
                sx={{ 
                  bgcolor: viewMode === 'grid' ? '#d32f2f' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'inherit',
                  '&:hover': { bgcolor: viewMode === 'grid' ? '#b71c1c' : '#f5f5f5' }
                }}
              >
                <ViewModule />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('list')}
                sx={{ 
                  bgcolor: viewMode === 'list' ? '#d32f2f' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'inherit',
                  '&:hover': { bgcolor: viewMode === 'list' ? '#b71c1c' : '#f5f5f5' }
                }}
              >
                <ViewList />
              </IconButton>
            </Box>

            {/* Sort Dropdown */}
            <Box component="select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{
                p: 1,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                cursor: 'pointer',
                fontSize: '14px',
                '&:hover': { borderColor: '#d32f2f' }
              }}
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
              <option value="bestseller">Bán chạy nhất</option>
              <option value="name_asc">Tên A-Z</option>
            </Box>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {hasActiveFilters && (
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            {selectedCategory && (
              <Chip
                label={`Danh mục: ${categories.find(c => c.id === Number(selectedCategory))?.name || ''}`}
                onDelete={() => handleCategoryChange('')}
                color="primary"
              />
            )}
            {(showPromotionsOnly || filterParam === 'featured' || filterParam === 'bestseller' || filterParam === 'new') && (
              <Chip
                label={
                  filterParam === 'special' 
                    ? '⚡ Khuyến Mãi Đặc Biệt' 
                    : filterParam === 'promotion'
                      ? '🔥 Flash Sale - Khuyến mãi'
                    : filterParam === 'featured'
                      ? '⭐ Sản phẩm nổi bật'
                    : filterParam === 'bestseller'
                      ? '🔥 Bán chạy nhất'
                    : filterParam === 'new'
                      ? '🆕 Sản phẩm mới'
                      : '🔥 Flash Sale - Khuyến mãi'
                }
                onDelete={() => {
                  setShowPromotionsOnly(false)
                  setSortBy('newest')
                  // Remove filter param from URL
                  const params = new URLSearchParams(searchParams)
                  params.delete('filter')
                  setSearchParams(params)
                }}
                color="error"
                sx={{ fontWeight: 'bold' }}
              />
            )}
            {showInStockOnly && (
              <Chip
                label="Còn hàng"
                onDelete={() => setShowInStockOnly(false)}
                color="primary"
              />
            )}
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              sx={{ textTransform: 'none' }}
            >
              Xóa tất cả bộ lọc
            </Button>
          </Stack>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Desktop Sidebar Filters */}
        <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Bộ lọc
            </Typography>
            <Divider sx={{ my: 2 }} />

            {/* Categories */}
            <Accordion 
              expanded={expandedAccordion.category}
              onChange={handleAccordionChange('category')}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight="bold">Danh mục</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <RadioGroup
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <FormControlLabel
                    value=""
                    control={<Radio />}
                    label={
                      filterParam === 'promotion' 
                        ? '🔥 Flash Sale - Giờ Vàng Giá Sốc'
                        : filterParam === 'special'
                          ? '⚡ Khuyến Mãi Đặc Biệt'
                        : filterParam === 'featured'
                          ? '⭐ Sản Phẩm Nổi Bật'
                        : filterParam === 'bestseller'
                          ? '🔥 Bán Chạy Nhất'
                        : filterParam === 'new'
                          ? '🆕 Sản Phẩm Mới'
                          : 'Tất cả danh mục'
                    }
                  />
                  {!filterParam && categories.map((category) => (
                    <FormControlLabel
                      key={category.id}
                      value={category.id.toString()}
                      control={<Radio />}
                      label={category.name}
                    />
                  ))}
                </RadioGroup>
              </AccordionDetails>
            </Accordion>

            {/* Price Range */}
            <Accordion 
              expanded={expandedAccordion.priceRange}
              onChange={handleAccordionChange('priceRange')}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight="bold">Khoảng giá</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => setPriceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={50000000}
                  step={1000000}
                  valueLabelFormat={(value) => formatCurrency(value)}
                  sx={{ my: 3 }}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    size="small"
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    sx={{ width: '50%' }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    sx={{ width: '50%' }}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Quick Filters */}
            <Accordion 
              expanded={expandedAccordion.quickFilters}
              onChange={handleAccordionChange('quickFilters')}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight="bold">Lọc nhanh</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showPromotionsOnly}
                        onChange={(e) => setShowPromotionsOnly(e.target.checked)}
                      />
                    }
                    label="Chỉ sản phẩm khuyến mãi"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showInStockOnly}
                        onChange={(e) => setShowInStockOnly(e.target.checked)}
                      />
                    }
                    label="Còn hàng"
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Grid>

        {/* Products Grid/List */}
        <Grid item xs={12} md={9}>
          {isLoading || !isInitialized ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Không tìm thấy sản phẩm nào
              </Typography>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ mt: 2 }}
              >
                Xóa bộ lọc
              </Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {products.map((product) => (
                  <Grid 
                    item 
                    xs={viewMode === 'grid' ? 12 : 12} 
                    sm={viewMode === 'grid' ? 6 : 12}
                    md={viewMode === 'grid' ? 4 : 12}
                    key={product.id}
                  >
                    {viewMode === 'grid' ? (
                      <ProductCard product={product} />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          overflow: 'hidden',
                          '&:hover': {
                            borderColor: '#d32f2f',
                            boxShadow: '0 4px 12px rgba(211,47,47,0.15)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Box
                          component="img"
                          src={product.images?.[0]?.path || product.thumbnail || '/placeholder.jpg'}
                          alt={product.name}
                          sx={{
                            width: 200,
                            height: 200,
                            objectFit: 'contain',
                            bgcolor: '#f5f5f5',
                          }}
                        />
                        <Box sx={{ p: 3, flex: 1 }}>
                          <Typography variant="h6" gutterBottom fontWeight="bold">
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {product.category?.name} | SKU: {product.sku}
                          </Typography>
                          <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
                            Còn {product.quantity} sản phẩm
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 2 }}>
                            <Typography variant="h5" color="#d32f2f" fontWeight="bold">
                              {formatCurrency(product.price)}
                            </Typography>
                            {product.original_price && product.original_price > product.price && (
                              <Typography
                                variant="body1"
                                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                              >
                                {formatCurrency(product.original_price)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="right"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Bộ lọc
            </Typography>
            <IconButton onClick={() => setMobileFilterOpen(false)}>
              <Clear />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {/* Mobile Filters Content - Same as Desktop */}
          <Accordion 
            expanded={expandedAccordion.category}
            onChange={handleAccordionChange('category')}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight="bold">Danh mục</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <RadioGroup
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <FormControlLabel 
                  value="" 
                  control={<Radio />} 
                  label={
                    filterParam === 'promotion' 
                      ? '🔥 Flash Sale - Giờ Vàng Giá Sốc'
                      : filterParam === 'special'
                        ? '⚡ Khuyến Mãi Đặc Biệt'
                      : filterParam === 'featured'
                        ? '⭐ Sản Phẩm Nổi Bật'
                      : filterParam === 'bestseller'
                        ? '🔥 Bán Chạy Nhất'
                      : filterParam === 'new'
                        ? '🆕 Sản Phẩm Mới'
                        : 'Tất cả'
                  } 
                />
                {!filterParam && categories.map((category) => (
                  <FormControlLabel
                    key={category.id}
                    value={category.id.toString()}
                    control={<Radio />}
                    label={category.name}
                  />
                ))}
              </RadioGroup>
            </AccordionDetails>
          </Accordion>

          <Accordion 
            expanded={expandedAccordion.priceRange}
            onChange={handleAccordionChange('priceRange')}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight="bold">Khoảng giá</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Slider
                value={priceRange}
                onChange={(e, newValue) => setPriceRange(newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={50000000}
                step={1000000}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion 
            expanded={expandedAccordion.quickFilters}
            onChange={handleAccordionChange('quickFilters')}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight="bold">Lọc nhanh</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showPromotionsOnly}
                      onChange={(e) => setShowPromotionsOnly(e.target.checked)}
                    />
                  }
                  label="Chỉ khuyến mãi"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showInStockOnly}
                      onChange={(e) => setShowInStockOnly(e.target.checked)}
                    />
                  }
                  label="Còn hàng"
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Button
            variant="contained"
            fullWidth
            onClick={() => setMobileFilterOpen(false)}
            sx={{ mt: 3 }}
          >
            Áp dụng bộ lọc
          </Button>
        </Box>
      </Drawer>
    </Container>
  )
}

export default Products
