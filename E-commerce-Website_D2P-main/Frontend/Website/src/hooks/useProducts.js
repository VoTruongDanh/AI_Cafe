import { useQuery } from '@tanstack/react-query'
import { productsApi } from '../services/api'
import { queryKeys } from '../services/queryKeys'

export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productsApi.getProducts(params).then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0, // ❌ Không giữ cache
    refetchOnWindowFocus: false,
    enabled: true, // Always enabled
  })
}

export const useProduct = (id) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getProductDetail(id).then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0, // ❌ Không giữ cache
    refetchOnWindowFocus: false,
    enabled: !!id,
  })
}

export const useSearchProducts = (query) => {
  return useQuery({
    queryKey: queryKeys.products.search(query),
    queryFn: () => productsApi.searchProducts(query).then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0, // ❌ Không giữ cache
    refetchOnWindowFocus: false,
    enabled: !!query && query.length > 0,
  })
}

