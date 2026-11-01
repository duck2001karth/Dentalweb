"use client"
import { useState, useEffect, useCallback } from 'react'

interface UseApiResourceOptions {
  params?: Record<string, string | number | boolean | null | undefined>
  dependencies?: any[]
  autoFetch?: boolean
}

export function useApiResource<T>(endpoint: string, options: UseApiResourceOptions = {}) {
  const { params, dependencies = [], autoFetch = true } = options
  
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // 1. Construir query params dinámicamente
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value))
          }
        })
      }
      
      const queryString = queryParams.toString()
      const url = queryString ? `${endpoint}?${queryString}` : endpoint

      // 2. Llamada a la API
      const response = await fetch(url)
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Error ${response.status}: Fallo al obtener los datos.`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, ...dependencies])

  // Función para forzar la recarga (útil después de un POST/PATCH)
  const mutate = () => fetchData()

  return { data, isLoading, error, mutate, setData }
}