import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material'
import {
  ExpandMore,
  Help,
  ShoppingCart,
  Payment,
  LocalShipping,
  AssignmentReturn,
} from '@mui/icons-material'
import { pageVariants } from '../../utils/animations'

const FAQ = () => {
  const [expanded, setExpanded] = useState(false)

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false)
  }

  const faqs = [
    {
      category: 'Đặt hàng',
      icon: <ShoppingCart />,
      questions: [
        {
          question: 'Làm thế nào để đặt hàng?',
          answer: 'Bạn có thể đặt hàng bằng cách: 1) Chọn sản phẩm và thêm vào giỏ hàng, 2) Điền thông tin giao hàng, 3) Chọn phương thức thanh toán, 4) Xác nhận đơn hàng.',
        },
        {
          question: 'Tôi có thể đặt hàng mà không cần tài khoản không?',
          answer: 'Không, bạn cần đăng ký tài khoản để đặt hàng. Điều này giúp chúng tôi quản lý đơn hàng và giao hàng tốt hơn.',
        },
        {
          question: 'Làm thế nào để theo dõi đơn hàng?',
          answer: 'Sau khi đặt hàng, bạn có thể theo dõi đơn hàng trong phần "Đơn hàng" của tài khoản. Chúng tôi cũng sẽ gửi email cập nhật trạng thái đơn hàng.',
        },
      ],
    },
    {
      category: 'Thanh toán',
      icon: <Payment />,
      questions: [
        {
          question: 'Các phương thức thanh toán nào được chấp nhận?',
          answer: 'Chúng tôi chấp nhận: Thanh toán khi nhận hàng (COD), Chuyển khoản ngân hàng, và Ví điện tử MoMo.',
        },
        {
          question: 'Tôi có thể thanh toán bằng thẻ tín dụng không?',
          answer: 'Hiện tại chúng tôi chưa hỗ trợ thanh toán bằng thẻ tín dụng. Chúng tôi đang làm việc để thêm tính năng này trong tương lai.',
        },
        {
          question: 'Khi nào tôi phải thanh toán?',
          answer: 'Với phương thức COD, bạn thanh toán khi nhận hàng. Với chuyển khoản/MoMo, bạn cần thanh toán trước khi đơn hàng được xử lý.',
        },
      ],
    },
    {
      category: 'Giao hàng',
      icon: <LocalShipping />,
      questions: [
        {
          question: 'Phí giao hàng là bao nhiêu?',
          answer: 'Phí giao hàng phụ thuộc vào địa chỉ giao hàng và phương thức vận chuyển. Phí sẽ được hiển thị khi bạn đặt hàng.',
        },
        {
          question: 'Thời gian giao hàng là bao lâu?',
          answer: 'Đối với nội thành TP.HCM, thời gian giao hàng là 2-4 giờ. Đối với các tỉnh thành khác, thời gian giao hàng là 2-5 ngày làm việc.',
        },
        {
          question: 'Tôi có thể thay đổi địa chỉ giao hàng sau khi đặt hàng không?',
          answer: 'Bạn có thể liên hệ với chúng tôi để thay đổi địa chỉ giao hàng nếu đơn hàng chưa được gửi đi.',
        },
      ],
    },
    {
      category: 'Đổi trả',
      icon: <AssignmentReturn />,
      questions: [
        {
          question: 'Chính sách đổi trả như thế nào?',
          answer: 'Bạn có thể đổi/trả hàng trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên vẹn, chưa sử dụng và có đầy đủ phụ kiện.',
        },
        {
          question: 'Làm thế nào để yêu cầu đổi/trả hàng?',
          answer: 'Bạn có thể yêu cầu đổi/trả hàng trong phần "Đơn hàng" của tài khoản. Chọn đơn hàng và nhấn nút "Đổi/Trả hàng".',
        },
        {
          question: 'Phí đổi trả có mất phí không?',
          answer: 'Nếu sản phẩm có lỗi từ nhà sản xuất, chúng tôi sẽ miễn phí đổi trả. Nếu bạn đổi trả vì lý do khác, phí vận chuyển sẽ do bạn chịu.',
        },
      ],
    },
  ]

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Help sx={{ fontSize: 60, color: '#e63946', mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Câu hỏi thường gặp
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tìm câu trả lời cho các câu hỏi thường gặp về sản phẩm, đặt hàng, thanh toán và giao hàng
          </Typography>
        </Box>

        {faqs.map((category, categoryIndex) => (
          <Box key={categoryIndex} sx={{ mb: 4 }}>
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#e63946', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {category.icon}
                <Typography variant="h5" fontWeight="bold">
                  {category.category}
                </Typography>
              </Box>
            </Paper>

            {category.questions.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expanded === `panel-${categoryIndex}-${index}`}
                onChange={handleChange(`panel-${categoryIndex}-${index}`)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ))}
      </Container>
    </motion.div>
  )
}

export default FAQ

