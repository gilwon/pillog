'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdminIngredientsResponse } from '@/types/api'
import type { Ingredient, IngredientAlias } from '@/types/database'

interface IngredientsParams {
  q?: string
  category?: string
  page?: number
  limit?: number
}

async function fetchAdminIngredients(params: IngredientsParams): Promise<AdminIngredientsResponse> {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.set('q', params.q)
  if (params.category) searchParams.set('category', params.category)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  const res = await fetch(`/api/admin/ingredients?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch ingredients')
  return res.json()
}

async function createIngredient(body: Partial<Ingredient>): Promise<Ingredient> {
  const res = await fetch('/api/admin/ingredients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to create ingredient')
  }
  return res.json()
}

async function updateIngredient({ id, ...body }: Partial<Ingredient> & { id: string }): Promise<Ingredient> {
  const res = await fetch(`/api/admin/ingredients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to update ingredient')
  }
  return res.json()
}

async function fetchAliases(ingredientId: string): Promise<{ data: IngredientAlias[] }> {
  const res = await fetch(`/api/admin/ingredients/${ingredientId}/aliases`)
  if (!res.ok) throw new Error('Failed to fetch aliases')
  return res.json()
}

async function addAlias({ ingredientId, alias_name, alias_type }: { ingredientId: string; alias_name: string; alias_type: string }): Promise<IngredientAlias> {
  const res = await fetch(`/api/admin/ingredients/${ingredientId}/aliases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias_name, alias_type }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to add alias')
  }
  return res.json()
}

async function deleteAlias({ ingredientId, aliasId }: { ingredientId: string; aliasId: string }) {
  const res = await fetch(`/api/admin/ingredients/${ingredientId}/aliases?aliasId=${aliasId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete alias')
  return res.json()
}

export function useAdminIngredients(params: IngredientsParams) {
  return useQuery({
    queryKey: ['admin', 'ingredients', params],
    queryFn: () => fetchAdminIngredients(params),
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients'] })
    },
  })
}

export function useIngredientAliases(ingredientId: string) {
  return useQuery({
    queryKey: ['admin', 'ingredients', ingredientId, 'aliases'],
    queryFn: () => fetchAliases(ingredientId),
    enabled: !!ingredientId,
  })
}

export function useAddAlias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addAlias,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'ingredients', variables.ingredientId, 'aliases'],
      })
    },
  })
}

export function useDeleteAlias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAlias,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'ingredients', variables.ingredientId, 'aliases'],
      })
    },
  })
}
