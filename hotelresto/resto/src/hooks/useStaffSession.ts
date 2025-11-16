import { useState, useEffect, useCallback } from 'react'
import { api, StaffSession } from '@/lib/api'

export function useStaffSession() {
  const [session, setSession] = useState<StaffSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const activeSession = await api.getActiveSession()
      setSession(activeSession)
    } catch (err: any) {
      // 404 or "No active session" means no active session - this is normal, not an error
      const errorMessage = err.message || ''
      const isNoSessionError =
        errorMessage.includes('404') ||
        errorMessage.includes('No active session') ||
        errorMessage.toLowerCase().includes('not found')

      if (isNoSessionError) {
        // This is expected when there's no active session - not an error
        setSession(null)
        setError(null)
      } else {
        // Only set error for actual errors (not "no session" state)
        setError(errorMessage || 'Failed to fetch session')
        console.error('Error fetching session:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const startSession = async (data?: { shift_type?: string }) => {
    try {
      setError(null)
      const newSession = await api.startStaffSession(data)
      setSession(newSession)
      return newSession
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start session'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  const endSession = async () => {
    if (!session) {
      throw new Error('No active session to end')
    }

    try {
      setError(null)
      const closedSession = await api.endStaffSession(session.id)
      setSession(null)
      return closedSession
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to end session'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  const refreshSession = useCallback(async () => {
    await fetchSession()
  }, [fetchSession])

  return {
    session,
    loading,
    error,
    hasActiveSession: !!session,
    startSession,
    endSession,
    refreshSession
  }
}
