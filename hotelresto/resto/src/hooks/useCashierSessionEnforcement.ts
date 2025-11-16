'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, type Staff } from '@/lib/api'

interface ShiftTime {
  hours: number
  minutes: number
}

export function useCashierSessionEnforcement(staff: Staff | null) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [shouldOpenSession, setShouldOpenSession] = useState(false)
  const [shouldCloseSession, setShouldCloseSession] = useState(false)
  const [currentShift, setCurrentShift] = useState<'MORNING' | 'AFTERNOON' | 'NIGHT' | null>(null)

  useEffect(() => {
    // Only enforce for CASHIER role
    if (!staff || staff.role !== 'CASHIER') {
      setChecking(false)
      return
    }

    const checkSessionEnforcement = async () => {
      try {
        const now = new Date()
        const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight

        // Define shift times (24-hour format)
        const shifts = {
          MORNING: { start: 6 * 60, end: 14 * 60 },    // 06:00 - 14:00
          AFTERNOON: { start: 14 * 60, end: 22 * 60 }, // 14:00 - 22:00
          NIGHT: { start: 22 * 60, end: 30 * 60 }      // 22:00 - 06:00 (next day)
        }

        // Determine current shift
        let activeShift: 'MORNING' | 'AFTERNOON' | 'NIGHT' | null = null

        if (currentTime >= shifts.MORNING.start && currentTime < shifts.MORNING.end) {
          activeShift = 'MORNING'
        } else if (currentTime >= shifts.AFTERNOON.start && currentTime < shifts.AFTERNOON.end) {
          activeShift = 'AFTERNOON'
        } else if (currentTime >= shifts.NIGHT.start || currentTime < 6 * 60) {
          activeShift = 'NIGHT'
        }

        setCurrentShift(activeShift)

        if (!activeShift) {
          setChecking(false)
          return // Outside shift hours
        }

        // Check if cashier has today's schedule for this shift
        const today = now.toISOString().split('T')[0] // YYYY-MM-DD
        const scheduleResponse = await api.checkSchedule(staff.id!, activeShift)

        if (!scheduleResponse.has_schedule) {
          // No schedule for this shift - don't enforce
          setChecking(false)
          return
        }

        // Check if cashier has an active session
        const sessions = await api.getActiveCashierSession()
        const activeSession = sessions.find((s: any) =>
          s.cashier === staff.id &&
          s.status === 'OPEN' &&
          s.shift_type === activeShift
        )

        // Determine shift end time (give 15 min grace period)
        const shiftEndTime = activeShift === 'MORNING' ? shifts.MORNING.end :
                            activeShift === 'AFTERNOON' ? shifts.AFTERNOON.end :
                            shifts.NIGHT.end

        const isNearShiftEnd = currentTime >= (shiftEndTime - 15) // 15 min before end

        if (!activeSession) {
          // No active session - should open
          setShouldOpenSession(true)
          setShouldCloseSession(false)
        } else if (isNearShiftEnd) {
          // Near shift end and has active session - should close
          setShouldOpenSession(false)
          setShouldCloseSession(true)
        } else {
          // Has active session and not near end - all good
          setShouldOpenSession(false)
          setShouldCloseSession(false)
        }

      } catch (error) {
        console.error('Error checking session enforcement:', error)
      } finally {
        setChecking(false)
      }
    }

    checkSessionEnforcement()

    // Recheck every 5 minutes
    const interval = setInterval(checkSessionEnforcement, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [staff])

  // Force redirect if needed
  useEffect(() => {
    if (checking) return

    if (shouldOpenSession) {
      // Force redirect to open session page
      router.push('/session/open')
    } else if (shouldCloseSession) {
      // Force redirect to close session page
      router.push('/session/close')
    }
  }, [checking, shouldOpenSession, shouldCloseSession, router])

  return {
    checking,
    shouldOpenSession,
    shouldCloseSession,
    currentShift
  }
}
