import { useEffect } from 'react'

// Keep paper dialogs inside the visible screen when the mobile keyboard opens.
export default function useDialogViewport() {
  useEffect(() => {
    const viewport = window.visualViewport
    const root = document.documentElement
    const update = () => {
      root.style.setProperty('--hd-visible-height', `${viewport?.height ?? window.innerHeight}px`)
      root.style.setProperty('--hd-visible-top', `${viewport?.offsetTop ?? 0}px`)
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      root.style.removeProperty('--hd-visible-height')
      root.style.removeProperty('--hd-visible-top')
    }
  }, [])
}
