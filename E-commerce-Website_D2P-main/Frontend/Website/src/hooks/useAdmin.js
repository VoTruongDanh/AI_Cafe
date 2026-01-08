import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../services/queryKeys'
import {
  adminProductsApi,
  adminOrdersApi,
  adminUsersApi,
  adminCategoriesApi,
  adminDashboardApi,
} from '../services/api'

// Products
export const useAdminProducts = (params) => {
  return useQuery({
    queryKey: queryKeys.adminProducts.list(params),
    queryFn: () => adminProductsApi.getAll(params).then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0,
    refetchOnWindowFocus: true,
  })
}

export const useAdminProduct = (id) => {
  return useQuery({
    queryKey: queryKeys.adminProducts.detail(id),
    queryFn: () => adminProductsApi.getById(id).then(res => res.data),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    enabled: !!id,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => adminProductsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts.all })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => adminProductsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts.all })
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => adminProductsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts.all })
    },
  })
}

// Orders
export const useAdminOrders = (params) => {
  return useQuery({
    queryKey: queryKeys.adminOrders.list(params),
    queryFn: () => adminOrdersApi.getAll(params).then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0,
    refetchOnWindowFocus: true,
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => adminOrdersApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all })
    },
  })
}

// Users
export const useAdminUsers = (params) => {
  return useQuery({
    queryKey: queryKeys.adminUsers.list(params),
    queryFn: () => adminUsersApi.getAll(params).then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0,
    refetchOnWindowFocus: true,
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => adminUsersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all })
    },
  })
}

// Dashboard
export const useDashboardStatistics = () => {
  return useQuery({
    queryKey: queryKeys.adminDashboard.statistics,
    queryFn: () => adminDashboardApi.getStatistics().then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0,
    refetchOnWindowFocus: true,
  })
}

export const useSalesChart = (period) => {
  return useQuery({
    queryKey: queryKeys.adminDashboard.salesChart(period),
    queryFn: () => adminDashboardApi.getSalesChart(period).then(res => res.data),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    enabled: !!period,
  })
}

// Categories
export const useAdminCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => adminCategoriesApi.getAll().then(res => res.data),
    staleTime: 0, // ❌ Không cache
    gcTime: 0,
    refetchOnWindowFocus: true,
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => adminCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}

