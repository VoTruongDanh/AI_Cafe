import { motion } from 'framer-motion'
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Button,
} from '@mui/material'
import {
  Security,
  Phone,
  Email,
  Chat,
  Store,
} from '@mui/icons-material'

const ServiceWarranty = () => {
  const sectionStyle = {
    mb: 4,
  }

  const headingStyle = {
    fontWeight: 700,
    color: '#1a1a2e',
    mb: 2,
  }

  const subHeadingStyle = {
    fontWeight: 600,
    color: '#333',
    mb: 1.5,
    mt: 3,
  }

  const paragraphStyle = {
    mb: 2,
    lineHeight: 1.8,
    color: '#444',
  }

  const listStyle = {
    pl: 3,
    mb: 2,
    '& li': {
      mb: 1,
      lineHeight: 1.7,
      color: '#444',
    },
  }

  const stepBoxStyle = {
    bgcolor: '#f8f9fa',
    p: 3,
    borderRadius: 2,
    mb: 2,
    borderLeft: '4px solid #ff6b35',
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            sx={{
              p: 4,
              mb: 4,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              color: 'white',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Security sx={{ fontSize: 50 }} />
                <Typography variant="h3" fontWeight={700}>
                  Quy Trình Bảo Hành - Chính Sách Bảo Hành
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 800 }}>
                Chính sách bảo hành 1 đổi 1 đối với sản phẩm bị lỗi kỹ thuật trong 30 ngày.
                Cam kết mang đến trải nghiệm mua sắm an tâm cho khách hàng!
              </Typography>
            </Box>
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.05)',
              }}
            />
          </Paper>
        </motion.div>

        {/* Main Content */}
        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
          {/* Section I */}
          <Box sx={sectionStyle}>
            <Typography variant="h4" sx={headingStyle}>
              I. Điều kiện và Quy trình bảo hành
            </Typography>
            
            <Box component="ul" sx={listStyle}>
              <li>Sản phẩm hư hỏng do lỗi kỹ thuật của nhà sản xuất.</li>
              <li>Sản phẩm còn thời hạn bảo hành của Hãng/NCC.</li>
            </Box>

            {/* Bước 1 */}
            <Box sx={stepBoxStyle}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff6b35', mb: 2 }}>
                ➜ Bước 1
              </Typography>
              <Typography sx={paragraphStyle}>
                Khi có nhu cầu bảo hành, hãy liên hệ ElectroShop bằng cách:
              </Typography>
              <Box component="ul" sx={listStyle}>
                <li><strong>Gọi đến Hotline:</strong> 1800 6800</li>
                <li><strong>Trò chuyện với Chatbox</strong> trên Facebook hoặc Website ElectroShop</li>
                <li><strong>Email đến:</strong> support@electroshop.vn</li>
              </Box>
            </Box>

            {/* Bước 2 */}
            <Box sx={stepBoxStyle}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff6b35', mb: 2 }}>
                ➜ Bước 2
              </Typography>
              <Typography sx={paragraphStyle}>
                Nhân viên Chăm Sóc Khách Hàng sẽ ghi nhận các thông tin: Tên Khách Hàng, Số điện thoại, Số chứng từ mua hàng, Số hóa đơn, Ngày hóa đơn, Tên sản phẩm.
              </Typography>
              <Typography sx={paragraphStyle}>
                Tiếp đó, nhân viên sẽ xác nhận sản phẩm lỗi còn hạn bảo hành và thực hiện phân loại sản phẩm theo nơi xử lý như sau:
              </Typography>
              <Box component="ul" sx={listStyle}>
                <li><strong>Sản phẩm gia dụng, kỹ thuật số:</strong> khách hàng sẽ mang sản phẩm đến Trung tâm mua sắm gần nhất để bảo hành (Xem tiếp Bước 3).</li>
                <li><strong>Sản phẩm cần lắp đặt:</strong> nhân viên chăm sóc khách hàng chuyển thông tin qua Bộ phận bảo hành để tiến hành bảo hành tại nhà cho khách hàng (Xem tiếp Bước 3).</li>
              </Box>
            </Box>

            {/* Bước 3 */}
            <Box sx={stepBoxStyle}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff6b35', mb: 2 }}>
                ➜ Bước 3
              </Typography>
              
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                Đối với sản phẩm gia dụng, kỹ thuật số:
              </Typography>
              <Box component="ul" sx={listStyle}>
                <li>Khi khách hàng mang sản phẩm đến cửa hàng, đại diện Trung tâm mua sắm sẽ tiến hành kiểm tra hóa đơn mua hàng, xác định lỗi kỹ thuật của sản phẩm và nhận sản phẩm lưu kho.</li>
                <li>Xe cung ứng sẽ đến nhận hàng và vận chuyển đến Bộ phận bảo hành.</li>
              </Box>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 1, mt: 2 }}>
                Đối với sản phẩm cần lắp đặt:
              </Typography>
              <Box component="ul" sx={listStyle}>
                <li>Nhân viên Bộ phận bảo hành đến nhà khách hàng (không quá 3 ngày đối với khu vực nội thành, không quá 5 ngày đối với khu vực ngoại thành), tiến hành kiểm tra hóa đơn mua hàng và xác định lỗi kỹ thuật của sản phẩm.</li>
                <li><strong>Nếu lỗi sản phẩm do khách hàng dùng sai cách:</strong> Nhân viên bảo hành hướng dẫn lại cách sử dụng đúng cho khách hàng.</li>
                <li><strong>Nếu lỗi kỹ thuật đơn giản, có thể sửa tại chỗ:</strong> Nhân viên bảo hành tiến hành sửa lỗi cho khách hàng ngay tại nhà.</li>
                <li><strong>Nếu lỗi kỹ thuật phức tạp:</strong> Nhân viên bảo hành tiếp nhận sản phẩm và chuyển cho Hãng bảo hành.</li>
              </Box>
            </Box>

            {/* Bước 4 */}
            <Box sx={stepBoxStyle}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff6b35', mb: 2 }}>
                ➜ Bước 4
              </Typography>
              <Box component="ul" sx={listStyle}>
                <li>Bộ phận bảo hành sẽ nhận sản phẩm vào kho và chuyển sang cho Hãng bảo hành, sửa chữa (không quá 7 ngày đối với khu vực nội thành, không quá 10 ngày đối với khu vực ngoại thành).</li>
                <li>Sau khi hoàn tất bảo hành, Bộ phận bảo hành sẽ xuất trả sản phẩm cho khách hàng hoặc Trung tâm mua sắm để khách hàng đến trung tâm nhận lại sản phẩm.</li>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 5 }} />

          {/* Section II */}
          <Box sx={sectionStyle}>
            <Typography variant="h4" sx={headingStyle}>
              II. Chính Sách Bảo Hành
            </Typography>

            <Typography variant="h5" sx={subHeadingStyle}>
              1. Đối Tượng Và Phạm Vi Áp Dụng
            </Typography>
            <Typography sx={paragraphStyle}>
              Tất cả Khách Hàng mua sản phẩm tại hệ thống Trung Tâm Mua Sắm ElectroShop, tại Online, B2B. Áp dụng cho tất cả sản phẩm bán ra bởi ElectroShop.
            </Typography>

            <Typography variant="h5" sx={subHeadingStyle}>
              2. Chính Sách Bảo Hành Sản Phẩm
            </Typography>
            
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 1, mt: 2 }}>
              Điều kiện áp dụng bảo hành sản phẩm:
            </Typography>
            <Box component="ul" sx={listStyle}>
              <li>Sản phẩm còn trong thời gian bảo hành theo hoá đơn mua hàng của ElectroShop. Sản phẩm bị lỗi kỹ thuật của nhà sản xuất.</li>
              <li>Số serial/imei sản phẩm phải còn nguyên vẹn, không bị tẩy xoá/sửa và phải trùng khớp với thông tin trên hoá đơn, phiếu bảo hành của sản phẩm.</li>
              <li>Sản phẩm không thuộc trường hợp được bảo hành miễn phí của nhà sản xuất.</li>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#d32f2f', mb: 1, mt: 3 }}>
              Những trường hợp không được bảo hành miễn phí của nhà sản xuất:
            </Typography>
            <Box component="ul" sx={listStyle}>
              <li>Sản phẩm không thuộc phạm vi bảo hành nhà sản xuất.</li>
              <li>Sản phẩm không có thông tin hay chứng từ mua hàng tại hệ thống ElectroShop. Sản phẩm không còn trong thời gian bảo hành.</li>
              <li>Sản phẩm hư hỏng do tác động bên ngoài, hoả hoạn, sấm sét, lũ lụt hoặc do thiên nhiên, môi trường, hoá chất làm ảnh hưởng đến bề mặt, cấu trúc, vận hành của sản phẩm, thiết bị như: vết trầy xước, rỉ sét, vết mòn thông thường...</li>
              <li>Sản phẩm hư hỏng gây ra do lỗi người sử dụng, vận chuyển hoặc do tác động nhiệt, tác động bên ngoài: rơi, biến dạng, vỡ, nứt...</li>
              <li>Sản phẩm sử dụng sai chức năng, lắp đặt không đúng theo sách hướng dẫn hoặc tài liệu đính kèm, sử dụng sai điện thế hoặc nguồn điện không ổn định, sử dụng nguồn nước yếu, dơ phèn... (đối với máy giặt) và bảo quản sản phẩm không tốt như để nước, bụi, động vật, côn trùng, vật lạ vào sản phẩm.</li>
              <li>Model trên sản phẩm bị cạo sửa, xoá mất thông tin sản phẩm không phù hợp với hoá đơn tài chính liên quan đến sản phẩm (nếu có).</li>
              <li>Khách hàng cung cấp thông tin sản phẩm sai, không đúng thực tế khi mua hàng.</li>
              <li>Các bộ phận trong máy bị thay đổi hoặc đã tháo gỡ, sửa chữa tại những nơi không trực thuộc hệ thống Trung Tâm/Trạm Bảo Hành Uỷ Quyền chính hãng.</li>
              <li>Không bảo trì, vệ sinh máy thường xuyên hoặc sử dụng sản phẩm không phù hợp với thiết kế được ghi trên máy hoặc dùng quá công suất thiết kế của nhà sản xuất.</li>
              <li>Sản phẩm bảo hành không bao gồm các trường hợp sau: Sự hao mòn thông thường trong quá trình vận hành hoặc sử dụng sản phẩm, vỏ máy, phụ kiện kèm theo máy như: dây cắm điện, remote, pin, vỏ máy... Bảo trì, bảo dưỡng sản phẩm.</li>
            </Box>
          </Box>

          <Divider sx={{ my: 5 }} />

          {/* Section III */}
          <Box sx={sectionStyle}>
            <Typography variant="h4" sx={headingStyle}>
              III. Chính sách bảo hành 1 đổi 1 đối với sản phẩm bị lỗi kỹ thuật trong 30 ngày
            </Typography>

            <Typography variant="h5" sx={subHeadingStyle}>
              1. Thời Gian Áp Dụng
            </Typography>
            <Typography sx={paragraphStyle}>
              Áp dụng bắt đầu từ ngày 15 tháng 07 năm 2024 cho đến khi có thông báo mới.
            </Typography>

            <Typography variant="h5" sx={subHeadingStyle}>
              2. Phạm Vi Áp Dụng
            </Typography>
            <Box component="ul" sx={listStyle}>
              <li>Áp dụng cho tất cả sản phẩm thuộc ngành hàng Điện tử, Điện gia dụng & Điện lạnh do hệ thống ElectroShop kinh doanh phân phối đến khách hàng là người dùng cuối có hóa đơn bán lẻ của ElectroShop.</li>
              <li>Chính sách này <strong>không áp dụng</strong> cho Máy Lọc Nước & các sản phẩm thuộc ngành hàng Kỹ thuật số như: Máy tính để bàn (PC), Máy tính xách tay (Laptop), Máy in, Điện thoại di động, Linh phụ kiện và tất cả các thiết bị di động khác…</li>
              <li>Trong thời hạn <strong>30 ngày đầu tiên</strong> mua hàng (Riêng nhóm hàng Tủ Đông, Tủ Mát, Tủ Rượu chỉ áp dụng trong thời hạn 7 ngày đầu tiên), được tính từ ngày giao/lắp đặt xong và với điều kiện sử dụng thông thường (*), nếu sản phẩm bị lỗi kỹ thuật sẽ được đổi mới với các điều kiện sau:</li>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4caf50', mb: 1, mt: 3 }}>
              Điều kiện được đổi sản phẩm:
            </Typography>
            <Box component="ul" sx={listStyle}>
              <li>Sản phẩm bị lỗi kỹ thuật có Biên bản kiểm tra xác nhận từ Kỹ thuật viên của ElectroShop hoặc Kỹ thuật viên của Trung tâm bảo hành chính Hãng.</li>
              <li>Sản phẩm được lắp đặt, sử dụng đúng theo hướng dẫn của Nhà sản xuất, không bị thay đổi, can thiệp sửa chữa bởi Kỹ thuật viên không phải của ElectroShop hoặc của Hãng.</li>
              <li>Số serial/imei của sản phẩm phải trùng khớp với thông tin ghi trên Phiếu bảo hành.</li>
              <li>Sản phẩm phải còn đầy đủ: Hóa đơn mua hàng, Thùng, sách hướng dẫn, phụ kiện đi kèm.</li>
              <li>Sản phẩm giữ nguyên 100% hình dạng ban đầu không bị lỗi ngoại quan: Trầy, móp, biến dạng nứt, bể và bị hư do chất lỏng vào máy.</li>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1, mt: 3 }}>
              Quy định đổi sản phẩm:
            </Typography>
            <Box component="ul" sx={listStyle}>
              <li>Thực hiện <strong>1 đổi 1:</strong> Đổi sản phẩm cùng chủng loại. Trường hợp không có sản phẩm để đổi, khách hàng được quyền đổi sang sản phẩm khác bù tiền chênh lệch (nếu có). Không đổi sản phẩm có giá trị thấp hơn sản phẩm ban đầu.</li>
              <li>Chỉ đổi thành phần chính, không đổi phụ kiện.</li>
              <li>Sản phẩm có 02 thành phần như Máy lạnh, thành phần nào hư đổi thành phần đó, không đổi nguyên bộ.</li>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ff9800', mb: 1, mt: 3 }}>
              Quy định khấu trừ đối với trường hợp trả hàng hoàn tiền:
            </Typography>
            <Typography sx={paragraphStyle}>
              Trong trường hợp sản phẩm bị lỗi kỹ thuật nhưng khách không đồng ý đổi mới, yêu cầu hoàn tiền, thì áp dụng thu phí khấu hao như sau:
            </Typography>
            <Box component="ul" sx={listStyle}>
              <li>Trong 30 ngày đầu tiên: <strong>khấu trừ 20%</strong>/giá trị của sản phẩm.</li>
              <li>Từ ngày thứ 31, áp dụng bảo hành theo chính sách & điều kiện bảo hành của nhà sản xuất.</li>
              <li>Sản phẩm thiếu phụ kiện thì khấu trừ theo báo giá thực tế của Hãng. Phòng DV&CSKH/nhân viên GN-LĐ liên hệ TT. DVHM để được báo giá chi tiết.</li>
            </Box>

            <Box sx={{ bgcolor: '#fff3e0', p: 3, borderRadius: 2, mt: 3, border: '1px solid #ffcc80' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e65100', mb: 2 }}>
                (*) Lưu ý:
              </Typography>
              <Box component="ol" sx={{ ...listStyle, pl: 4 }}>
                <li>Chính sách này <strong>không áp dụng</strong> cho sản phẩm được sử dụng cho mục đích thương mại bán sỉ (B2B) như: Nhà hàng, khách sạn, quán ăn, tiệm giặt ủi…</li>
                <li>Chính sách mới này sẽ chấm dứt và thay thế tất cả chính sách thu hồi, đổi trả 1-1 trước đây đã ban hành. Chính sách mới được áp dụng bắt đầu từ ngày 15 tháng 07 năm 2024.</li>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 5 }} />

          {/* Contact Section */}
          <Box sx={{ bgcolor: '#e3f2fd', p: 4, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1565c0', mb: 2 }}>
              Để được tư vấn thêm thông tin về sản phẩm và dịch vụ tại ElectroShop
            </Typography>
            <Typography sx={{ mb: 3, color: '#444' }}>
              Hãy liên hệ ngay với chúng tôi qua các kênh sau đây:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', maxWidth: 500, mx: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'flex-start' }}>
                <Phone sx={{ color: '#4caf50', fontSize: 28 }} />
                <Typography sx={{ fontSize: '1.1rem' }}>
                  <strong>Hotline:</strong> 1800 6800 (miễn phí)
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'flex-start' }}>
                <Email sx={{ color: '#2196f3', fontSize: 28 }} />
                <Typography sx={{ fontSize: '1.1rem' }}>
                  <strong>Email:</strong> support@electroshop.vn
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'flex-start' }}>
                <Chat sx={{ color: '#9c27b0', fontSize: 28 }} />
                <Typography sx={{ fontSize: '1.1rem' }}>
                  <strong>Chat:</strong> Facebook ElectroShop hoặc Website ElectroShop.com
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'flex-start' }}>
                <Store sx={{ color: '#ff5722', fontSize: 28 }} />
                <Typography sx={{ fontSize: '1.1rem' }}>
                  <strong>Các Trung tâm mua sắm ElectroShop trên toàn quốc</strong>
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Phone />}
                sx={{
                  bgcolor: '#4caf50',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': { bgcolor: '#388e3c' },
                }}
              >
                Gọi ngay: 1800 6800
              </Button>
              <Button
                variant="outlined"
                startIcon={<Email />}
                sx={{
                  borderColor: '#2196f3',
                  color: '#2196f3',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': { bgcolor: '#e3f2fd' },
                }}
              >
                Gửi Email
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default ServiceWarranty
