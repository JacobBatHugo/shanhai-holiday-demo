import { useEffect, useId, useRef } from 'react'

/** Include only this trigger and its portalled calendar in the interaction boundary. */
export default function usePaperPopup<T extends HTMLElement = HTMLSpanElement>(open: boolean, close: () => void) {
  const trigger = useRef<T>(null)
  const popupClass = `paper-calendar-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!trigger.current?.contains(target) && !target.closest(`.${popupClass}`)) close()
    }
    document.addEventListener('pointerdown', outside, true)
    return () => document.removeEventListener('pointerdown', outside, true)
  }, [open, close, popupClass])
  return { trigger, popupClass }
}
