import { useEffect, useRef, useState } from 'react'
import type { State } from './model'

export type Notice = { message: string; previous?: State; date?: string }

export default function Feedback({ notice, onDismiss, onUndo }: {
  notice: Notice
  onDismiss: (notice: Notice) => void
  onUndo: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const returnFocus = useRef<HTMLElement | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const duration = notice.previous ? 10000 : 5000

  useEffect(() => {
    // Let the closing dialog restore focus first, then reveal the reserved lane.
    const frame = requestAnimationFrame(() => root.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [notice])

  useEffect(() => {
    if (hovered || focused) return
    const timer = window.setTimeout(() => onDismiss(notice), duration)
    return () => window.clearTimeout(timer)
  }, [notice, duration, hovered, focused, onDismiss])

  function finish(action: () => void) {
    if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true })
    action()
  }

  return <div ref={root} className="hd-feedback" role="status" aria-live="polite" aria-atomic="true"
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true) }}
    onPointerLeave={() => setHovered(false)}
    onFocus={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        returnFocus.current = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null
      }
      setFocused(true)
    }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <span>{notice.message}</span>
    {notice.previous && <button onClick={() => finish(onUndo)}>撤销</button>}
    <button aria-label="关闭提示" onClick={() => finish(() => onDismiss(notice))}>×</button>
  </div>
}
