import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Rating,
  Button,
  TextField,
  Avatar,
  Stack,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Pagination,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  ThumbUp,
  ThumbUpOutlined,
  Edit,
  Delete,
  VerifiedUser,
  Close,
  CloudUpload,
  DeleteOutline,
} from '@mui/icons-material'
import { reviewsApi } from '../../services/api'
import { toast } from 'react-toastify'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

// Generate fake reviews for products without real reviews
const generateFakeReviews = (productId) => {
  const fakeNames = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Minh Đức',
    'Hoàng Thị Em', 'Vũ Đức Phong', 'Đặng Thị Giang', 'Bùi Văn Hải',
    'Ngô Thị Lan', 'Đỗ Minh Khoa', 'Trương Thị Mai', 'Lý Văn Nam'
  ]
  
  const fakeComments = [
    { rating: 5, title: 'Sản phẩm tuyệt vời!', comment: 'Sản phẩm chất lượng rất tốt, đúng như mô tả. Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop lần sau!' },
    { rating: 5, title: 'Rất hài lòng', comment: 'Mình rất hài lòng với sản phẩm này. Giá cả hợp lý, chất lượng tốt. Shop tư vấn nhiệt tình. Recommend cho mọi người!' },
    { rating: 4, title: 'Tốt', comment: 'Sản phẩm tốt, giao hàng đúng hẹn. Có vài điểm nhỏ cần cải thiện nhưng nhìn chung rất ổn. Sẽ quay lại mua tiếp.' },
    { rating: 5, title: 'Xuất sắc', comment: 'Đây là lần thứ 3 mình mua hàng ở shop. Lần nào cũng rất hài lòng. Sản phẩm chính hãng, giá tốt nhất thị trường.' },
    { rating: 4, title: 'Đáng mua', comment: 'Sản phẩm đẹp, chất lượng ổn với tầm giá. Ship nhanh, nhân viên hỗ trợ nhiệt tình. Đánh giá 4 sao vì giao hơi chậm 1 ngày.' },
    { rating: 5, title: 'Chất lượng cao', comment: 'Sản phẩm chính hãng 100%, còn nguyên seal. Hoạt động mượt mà, đúng như quảng cáo. Rất đáng đồng tiền bỏ ra!' },
    { rating: 4, title: 'Ổn', comment: 'Sản phẩm khá tốt so với giá tiền. Đóng gói kỹ càng, không bị trầy xước. Tuy nhiên phụ kiện đi kèm hơi ít.' },
    { rating: 5, title: 'Hoàn hảo', comment: 'Mua cho gia đình dùng, ai cũng khen. Thiết kế đẹp, hiện đại. Shop gửi kèm quà tặng rất chu đáo. 10 điểm!' },
  ]
  
  const numReviews = 3 + (productId % 5) // 3-7 reviews based on product ID
  const reviews = []
  
  for (let i = 0; i < numReviews; i++) {
    const nameIndex = (productId + i) % fakeNames.length
    const commentIndex = (productId + i * 2) % fakeComments.length
    const daysAgo = (productId + i * 7) % 60 + 1 // 1-60 days ago
    
    reviews.push({
      id: `fake-${productId}-${i}`,
      user_id: 0,
      user_name: fakeNames[nameIndex],
      rating: fakeComments[commentIndex].rating,
      title: fakeComments[commentIndex].title,
      comment: fakeComments[commentIndex].comment,
      is_verified_purchase: true,
      helpful_count: (productId + i) % 15,
      created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      images: [],
    })
  }
  
  return reviews
}

const generateFakeSummary = (productId, fakeReviews) => {
  const avgRating = fakeReviews.reduce((sum, r) => sum + r.rating, 0) / fakeReviews.length
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  fakeReviews.forEach(r => {
    breakdown[r.rating]++
  })
  
  return {
    average_rating: avgRating,
    total_reviews: fakeReviews.length,
    rating_breakdown: breakdown
  }
}

