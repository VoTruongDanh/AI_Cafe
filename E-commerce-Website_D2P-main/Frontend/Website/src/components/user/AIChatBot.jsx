import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Box,
  Fab,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Card,
  CardMedia,
  CardContent,
  Button,
  Grid,
  Rating,
  Fade,
} from '@mui/material'
import {
  Chat,
  Close,
  Send,
  SmartToy,
  LocalOffer,
  TrendingUp,
  Lightbulb,
  Help,
  ArrowForward,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'

const AIChatBot = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  
  const { categories } = useSelector((state) => state.categories)
  const { products: recentlyViewedProducts } = useSelector((state) => state.recentlyViewed)
  const { items: cartItems } = useSelector((state) => state.cart)
  const { user } = useSelector((state) => state.auth)

  // Fetch sản phẩm từ API
  const fetchProducts = async (params) => {
    try {
      const response = await axios.get(`${API_URL}/products`, { params })
      return response.data.data || response.data
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'bot',
        text: user 
          ? `Xin chào ${user.name}! 👋\n\nTôi là trợ lý AI của ElectroShop. Tôi có thể giúp bạn tìm sản phẩm phù hợp!\n\nBạn cần hỗ trợ gì hôm nay? 😊`
          : `Xin chào! 👋\n\nTôi là trợ lý AI của ElectroShop. Tôi sẵn sàng hỗ trợ bạn tìm kiếm và tư vấn sản phẩm!`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
      setTimeout(() => addQuickActions(), 1000)
    }
  }, [isOpen])

  const addQuickActions = () => {
    const quickActionsMessage = {
      id: Date.now(),
      type: 'quickActions',
      actions: [
        { label: 'Gợi ý sản phẩm cho tôi', icon: <Lightbulb />, action: 'suggest' },
        { label: 'Sản phẩm đang khuyến mãi', icon: <LocalOffer />, action: 'promotion' },
        { label: 'Sản phẩm bán chạy', icon: <TrendingUp />, action: 'bestseller' },
        { label: 'Tôi cần tư vấn', icon: <Help />, action: 'consult' },
      ],
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, quickActionsMessage])
  }

  const getAIResponse = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase()

    // Gợi ý sản phẩm
    if (lowerMessage === 'suggest' || lowerMessage.includes('gợi ý')) {
      const products = await fetchProducts({ is_featured: 1, per_page: 4 })
      return {
        text: '✨ **Gợi ý sản phẩm dành cho bạn**\n\nDưới đây là những sản phẩm nổi bật:',
        products: products.slice(0, 4),
        action: { type: 'link', url: '/products?filter=featured', label: 'Xem thêm gợi ý' }
      }
    }

    // Sản phẩm khuyến mãi
    if (lowerMessage === 'promotion' || lowerMessage.includes('khuyến mãi') || lowerMessage.includes('sale')) {
      const products = await fetchProducts({ is_featured: 1, per_page: 4 })
      return {
        text: '🔥 **Sản phẩm khuyến mãi HOT**\n\nĐang có ưu đãi đặc biệt:',
        products: products.slice(0, 4),
        action: { type: 'link', url: '/products?filter=promotion', label: 'Xem tất cả khuyến mãi' }
      }
    }

    // Sản phẩm bán chạy
    if (lowerMessage === 'bestseller' || lowerMessage.includes('bán chạy')) {
      const products = await fetchProducts({ sort: 'sold', order: 'desc', per_page: 4 })
      return {
        text: '⭐ **Top sản phẩm bán chạy**\n\nSản phẩm được nhiều người mua:',
        products: products.slice(0, 4),
        action: { type: 'link', url: '/products?filter=bestseller', label: 'Xem thêm sản phẩm hot' }
      }
    }

    // Tìm kiếm theo danh mục
    const category = categories.find(cat => lowerMessage.includes(cat.name.toLowerCase()))
    if (category) {
      const products = await fetchProducts({ category_id: category.id, per_page: 4 })
      return {
        text: `📦 **${category.name}**\n\nCó ${category.total_products_count || 0} sản phẩm:`,
        products: products.slice(0, 4),
        action: { type: 'link', url: `/products?category=${category.id}`, label: `Xem tất cả` }
      }
    }

    // Tìm kiếm sản phẩm
    if (lowerMessage.includes('tivi') || lowerMessage.includes('tv')) {
      const products = await fetchProducts({ search: 'tivi', per_page: 4 })
      return {
        text: '📺 **Smart TV**\n\nSản phẩm TV phù hợp:',
        products: products.slice(0, 4),
        action: { type: 'search', keyword: 'tivi', label: 'Xem tất cả TV' }
      }
    }

    if (lowerMessage.includes('laptop')) {
      const products = await fetchProducts({ search: 'laptop', per_page: 4 })
      return {
        text: '💻 **Laptop**\n\nSản phẩm laptop phù hợp:',
        products: products.slice(0, 4),
        action: { type: 'search', keyword: 'laptop', label: 'Xem tất cả laptop' }
      }
    }

    if (lowerMessage.includes('điện thoại') || lowerMessage.includes('phone')) {
      const products = await fetchProducts({ search: 'điện thoại', per_page: 4 })
      return {
        text: '📱 **Điện thoại**\n\nSản phẩm điện thoại phù hợp:',
        products: products.slice(0, 4),
        action: { type: 'search', keyword: 'điện thoại', label: 'Xem tất cả điện thoại' }
      }
    }

    // Tư vấn
    if (lowerMessage === 'consult' || lowerMessage.includes('tư vấn')) {
      return {
        text: '💡 Tôi sẵn sàng tư vấn!\n\nBạn có thể:\n• Cho tôi biết loại sản phẩm cần tìm\n• Ngân sách của bạn\n• Mục đích sử dụng'
      }
    }

    // Default
    return {
      text: `Tôi hiểu bạn đang tìm "${userMessage}".\n\nHãy thử hỏi tôi về:\n• Sản phẩm cụ thể\n• Giá cả, khuyến mãi\n• Tư vấn mua hàng`,
      action: { type: 'search', keyword: userMessage, label: `Tìm "${userMessage}"` }
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInputMessage('')
    setIsTyping(true)

    setTimeout(async () => {
      const response = await getAIResponse(inputMessage)
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        ...response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
      setTimeout(() => addQuickActions(), 500)
    }, 800)
  }

  const handleQuickAction = (action) => {
    setInputMessage(action)
    setTimeout(() => handleSendMessage(), 100)
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Fab
              color="primary"
              onClick={() => setIsOpen(true)}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                bgcolor: '#e63946',
                '&:hover': { bgcolor: '#d62839' },
                width: 64,
                height: 64,
                boxShadow: '0 8px 24px rgba(230, 57, 70, 0.4)',
                zIndex: 1000,
              }}
            >
              <Chat sx={{ fontSize: 32 }} />
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: { xs: 'calc(100vw - 32px)', sm: 400 },
                height: { xs: 'calc(100vh - 100px)', sm: 600 },
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #e63946 0%, #ff6b6b 100%)',
                  color: 'white',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'white', color: '#e63946' }}>
                    <SmartToy />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      AI ElectroShop
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Online • Sẵn sàng hỗ trợ 24/7
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                  <Close />
                </IconButton>
              </Box>

              {/* Messages Area */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  bgcolor: '#f5f5f5',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                {messages.map((message) => (
                  <Box key={message.id}>
                    {message.type === 'bot' && (
                      <Fade in timeout={300}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          <Avatar sx={{ bgcolor: '#e63946', width: 32, height: 32 }}>
                            <SmartToy sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Box sx={{ flex: 1, maxWidth: '100%' }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                bgcolor: 'white',
                                borderRadius: 2,
                              }}
                            >
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                                {message.text}
                              </Typography>

                              {/* Hiển thị sản phẩm */}
                              {message.products && message.products.length > 0 && (
                                <Grid container spacing={1} sx={{ mt: 1.5 }}>
                                  {message.products.map((product) => (
                                    <Grid item xs={6} key={product.id}>
                                      <Card
                                        elevation={0}
                                        onClick={() => {
                                          navigate(`/products/${product.id}`)
                                          setIsOpen(false)
                                        }}
                                        sx={{
                                          cursor: 'pointer',
                                          border: '1px solid #e0e0e0',
                                          transition: 'all 0.2s',
                                          '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(230,57,70,0.15)',
                                            borderColor: '#e63946',
                                          }
                                        }}
                                      >
                                        <CardMedia
                                          component="img"
                                          height="100"
                                          image={
                                            product.thumbnail?.startsWith('http') 
                                              ? product.thumbnail 
                                              : `${BASE_URL}${product.thumbnail || '/placeholder.png'}`
                                          }
                                          alt={product.name}
                                          sx={{ objectFit: 'contain', p: 1, bgcolor: '#fafafa' }}
                                        />
                                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                              overflow: 'hidden',
                                              fontSize: '11px',
                                              lineHeight: 1.3,
                                              minHeight: '28px',
                                              mb: 0.5,
                                            }}
                                          >
                                            {product.name}
                                          </Typography>
                                          {product.rating > 0 && (
                                            <Rating value={product.rating} size="small" readOnly sx={{ fontSize: '12px', mb: 0.5 }} />
                                          )}
                                          <Typography variant="body2" fontWeight="bold" color="#e63946" sx={{ fontSize: '13px' }}>
                                            {product.price?.toLocaleString('vi-VN')}đ
                                          </Typography>
                                          {product.original_price && product.original_price > product.price && (
                                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  textDecoration: 'line-through',
                                                  color: 'text.secondary',
                                                  fontSize: '10px',
                                                }}
                                              >
                                                {product.original_price.toLocaleString('vi-VN')}đ
                                              </Typography>
                                              <Chip
                                                label={`-${Math.round((1 - product.price / product.original_price) * 100)}%`}
                                                size="small"
                                                sx={{
                                                  height: 16,
                                                  fontSize: '9px',
                                                  bgcolor: '#ff4444',
                                                  color: 'white',
                                                  fontWeight: 600,
                                                }}
                                              />
                                            </Box>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              )}

                              {message.action && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  endIcon={<ArrowForward />}
                                  fullWidth
                                  onClick={() => {
                                    if (message.action.type === 'link') {
                                      navigate(message.action.url)
                                      setIsOpen(false)
                                    } else if (message.action.type === 'search') {
                                      navigate(`/products?search=${message.action.keyword}`)
                                      setIsOpen(false)
                                    }
                                  }}
                                  sx={{
                                    mt: 1.5,
                                    bgcolor: '#e63946',
                                    '&:hover': { bgcolor: '#d62839' },
                                    textTransform: 'none',
                                    fontWeight: 600,
                                  }}
                                >
                                  {message.action.label}
                                </Button>
                              )}
                            </Paper>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mt: 0.5, display: 'block' }}>
                              {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        </Box>
                      </Fade>
                    )}

                    {message.type === 'user' && (
                      <Fade in timeout={300}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Box sx={{ maxWidth: '85%' }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                bgcolor: '#e63946',
                                color: 'white',
                                borderRadius: 2,
                              }}
                            >
                              <Typography variant="body2">{message.text}</Typography>
                            </Paper>
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1, mt: 0.5, display: 'block', textAlign: 'right' }}>
                              {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        </Box>
                      </Fade>
                    )}

                    {message.type === 'quickActions' && (
                      <Fade in timeout={300}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', my: 1 }}>
                          {message.actions.map((action, idx) => (
                            <Chip
                              key={idx}
                              icon={action.icon}
                              label={action.label}
                              onClick={() => handleQuickAction(action.action)}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: '#e639461a',
                                  transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.2s',
                              }}
                            />
                          ))}
                        </Box>
                      </Fade>
                    )}
                  </Box>
                ))}

                {isTyping && (
                  <Fade in>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#e63946', width: 32, height: 32 }}>
                        <SmartToy sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {[0, 0.2, 0.4].map((delay, i) => (
                            <Box
                              key={i}
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#e63946',
                                animation: 'bounce 1.4s infinite',
                                animationDelay: `${delay}s`,
                                '@keyframes bounce': {
                                  '0%, 60%, 100%': { transform: 'translateY(0)' },
                                  '30%': { transform: 'translateY(-8px)' },
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    </Box>
                  </Fade>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Input Area */}
              <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nhập câu hỏi hoặc sản phẩm cần tìm..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    sx={{
                      bgcolor: '#e63946',
                      color: 'white',
                      '&:hover': { bgcolor: '#d62839' },
                      '&:disabled': { bgcolor: '#e0e0e0' },
                    }}
                  >
                    <Send />
                  </IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  Powered by AI • ElectroShop 2025
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIChatBot
