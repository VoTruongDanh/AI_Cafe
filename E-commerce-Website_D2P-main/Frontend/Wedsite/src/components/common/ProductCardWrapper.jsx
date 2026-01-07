import { useSelector } from 'react-redux'
import ProductCard from './ProductCard'

/**
 * Wrapper component cho ProductCard
 * Tự động cập nhật khi Redux store thay đổi
 * 
 * Sử dụng:
 * - Thay vì: <ProductCard product={product} />
 * - Dùng: <ProductCardWrapper productId={product.id} fallbackProduct={product} />
 */
const ProductCardWrapper = ({ productId, fallbackProduct }) => {
  // Lấy product từ Redux store
  const productFromStore = useSelector((state) => 
    state.products.products.find(p => p.id === productId)
  )
  
  // Nếu có trong store thì dùng (data mới nhất), không thì dùng fallback
  const product = productFromStore || fallbackProduct
  
  return <ProductCard product={product} />
}

export default ProductCardWrapper
