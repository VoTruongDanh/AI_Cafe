import { Box, Container, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

const BrandSection = () => {
  const navigate = useNavigate()
  const brands = [
    {
      name: 'Apple',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      slug: 'apple',
    },
    {
      name: 'Samsung',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
      slug: 'samsung',
    },
    {
      name: 'Dell',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg',
      slug: 'dell',
    },
    {
      name: 'HP',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg',
      slug: 'hp',
    },
    {
      name: 'Lenovo',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Lenovo_logo_2015.svg',
      slug: 'lenovo',
    },
    {
      name: 'Sony',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',
      slug: 'sony',
    },
    {
      name: 'LG',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg',
      slug: 'lg',
    },
    {
      name: 'Asus',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg',
      slug: 'asus',
    },
    {
      name: 'Xiaomi',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg',
      slug: 'xiaomi',
    },
    {
      name: 'Panasonic',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Panasonic_logo_%28Blue%29.svg',
      slug: 'panasonic',
    },
    {
      name: 'Toshiba',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Toshiba_logo.svg',
      slug: 'toshiba',
    },
    {
      name: 'Canon',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Canon_wordmark.svg',
      slug: 'canon',
    },
  ]

  const handleBrandClick = (brand) => {
    navigate(`/products?search=${brand.name}`)
  }

  return (
    <Box sx={{ bgcolor: '#f8f9fa', py: 6 }}>
      <Container maxWidth="xl">
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            mb: 1,
            color: '#2d3436',
          }}
        >
          THƯƠNG HIỆU NỔI BẬT
        </Typography>
        <Box
          sx={{
            width: 60,
            height: 4,
            bgcolor: '#e63946',
            mx: 'auto',
            mb: 4,
            borderRadius: 2,
          }}
        />
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            color: '#636e72',
            mb: 4,
          }}
        >
          Các thương hiệu công nghệ hàng đầu thế giới
        </Typography>

        <Swiper
          modules={[Autoplay]}
          spaceBetween={30}
          slidesPerView={2}
          loop={true}
          autoplay={{
            delay: 2000,
            disableOnInteraction: false,
          }}
          breakpoints={{
            640: {
              slidesPerView: 3,
            },
            768: {
              slidesPerView: 4,
            },
            1024: {
              slidesPerView: 6,
            },
            1280: {
              slidesPerView: 8,
            },
          }}
        >
          {brands.map((brand, index) => (
            <SwiperSlide key={index}>
              <Box
                onClick={() => handleBrandClick(brand)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 100,
                  bgcolor: 'white',
                  borderRadius: 2,
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3,
                  },
                }}
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '60px',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentElement.innerHTML = `<span style="font-weight: bold; color: #2d3436;">${brand.name}</span>`
                  }}
                />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </Box>
  )
}

export default BrandSection
