import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '../services/api'
import { queryKeys } from '../services/queryKeys'

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi.getCategories().then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0, // ❌ Không giữ cache
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  })
}

export const useCategory = (id) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoriesApi.getCategoryById(id).then(res => res.data),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    enabled: !!id,
  })
}

