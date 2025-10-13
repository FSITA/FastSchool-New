"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/flashcards/api-client"

interface UseHealthCheckReturn {
  isHealthy: boolean
  isLoading: boolean
  error: string | null
  checkHealth: () => Promise<void>
  lastChecked: Date | null
}

export function useHealthCheck(autoCheck = true): UseHealthCheckReturn {
  const [isHealthy, setIsHealthy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.healthCheck()
      setIsHealthy(response.status === "ok" || response.status === "healthy")
      setLastChecked(new Date())
    } catch (err) {
      setIsHealthy(false)
      setError(err instanceof Error ? err.message : "Health check failed")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (autoCheck) {
      checkHealth()
    }
  }, [autoCheck])

  return {
    isHealthy,
    isLoading,
    error,
    checkHealth,
    lastChecked,
  }
}
