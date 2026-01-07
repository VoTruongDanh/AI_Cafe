import { Box } from '@mui/material'

/**
 * LazyImage Component - Tự động lazy load ảnh
 * Sử dụng native browser lazy loading (loading="lazy")
 * 
 * @param {string} src - URL ảnh
 * @param {string} alt - Alt text
 * @param {object} sx - MUI sx props
 * @param {object} ...props - Các props khác
 */
const LazyImage = ({ src, alt = '', sx = {}, ...props }) => {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy" // ✅ Native lazy loading
      sx={{
        ...sx,
      }}
      {...props}
    />
  )
}

export default LazyImage
