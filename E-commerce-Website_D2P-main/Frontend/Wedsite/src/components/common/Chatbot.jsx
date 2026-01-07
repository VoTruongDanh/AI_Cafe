import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Fade,
  Slide,
} from '@mui/material'
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy,
  Person,
} from '@mui/icons-material'

const Chatbot = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Tôi là trợ lý ảo của ElectroShop. Tôi có thể giúp gì cho bạn?',
      sender: 'bot',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const quickReplies = [
    'Tìm sản phẩm',
    'Chính sách bảo hành',
    'Phương thức thanh toán',
    'Liên hệ hỗ trợ',
  ]

  const botResponses = {
    'tìm sản phẩm': {
      text: 'Bạn đang tìm sản phẩm gì? Chúng tôi có: TV, Laptop, Điện thoại, Tủ lạnh, Máy giặt, Điều hòa...',
      suggestions: ['TV', 'Laptop', 'Điện thoại', 'Tủ lạnh'],
    },
    'tv': {
      text: 'Chúng tôi có nhiều dòng TV: Samsung, LG, Sony... Giá từ 5 triệu đến 100 triệu. Bạn muốn xem TV nào?',
      link: '/products?category=tv',
    },
    'laptop': {
      text: 'Laptop gaming, văn phòng hay đồ họa? Chúng tôi có đầy đủ từ Dell, HP, Asus, Apple...',
      link: '/products?category=laptop',
    },
    'điện thoại': {
      text: 'iPhone, Samsung Galaxy, Xiaomi... giá từ 3 triệu. Xem ngay!',
      link: '/products?category=dien-thoai',
    },
    'bảo hành': {
      text: 'Chính sách bảo hành:\n• Điện thoại, laptop: 12 tháng\n• TV, tủ lạnh: 24 tháng\n• Máy lạnh: 36 tháng\n• Đổi mới nếu lỗi NSX trong 7 ngày',
      link: '/warranty',
    },
    'thanh toán': {
      text: 'Chúng tôi hỗ trợ:\n• COD (miễn phí)\n• Chuyển khoản\n• MoMo, ZaloPay\n• Visa/Mastercard\n• Trả góp 0%',
      link: '/payment',
    },
    'liên hệ': {
      text: 'Liên hệ với chúng tôi:\n📞 Hotline: 1900 1599\n📧 Email: support@electroshop.com\n⏰ 8:00 - 22:00 hàng ngày',
      link: '/contact',
    },
    'giá': {
      text: 'Chúng tôi cam kết giá tốt nhất! Nếu phát hiện giá rẻ hơn, chúng tôi sẽ giảm thêm 5%. Bạn muốn tìm sản phẩm nào?',
    },
    'giao hàng': {
      text: 'Giao hàng:\n• Nội thành: 12-24h\n• Ngoại thành: 1-2 ngày\n• Miễn phí từ 500k\n• Kiểm tra hàng trước khi thanh toán',
      link: '/shipping',
    },
    'khuyến mãi': {
      text: 'Đang có nhiều chương trình khuyến mãi hấp dẫn! Giảm đến 50%, tặng phiếu mua hàng, trả góp 0%. Xem ngay!',
      link: '/products',
    },
    'default': {
      text: 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Vui lòng liên hệ hotline 1900 1599 để được hỗ trợ tốt nhất!',
    },
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findBestMatch = (input) => {
    const normalized = input.toLowerCase().trim()
    
    const keywords = Object.keys(botResponses).filter(key => key !== 'default')
    
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return keyword
      }
    }
    
    return 'default'
  }

  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages([...messages, userMessage])
    setInputValue('')
    setIsTyping(true)

    setTimeout(() => {
      const matchedKey = findBestMatch(inputValue)
      const response = botResponses[matchedKey] || botResponses.default

      const botMessage = {
        id: messages.length + 2,
        text: response.text,
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        link: response.link,
        suggestions: response.suggestions,
      }

      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleQuickReply = (reply) => {
    setInputValue(reply)
    setTimeout(() => handleSend(), 100)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat Window */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            width: { xs: 'calc(100% - 40px)', sm: 380 },
            height: { xs: 'calc(100vh - 140px)', sm: 550 },
            borderRadius: 3,
            overflow: 'hidden',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: '#e63946',
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
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                  ElectroShop Bot
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Trợ lý ảo • Online
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages */}
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
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1,
                }}
              >
                {message.sender === 'bot' && (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#e63946' }}>
                    <SmartToy sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
                
                <Box sx={{ maxWidth: '75%' }}>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: message.sender === 'user' ? '#e63946' : 'white',
                      color: message.sender === 'user' ? 'white' : '#2d3436',
                      borderRadius: 2,
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    <Typography variant="body2">{message.text}</Typography>
                    {message.link && (
                      <Typography
                        component="a"
                        href={message.link}
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          color: message.sender === 'user' ? 'white' : '#e63946',
                          textDecoration: 'underline',
                          fontWeight: 'bold',
                        }}
                      >
                        👉 Xem chi tiết
                      </Typography>
                    )}
                  </Paper>
                  
                  {message.suggestions && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {message.suggestions.map((suggestion, idx) => (
                        <Chip
                          key={idx}
                          label={suggestion}
                          size="small"
                          onClick={() => handleQuickReply(suggestion)}
                          sx={{
                            bgcolor: 'white',
                            '&:hover': { bgcolor: '#f0f0f0' },
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  <Typography variant="caption" sx={{ color: '#636e72', mt: 0.5, display: 'block' }}>
                    {message.time}
                  </Typography>
                </Box>

                {message.sender === 'user' && (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#636e72' }}>
                    <Person sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
              </Box>
            ))}

            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#e63946' }}>
                  <SmartToy sx={{ fontSize: 18 }} />
                </Avatar>
                <Paper sx={{ p: 1.5, bgcolor: 'white' }}>
                  <Typography variant="body2" sx={{ color: '#636e72' }}>
                    Đang trả lời...
                  </Typography>
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="caption" sx={{ color: '#636e72', mb: 1, display: 'block' }}>
                Câu hỏi gợi ý:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {quickReplies.map((reply, idx) => (
                  <Chip
                    key={idx}
                    label={reply}
                    size="small"
                    onClick={() => handleQuickReply(reply)}
                    sx={{
                      bgcolor: 'white',
                      '&:hover': { bgcolor: '#e63946', color: 'white' },
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Input */}
          <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập câu hỏi..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  },
                }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!inputValue.trim()}
                sx={{
                  bgcolor: '#e63946',
                  color: 'white',
                  '&:hover': { bgcolor: '#d62839' },
                  '&:disabled': { bgcolor: '#ddd' },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Slide>

      {/* Chat Button */}
      <Fade in={!open}>
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            bgcolor: '#e63946',
            '&:hover': { bgcolor: '#d62839' },
            zIndex: 1300,
          }}
        >
          <ChatIcon />
        </Fab>
      </Fade>
    </>
  )
}

export default Chatbot
