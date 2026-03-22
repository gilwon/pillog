'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdminProductsResponse, AdminProductDetailResponse } from '@/types/api'
import type { Product } from '@/types/database'

interface ProductsParams {
  q?: string
  status?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

async function fetchAdminProducts(params: ProductsParams): Promise<AdminProductsResponse> {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.set('q', params.q)
  if (params.status) searchParams.set('status', params.status)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  const res = await fetch(`/api/admin/products?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

async function fetchAdminProduct(id: string): Promise<AdminProductDetailResponse> {
  const res = await fetch(`/api/admin/products/${id}`)
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json()
}

async function createProduct(body: Partial<Product>): Promise<Product> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to create product')
  }
  return res.json()
}

async function updateProduct({ id, ...body }: Partial<Product> & { id: string }): Promise<Product> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to update product')
  }
  return res.json()
}

async function toggleProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/${id}/toggle`, { method: 'PATCH' })
  if (!res.ok) throw new Error('Failed to toggle product')
  return res.json()
}

async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete product')
}

async function bulkDeleteProducts(ids: string[]): Promise<void> {
  const res = await fetch('/api/admin/products/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error('Failed to bulk delete products')
}

export function useAdminProducts(params: ProductsParams) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => fetchAdminProducts(params),
  })
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ['admin', 'products', id],
    queryFn: () => fetchAdminProduct(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useToggleProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkDeleteProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
