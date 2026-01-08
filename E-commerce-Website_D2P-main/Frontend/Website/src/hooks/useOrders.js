import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '../services/api'
import { queryKeys } from '../services/queryKeys'
import useAuth from './useAuth'

export const useOrders = () => {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => ordersApi.getOrders().then(res => res.data),
    enabled: isAuthenticated,
  })
}

export const useOrder = (id) => {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.getOrderById(id).then(res => res.data),
    enabled: isAuthenticated && !!id,
  })
}

