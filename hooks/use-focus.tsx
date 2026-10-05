'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useWorkspace } from './use-workspace'

type FocusStatus = 'idle' | 'running' | 'paused' | 'completed'
interface FocusValue {
  duration: number
  remaining: number
  status: FocusStatus
  taskId?: string
  setDuration: (minutes: number) => void
  selectTask: (id: string) => void
  toggle: () => void
  reset: () => void
}
type FocusControls = Omit<FocusValue, 'remaining'>
const FocusContext = createContext<FocusValue | null>(null)
const FocusControlsContext = createContext<FocusControls | null>(null)

export function FocusProvider({ children }: { children: ReactNode }) {
  const { addSession } = useWorkspace()
  const [duration, setMinutes] = useState(25)
  const [remaining, setRemaining] = useState(25 * 60)
  const [status, setStatus] = useState<FocusStatus>('idle')
  const [taskId, setTaskId] = useState<string>()
  const deadline = useRef(0)
  const pausedSeconds = useRef(25 * 60)
  const session = useRef<{ id: string; startedAt: string } | null>(null)
  const saveSession = useRef(addSession)
  saveSession.current = addSession

  const complete = useCallback(() => {
    if (!session.current) return
    const finished = session.current
    session.current = null
    void saveSession.current({ ...finished, taskId, durationSeconds: duration * 60 })
    setRemaining(0)
    setStatus('completed')
    toast.success('Một phiên tập trung trọn vẹn!', { description: `${duration} phút đã được thêm vào hành trình. Hãy nghỉ ngơi một chút nhé.` })
  }, [duration, taskId])

  useEffect(() => {
    if (status !== 'running') return
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds === 0) complete()
    }
    const onVisible = () => { if (!document.hidden) tick() }
    tick()
    const interval = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', tick)
    }
  }, [status, complete])

  const toggle = useCallback(() => {
    if (status === 'running') {
      const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      if (!seconds) { complete(); return }
      pausedSeconds.current = seconds
      setRemaining(seconds)
      setStatus('paused')
    } else {
      const seconds = status === 'paused' ? pausedSeconds.current : duration * 60
      if (status !== 'paused') session.current = { id: crypto.randomUUID(), startedAt: new Date().toISOString() }
      deadline.current = Date.now() + seconds * 1000
      setRemaining(seconds)
      setStatus('running')
    }
  }, [status, duration, complete])

  const controls = useMemo<FocusControls>(() => ({ duration, status, taskId, toggle,
    setDuration: (minutes) => { if (status === 'running' || status === 'paused' || ![25, 50].includes(minutes)) return; setMinutes(minutes); setRemaining(minutes * 60); setStatus('idle') },
    selectTask: (id) => { if (status === 'running' || status === 'paused') { toast.info('Hãy hoàn thành hoặc đặt lại phiên hiện tại trước khi đổi nhiệm vụ.'); return }; setTaskId(id || undefined) },
    reset: () => { session.current = null; setRemaining(duration * 60); setStatus('idle') },
  }), [duration, status, taskId, toggle])
  const value = useMemo<FocusValue>(() => ({ ...controls, remaining }), [controls, remaining])

  return <FocusControlsContext.Provider value={controls}><FocusContext.Provider value={value}>{children}</FocusContext.Provider></FocusControlsContext.Provider>
}

export function useFocusControls() {
  const context = useContext(FocusControlsContext)
  if (!context) throw new Error('FocusProvider is required')
  return context
}

export function useFocus() {
  const context = useContext(FocusContext)
  if (!context) throw new Error('FocusProvider is required')
  return context
}
