import { useEffect, useRef, useState } from 'react'
import { Button, DatePicker, Modal } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { paperPopup } from './shared/components/folio/paperPopup'
import usePaperPopup from './shared/components/folio/usePaperPopup'
import CamelliaSprig from './CamelliaSprig'
import { baseCourses, DAYS, fullDate, PERIODS, shortDate, sourceError, sourceForWeekday, TERM_END, TERM_START, weekOf, weekdayOf, validDate, resolveDay } from './model'
import type { Course, SourceMode, State } from './model'

export function CourseList({ courses }: { courses: Course[] }) {
  return <ul className="hd-course-list">{courses.map(course => <li key={course.id}>
    <span className="hd-course-time"><b>{course.start}–{course.end}<small>节</small></b><span>{PERIODS[course.start - 1][0]}</span></span>
    <span className="hd-course-copy"><strong>{course.name}</strong><small>{course.room} · {course.teacher}</small></span>
  </li>)}</ul>
}

function SourcePicker({ source, invalid, onChange }: { source: string; invalid: boolean; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Dayjs | null>(() => validDate(source) ? dayjs(source) : null)
  const { trigger, popupClass } = usePaperPopup(open, () => setOpen(false))
  return <span ref={trigger} className="hd-date-control" onInputCapture={event => {
    const raw = (event.target as HTMLInputElement).value
    onChange(raw)
    // Keep the picker value in sync before blur can commit its previous selection.
    if (validDate(raw)) setPicked(dayjs(raw))
  }}>
    <DatePicker id="hd-source-date" aria-label="来源日期" aria-invalid={invalid} aria-describedby={invalid ? 'hd-source-error' : undefined} status={invalid ? 'error' : undefined} open={open} onOpenChange={setOpen} value={picked}
      minDate={dayjs(TERM_START)} maxDate={dayjs(TERM_END)} defaultPickerValue={dayjs('2026-10-01')}
      placeholder="年-月-日" format="YYYY-MM-DD" preserveInvalidOnBlur allowClear={false}
      transitionName="" panelRender={paperPopup} classNames={{ popup: { root: `qinglv scholar-popup ${popupClass}` } }}
      onKeyDown={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false) } }}
      onChange={value => { setPicked(value); onChange(value?.format('YYYY-MM-DD') ?? '') }}
      onBlur={event => {
        // rc-picker also reports focus leaving its panel; that target is not an input.
        if (!(event.target instanceof HTMLInputElement)) return
        const raw = event.target.value.trim()
        onChange(raw)
        if (validDate(raw)) setPicked(dayjs(raw))
      }}
    />
  </span>
}

