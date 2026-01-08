import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../services/api'
import { getCache, setCache } from '../utils/cacheHelper'

/**
 * Hook để fetch tất cả products cho trang Home
 * Sử dụng React Query + localStorage cache để tối ưu tốc độ load
 */
export const useHomeProducts = () => {
  const queryClient = useQueryClient()

  // Featured Products - Sản phẩm nổi bật
  const featured = useQuery({
    queryKey: ['home', 'featured'],
    queryFn: async () => {
      console.log('🔄 [useHomeProducts] Fetching FEATURED products');
      const res = await productsApi.getProducts({ 
        limit: 8, 
        filters: { is_featured: true } 
      })
      const data = res.data?.data || []
      
      // Save to cache
      setCache('home_featured', data, 5 * 60 * 1000) // 5 phút
      return data
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    gcTime: 10 * 60 * 1000, // Giữ cache 10 phút
    refetchOnWindowFocus: false,
    refetchOnMount: true, // ✅ Fetch lại khi mount (F5)
  })

  // New Products - Sản phẩm mới
  const newProducts = useQuery({
    queryKey: ['home', 'new'],
    queryFn: async () => {
      console.log('🔄 [useHomeProducts] Fetching NEW products');
      const res = await productsApi.getProducts({ 
        limit: 8, 
        sort: 'latest' 
      })
      const data = res.data?.data || []
      
      setCache('home_new', data, 5 * 60 * 1000)
      return data
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    gcTime: 10 * 60 * 1000, // Giữ cache 10 phút
    refetchOnWindowFocus: false,
    refetchOnMount: true, // ✅ Fetch lại khi mount (F5)
  })

  // Bestsellers - Bán chạy nhất
  const bestsellers = useQuery({
    queryKey: ['home', 'bestsellers'],
    queryFn: async () => {
      console.log('🔄 [useHomeProducts] Fetching BESTSELLERS');
      const res = await productsApi.getProducts({ 
        limit: 8, 
        sort: 'bestseller' 
      })
      const data = res.data?.data || []
      
      setCache('home_bestsellers', data, 5 * 60 * 1000)
      return data
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    gcTime: 10 * 60 * 1000, // Giữ cache 10 phút
    refetchOnWindowFocus: false,
    refetchOnMount: true, // ✅ Fetch lại khi mount (F5)
  })

  // Promotion Products - Sản phẩm khuyến mãi
  const promotions = useQuery({
    queryKey: ['home', 'promotions'],
    queryFn: async () => {
      console.log('🔄 [useHomeProducts] Fetching PROMOTION products');
      const params = { 
        limit: 8, 
        filters: { has_promotion: true }
      };
      const res = await productsApi.getProducts(params);
      const products = res.data?.data || [];
      
      setCache('home_promotions', products, 2 * 60 * 1000) // ✅ Giảm xuống 2 phút
      return products;
    },
    staleTime: 1 * 60 * 1000, // ✅ Cache 1 phút (thay vì 5 phút)
    gcTime: 5 * 60 * 1000, // ✅ Giữ cache 5 phút (thay vì 10 phút)
    refetchOnWindowFocus: false,
    refetchOnMount: true, // ✅ Fetch lại khi mount (F5)
  })

  // Function để invalidate tất cả cache của Home
  const invalidateAll = () => {
    // Xóa localStorage cache
    import('../utils/cacheHelper').then(({ clearCache }) => {
      clearCache('home_featured')
      clearCache('home_new')
      clearCache('home_bestsellers')
      clearCache('home_promotions')
    })
    
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['home'] });
    
    // Force refetch
    setTimeout(() => {
      featured.refetch();
      newProducts.refetch();
      bestsellers.refetch();
      promotions.refetch();
    }, 100);
  }

  return {
    // Data - Sử dụng data từ React Query (đã được memoized)
    featuredProducts: featured.data ?? [],
    newProducts: newProducts.data ?? [],
    bestsellers: bestsellers.data ?? [],
    promotionProducts: promotions.data ?? [],
    
    // Loading states
    isLoading: featured.isLoading || newProducts.isLoading || 
               bestsellers.isLoading || promotions.isLoading,
    isFetching: featured.isFetching || newProducts.isFetching || 
                bestsellers.isFetching || promotions.isFetching,
    
    // Actions
    refetchAll: () => {
      featured.refetch();
      newProducts.refetch();
      bestsellers.refetch();
      promotions.refetch();
    },
    invalidateAll,
  }
}
