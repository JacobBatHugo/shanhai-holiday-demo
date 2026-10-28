import type { ReactNode } from 'react'
import './popup-motion.css'

/** Animate content only: rc-trigger must measure a stationary popup for alignment. */
export function paperPopup(content: ReactNode) {
  return <div className="paper-popup-content">{content}</div>
}