export default function MakeupSheet({ date, state, open, onSave, onRemove, onClose, afterClose }: {
  date: string; state: State; open: boolean; onSave: (source: string, mode: SourceMode) => void
  onRemove: () => void; onClose: () => void; afterClose: () => void
}) {
  const existing = state.makeups[date]
  const [mode, setMode] = useState<SourceMode>(existing?.mode ?? 'weekday')
  const [source, setSource] = useState(existing?.sourceDate ?? '')
  const [weekday, setWeekday] = useState(existing?.mode === 'weekday' ? weekdayOf(existing.sourceDate) : 0)
  const [attempted, setAttempted] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const warning = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLDivElement>(null)
  const sourceDate = mode === 'date' ? source : weekday ? sourceForWeekday(date, weekday) : ''
  const error = sourceError(date, sourceDate, state)
  const courses = error ? [] : baseCourses(sourceDate, state)
  const current = resolveDay(date, state).courses
  const changed = sourceDate !== existing?.sourceDate || mode !== existing?.mode
  const needsReplace = current.length > 0 && sourceDate !== existing?.sourceDate
  const showError = !!error && (attempted || !!sourceDate)
  useEffect(() => { if (confirmReplace) warning.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [confirmReplace])
  function edit() { setConfirmReplace(false); setAttempted(false) }
  function save() {
    setAttempted(true)
    if (error) return
    if (needsReplace && !confirmReplace) { setConfirmReplace(true); return }
    onSave(sourceDate, mode)
  }
  return <Modal open={open} width={480} centered rootClassName="qinglv folio hd-dialog hd-form-dialog hd-sheet" destroyOnHidden
    transitionName="" maskTransitionName="" closable={{ 'aria-label': '关闭' }} focusTriggerAfterClose={false}
    title={<div ref={heading} tabIndex={-1} className="hd-sheet-title"><span className="hd-sheet-eyebrow">调 休 笺</span><h2>{existing ? '修改补课' : '设置补课'}</h2><CamelliaSprig /></div>}
    onCancel={onClose} afterClose={afterClose} afterOpenChange={visible => { if (visible) heading.current?.focus() }}
    footer={<div className="hd-sheet-footer">
      <div className="hd-save-summary">{confirmReplace ? '确认替换当天课程' : existing && !changed ? '已保存' : courses.length ? `${courses.length} 个时段` : '尚未选择来源'}</div>
      <div className="hd-footer-actions">{existing ? <button data-review-id="makeup-remove" className="hd-text-action" onClick={onRemove}>撤销补课</button> : <Button data-review-id="makeup-cancel" onClick={onClose}>取消</Button>}<Button data-review-id="makeup-save" type="primary" onClick={save} disabled={!!existing && !changed}>{confirmReplace ? '确认替换' : '保存补课'}</Button></div>
    </div>}>
    <div className="hd-target-summary"><span>补课日期</span><strong>{shortDate(date)}<small>{DAYS[weekdayOf(date) - 1]} · 第 {weekOf(date)} 周</small></strong></div>
    <section className="hd-source-section"><div className="hd-section-title"><h3>补哪天的课</h3></div>
      <div className="hd-segment" role="group" aria-label="补课来源方式">
        <button data-review-id="makeup-source-weekday" aria-pressed={mode === 'weekday'} onClick={() => { edit(); setMode('weekday') }}>同周星期</button>
        <button data-review-id="makeup-source-date" aria-pressed={mode === 'date'} onClick={() => { edit(); setMode('date') }}>指定日期</button>
      </div>
      <div className="hd-source-controls">{mode === 'weekday' ? <><p className="hd-field-note">{shortDate(sourceForWeekday(date, 1))}—{shortDate(sourceForWeekday(date, 7))}</p>
        <div className="hd-weekdays" role="group" aria-label="选择补课星期">{DAYS.map((name, i) => <button key={name} data-review-id={`makeup-weekday-${i + 1}`} aria-pressed={weekday === i + 1} disabled={weekdayOf(date) === i + 1}
          onClick={() => { edit(); setWeekday(i + 1) }}>{name}</button>)}</div></> : <div className="hd-date-field"><label htmlFor="hd-source-date">来源日期 · 本学期内</label><SourcePicker source={source} invalid={showError} onChange={value => { if (source !== value) edit(); setSource(value) }} /></div>}</div>
      <div className="hd-source-message">{showError && <p className="hd-error" id="hd-source-error" role="alert">{error}</p>}</div>
    </section>
    {!error && <section className="hd-preview" aria-label="补课预览"><div className="hd-section-title"><h3>课程预览</h3><span>{courses.length} 个时段</span></div><header><span>{fullDate(sourceDate)}</span><small>第 {weekOf(sourceDate)} 周</small></header><CourseList courses={courses} />
      <p className="hd-field-note">读取原排课，随来源更新。</p>
    </section>}
    {confirmReplace && <div className="hd-replace" role="alert" ref={warning}><strong>将替换当天 {current.length} 个课程时段</strong><p>{current.map(course => course.name).join('、')}</p><small>撤销补课可恢复原来的课程。</small></div>}
  </Modal>
}