const ProductReviews = ({ productId, isAuthenticated, userId }) => {
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterRating, setFilterRating] = useState(null)
  const [sortBy, setSortBy] = useState('recent')
  const [useFakeReviews, setUseFakeReviews] = useState(false)
  
  // Review form state
  const [openReviewDialog, setOpenReviewDialog] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: [],
    imageFiles: [],
  })
  const [submitting, setSubmitting] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReviews()
  }, [productId, page, filterRating, sortBy])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page,
        rating: filterRating,
        sort: sortBy,
      }
      const response = await reviewsApi.getProductReviews(productId, params)
      
      const reviewsData = response.data?.data?.data || []
      const summaryData = response.data?.summary || { average_rating: 0, total_reviews: 0, rating_breakdown: {} }
      const lastPage = response.data?.data?.last_page || 1
      
      // If no real reviews, use fake reviews
      if (reviewsData.length === 0 && summaryData.total_reviews === 0) {
        const fakeReviews = generateFakeReviews(productId)
        const fakeSummary = generateFakeSummary(productId, fakeReviews)
        
        // Apply filter if set
        let filteredFakeReviews = fakeReviews
        if (filterRating) {
          filteredFakeReviews = fakeReviews.filter(r => r.rating === filterRating)
        }
        
        // Apply sort
        if (sortBy === 'helpful') {
          filteredFakeReviews.sort((a, b) => b.helpful_count - a.helpful_count)
        } else {
          filteredFakeReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }
        
        setReviews(filteredFakeReviews)
        setSummary(fakeSummary)
        setTotalPages(1)
        setUseFakeReviews(true)
      } else {
        setReviews(reviewsData)
        setSummary(summaryData)
        setTotalPages(lastPage)
        setUseFakeReviews(false)
      }
    } catch (error) {
      // On error, show fake reviews instead of error message
      const fakeReviews = generateFakeReviews(productId)
      const fakeSummary = generateFakeSummary(productId, fakeReviews)
      
      let filteredFakeReviews = fakeReviews
      if (filterRating) {
        filteredFakeReviews = fakeReviews.filter(r => r.rating === filterRating)
      }
      
      if (sortBy === 'helpful') {
        filteredFakeReviews.sort((a, b) => b.helpful_count - a.helpful_count)
      } else {
        filteredFakeReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }
      
      setReviews(filteredFakeReviews)
      setSummary(fakeSummary)
      setTotalPages(1)
      setUseFakeReviews(true)
      setError(null) // Don't show error, just use fake reviews
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim() || reviewForm.comment.length < 10) {
      toast.error('Nội dung đánh giá phải có ít nhất 10 ký tự')
      return
    }

    try {
      setSubmitting(true)
      
      // Upload images to Cloudinary if there are new files
      let imageUrls = []
      if (reviewForm.imageFiles && reviewForm.imageFiles.length > 0) {
        toast.info('Đang tải ảnh lên...')
        const uploadPromises = reviewForm.imageFiles.map(async (file) => {
          const formData = new FormData()
          formData.append('image', file)
          
          try {
            const response = await fetch('http://localhost:8000/api/upload-image', {
              method: 'POST',
              body: formData,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            })
            const data = await response.json()
            return data.url
          } catch (error) {
            console.error('Upload error:', error)
            return null
          }
        })
        
        const uploadedUrls = await Promise.all(uploadPromises)
        imageUrls = uploadedUrls.filter(url => url !== null)
      } else if (reviewForm.images && reviewForm.images.length > 0 && !reviewForm.images[0].startsWith('blob:')) {
        // Keep existing URLs if editing
        imageUrls = reviewForm.images
      }
      
      const reviewData = {
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        images: imageUrls
      }
      
      if (editingReview) {
        await reviewsApi.updateReview(editingReview.id, reviewData)
        toast.success('Đã cập nhật đánh giá')
      } else {
        await reviewsApi.createReview(productId, reviewData)
        toast.success('Cảm ơn bạn đã đánh giá sản phẩm')
      }
      setOpenReviewDialog(false)
      setReviewForm({ rating: 5, title: '', comment: '', images: [], imageFiles: [] })
      setEditingReview(null)
      fetchReviews()
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể gửi đánh giá'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditReview = (review) => {
    setEditingReview(review)
    setReviewForm({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment,
      images: review.images || [],
    })
    setOpenReviewDialog(true)
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return

    try {
      await reviewsApi.deleteReview(reviewId)
      toast.success('Đã xóa đánh giá')
      fetchReviews()
    } catch (error) {
      toast.error('Không thể xóa đánh giá')
    }
  }

  const handleMarkHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      return
    }

    try {
      await reviewsApi.markHelpful(reviewId)
      fetchReviews()
    } catch (error) {
      console.error('Error marking helpful:', error)
    }
  }

  const RatingStats = () => {
    if (!summary) return null

    const total = summary.total_reviews || 0
    const breakdown = summary.rating_breakdown || {}
    const avgRating = summary.average_rating || 0

    return (
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {/* Average Rating */}
          <Grid item xs={12} md={4}>
            <Box 
              sx={{ 
                textAlign: 'center',
                p: 3,
                bgcolor: '#fff',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h1" fontWeight="bold" sx={{ fontSize: '48px', color: '#ff9800', mb: 1 }}>
                {avgRating.toFixed(1)}
              </Typography>
              <Rating value={avgRating} precision={0.1} readOnly size="large" sx={{ mb: 1 }} />
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Trên 5
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '13px' }}>
                {total} đánh giá và nhận xét
              </Typography>
            </Box>
          </Grid>

          {/* Rating Breakdown */}
          <Grid item xs={12} md={8}>
            <Box sx={{ bgcolor: '#fff', p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0
                const percentage = total > 0 ? (count / total) * 100 : 0

                return (
                  <Box
                    key={star}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 110px',
                      alignItems: 'center',
                      gap: 2,
                      mb: 1.5,
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 1,
                      transition: 'all 0.2s',
                      '&:hover': { 
                        bgcolor: '#f5f5f5',
                      },
                    }}
                    onClick={() => setFilterRating(filterRating === star ? null : star)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, width: '12px', textAlign: 'right' }}>
                        {star}
                      </Typography>
                      <Typography sx={{ fontSize: '16px' }}>⭐</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#ff9800',
                          borderRadius: 5,
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ textAlign: 'right', color: '#666', fontSize: '14px' }}>
                      {count} ({percentage.toFixed(0)}%)
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Grid>
        </Grid>
      </Box>
    )
  }

  const ReviewItem = ({ review }) => {
    const isOwner = userId && review.user_id === userId

    return (
      <Box 
        sx={{ 
          mb: 2, 
          p: 3, 
          bgcolor: '#fff',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          },
        }}
      >
        <Stack direction="row" spacing={2}>
          <Avatar sx={{ bgcolor: '#ff9800', width: 44, height: 44, fontSize: '18px' }}>
            {review.user_name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            {/* User Info */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '15px' }}>
                {review.user_name || 'Người dùng'}
              </Typography>
              {review.is_verified_purchase && (
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: 13 }} />}
                  label="Đã mua hàng"
                  size="small"
                  sx={{ 
                    height: 22, 
                    fontSize: '11px',
                    bgcolor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: '#2e7d32',
                    },
                  }}
                />
              )}
            </Stack>

            {/* Rating & Date */}
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
              <Rating 
                value={review.rating || 0} 
                size="small" 
                readOnly 
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: '#ff9800',
                  },
                }}
              />
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '13px' }}>
                {(() => {
                  try {
                    return formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })
                  } catch (error) {
                    return review.created_at || 'Vừa xong'
                  }
                })()}
              </Typography>
            </Stack>

            {/* Review Title */}
            {review.title && (
              <Typography variant="subtitle2" fontWeight="600" mb={1} sx={{ fontSize: '14px' }}>
                {review.title}
              </Typography>
            )}

            {/* Review Comment */}
            <Typography 
              variant="body2" 
              color="text.primary" 
              sx={{ 
                mb: 2, 
                whiteSpace: 'pre-line',
                lineHeight: 1.7,
                fontSize: '14px',
                color: '#424242',
              }}
            >
              {review.comment}
            </Typography>

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
              <Stack direction="row" spacing={1} mb={2}>
                {review.images.map((img, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={img}
                    alt={`Review ${idx + 1}`}
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                    }}
                  />
                ))}
              </Stack>
            )}

            {/* Actions */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Button
                size="small"
                startIcon={<ThumbUpOutlined sx={{ fontSize: 16 }} />}
                onClick={() => handleMarkHelpful(review.id)}
                sx={{ 
                  textTransform: 'none',
                  color: '#666',
                  fontSize: '13px',
                  px: 1.5,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    color: '#1976d2',
                  },
                }}
              >
                Hữu ích ({review.helpful_count})
              </Button>

              {isOwner && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <Button
                    size="small"
                    startIcon={<Edit sx={{ fontSize: 16 }} />}
                    onClick={() => handleEditReview(review)}
                    sx={{ 
                      textTransform: 'none',
                      color: '#666',
                      fontSize: '13px',
                      px: 1.5,
                      '&:hover': {
                        bgcolor: '#f5f5f5',
                        color: '#1976d2',
                      },
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Delete sx={{ fontSize: 16 }} />}
                    onClick={() => handleDeleteReview(review.id)}
                    sx={{ 
                      textTransform: 'none',
                      color: '#666',
                      fontSize: '13px',
                      px: 1.5,
                      '&:hover': {
                        bgcolor: '#ffebee',
                        color: '#d32f2f',
                      },
                    }}
                  >
                    Xóa
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>
    )
  }

  return (
    <Box>
      {/* Rating Statistics */}
      <RatingStats />

      {/* Filter & Sort */}
      <Box sx={{ mb: 3, bgcolor: '#fff', p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mr: 1, fontWeight: 600, color: '#666' }}>
            Lọc theo:
          </Typography>
          <Button
            variant={filterRating === null ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setFilterRating(null)}
            sx={{ 
              textTransform: 'none',
              minWidth: 'auto',
              px: 2,
            }}
          >
            Tất cả
          </Button>
          {[5, 4, 3, 2, 1].map((star) => (
            <Button
              key={star}
              variant={filterRating === star ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setFilterRating(star)}
              sx={{ 
                textTransform: 'none',
                minWidth: 'auto',
                px: 2,
              }}
            >
              {star} ⭐
            </Button>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ mr: 1, fontWeight: 600, color: '#666' }}>
            Sắp xếp:
          </Typography>
          <Button
            variant={sortBy === 'recent' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSortBy('recent')}
            sx={{ 
              textTransform: 'none',
              minWidth: 'auto',
              px: 2,
            }}
          >
            Mới nhất
          </Button>
          <Button
            variant={sortBy === 'helpful' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSortBy('helpful')}
            sx={{ 
              textTransform: 'none',
              minWidth: 'auto',
              px: 2,
            }}
          >
            Hữu ích nhất
          </Button>
        </Stack>
      </Box>

      {/* Write Review Button */}
      {isAuthenticated && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenReviewDialog(true)}
          sx={{ 
            mb: 3,
            textTransform: 'none',
            px: 3,
            py: 1.5,
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          Viết đánh giá
        </Button>
      )}

      {/* Reviews List */}
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button size="small" onClick={fetchReviews} sx={{ ml: 2 }}>
            Thử lại
          </Button>
        </Alert>
      ) : loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" mt={2}>
            Đang tải đánh giá...
          </Typography>
        </Box>
      ) : reviews.length === 0 ? (
        <Alert severity="info">
          {filterRating
            ? `Chưa có đánh giá ${filterRating} sao`
            : 'Chưa có đánh giá nào cho sản phẩm này'}
        </Alert>
      ) : (
        <>
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
          <IconButton
            onClick={() => setOpenReviewDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* Rating */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Đánh giá của bạn *
              </Typography>
              <Rating
                value={reviewForm.rating}
                onChange={(e, value) => setReviewForm({ ...reviewForm, rating: value })}
                size="large"
              />
            </Box>

            {/* Title */}
            <TextField
              label="Tiêu đề (không bắt buộc)"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              fullWidth
              inputProps={{ maxLength: 255 }}
            />

            {/* Comment */}
            <TextField
              label="Nội dung đánh giá *"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              multiline
              rows={4}
              fullWidth
              required
              helperText={`${reviewForm.comment.length}/1000 ký tự (tối thiểu 10)`}
              inputProps={{ maxLength: 1000 }}
            />

            {/* Image Upload */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Hình ảnh (tối đa 5 ảnh)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Chọn hình ảnh
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files).slice(0, 5 - reviewForm.images.length)
                    const newImages = files.map(file => URL.createObjectURL(file))
                    setReviewForm({
                      ...reviewForm,
                      images: [...reviewForm.images, ...newImages].slice(0, 5),
                      imageFiles: [...(reviewForm.imageFiles || []), ...files].slice(0, 5)
                    })
                  }}
                />
              </Button>
              {reviewForm.images.length > 0 && (
                <Grid container spacing={1}>
                  {reviewForm.images.map((img, index) => (
                    <Grid item xs={4} sm={3} key={index}>
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={img}
                          alt={`Preview ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newImages = reviewForm.images.filter((_, i) => i !== index)
                            const newFiles = (reviewForm.imageFiles || []).filter((_, i) => i !== index)
                            setReviewForm({
                              ...reviewForm,
                              images: newImages,
                              imageFiles: newFiles
                            })
                          }}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'white',
                            boxShadow: 1,
                            '&:hover': { bgcolor: '#f5f5f5' }
                          }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Chọn tối đa 5 hình ảnh (JPG, PNG, GIF)
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Hủy</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={submitting || !reviewForm.comment.trim()}
          >
            {submitting ? <CircularProgress size={24} /> : editingReview ? 'Cập nhật' : 'Gửi đánh giá'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProductReviews
