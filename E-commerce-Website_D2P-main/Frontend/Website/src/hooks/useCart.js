import { useQuery } from '@tanstack/react-query'
import { cartApi } from '../services/api'
import { queryKeys } from '../services/queryKeys'
import useAuth from './useAuth'

export const useCart = () => {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: () => cartApi.getCart().then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  })
}

