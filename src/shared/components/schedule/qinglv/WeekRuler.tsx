import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Popover } from 'antd'


/** 周签导航，周次与日期由真实课表提供。 */
export default function WeekRuler({ week, total, currentWeek, dateRange, onChange, disabled = false }: {
  week: number
  total: number
  currentWeek: number
  disabled?: boolean
  dateRange: string
  onChange: (week: number) => void
}) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const spectrum = useRef<HTMLDivElement>(null)
  const chineseWeek = (n: number) => n < 10 ? '一二三四五六七八九'[n - 1] : n === 10 ? '十' : n < 20 ? '十' + '一二三四五六七八九'[n - 11] : n === 20 ? '二十' : '二十' + '一二三四五六七八九'[n - 21]
  const weeks = Array.from({ length: total }, (_, i) => i + 1)
  const progress = total > 1 ? Math.max(0, Math.min(1, (week - 1) / (total - 1))) : 0
  function close() {
    setOpen(false)
    trigger.current?.focus()
  }
  return <nav className="weekRuler weekLeaf weekReference" aria-label="周次导航">
    <span className="weekLabel" aria-hidden="true">周序</span>
    <button className="leafArrow previous" aria-label="上一周" disabled={disabled || week <= 1} onClick={() => onChange(week - 1)}>
      <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m11 5-4 4 4 4"/></svg>
    </button>
    <Popover trigger="click" placement="bottomLeft" open={!disabled && open} onOpenChange={setOpen}
      classNames={{ root: 'qinglv weekSpectrumPopup' }}
      afterOpenChange={visible => {
        if (visible) spectrum.current?.querySelector<HTMLButtonElement>(`[data-week="${week}"]`)?.focus()
      }}
      content={<div className="weekSpectrum" ref={spectrum} role="dialog" aria-label="选择周次"
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
          const focused = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-week]')
          if (!focused) return
          const current = Number(focused.dataset.week)
          const next = { ArrowLeft: current - 1, ArrowRight: current + 1, ArrowUp: current - 5,
            ArrowDown: current + 5, Home: 1, End: total }[event.key]
          if (next === undefined) return
          event.preventDefault()
          spectrum.current?.querySelector<HTMLButtonElement>(`[data-week="${Math.min(total, Math.max(1, next))}"]`)?.focus()
        }}>
        <div className="spectrumHeading"><span>选择周次</span><small>共 {total} 周</small></div>
        <div className="spectrumWeeks">{weeks.map(value => <button key={value} data-week={value}
          aria-label={`第 ${value} 周`} aria-pressed={value === week}
          onClick={() => { onChange(value); close() }}>{value}</button>)}</div>
        <div className="spectrumFoot"><button onClick={() => { onChange(Math.max(1, Math.min(currentWeek, total))); close() }}>回到本周</button></div>
      </div>}>
      <button disabled={disabled} ref={trigger} className="leafPage" aria-label={`选择周次，当前第 ${week} 周，共 ${total} 周，${dateRange}`}
        aria-haspopup="dialog" aria-expanded={open}
        onKeyDown={event => {
          const next = { ArrowLeft: week - 1, ArrowRight: week + 1, Home: 1, End: total }[event.key]
          if (next !== undefined) { event.preventDefault(); onChange(Math.min(total, Math.max(1, next))) }
          if (event.key === 'Escape' && open) { event.preventDefault(); close() }
        }}>
        <span className="weekSignature" aria-hidden="true"><i style={{ '--week-progress': `${progress * 100}%` } as CSSProperties}/><strong>第{chineseWeek(week)}周</strong><small>{dateRange}</small></span>
      </button>
    </Popover>
    <button className="leafArrow next" aria-label="下一周" disabled={disabled || week >= total} onClick={() => onChange(week + 1)}>
      <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m7 5 4 4-4 4"/></svg>
    </button>

  </nav>
}
