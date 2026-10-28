import { useEffect, useRef, useState } from 'react'
import { Button, DatePicker, Drawer } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { paperPopup } from './shared/components/folio/paperPopup'
import usePaperPopup from './shared/components/folio/usePaperPopup'
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
  const [discard, setDiscard] = useState(false)
  const [touched, setTouched] = useState(false)
  const warning = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLDivElement>(null)
  const sourceDate = mode === 'date' ? source : weekday ? sourceForWeekday(date, weekday) : ''
  const error = sourceError(date, sourceDate, state)
  const courses = error ? [] : baseCourses(sourceDate, state)
  const current = resolveDay(date, state).courses
  const changed = sourceDate !== existing?.sourceDate || mode !== existing?.mode
  const dirty = touched && (!existing || changed)
  const needsReplace = current.length > 0 && sourceDate !== existing?.sourceDate
  const showError = !!error && (attempted || !!sourceDate)
  useEffect(() => { if (confirmReplace) warning.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [confirmReplace])
  function edit() { setTouched(true); setConfirmReplace(false); setAttempted(false); setDiscard(false) }
  function close() { if (dirty) setDiscard(true); else onClose() }
  function save() {
    setAttempted(true)
    if (error) return
    if (needsReplace && !confirmReplace) { setConfirmReplace(true); return }
    onSave(sourceDate, mode)
  }
  return <Drawer open={open} width={480} placement="right" rootClassName="qinglv hd-sheet" destroyOnHidden
    title={<div ref={heading} tabIndex={-1} className="hd-sheet-title"><h2>{existing ? '修改补课' : '安排补课'}</h2><p><strong>{fullDate(date)}</strong><span>第 {weekOf(date)} 周</span></p></div>}
    onClose={close} afterOpenChange={visible => { if (visible) heading.current?.focus(); else afterClose() }}
    footer={<div className="hd-sheet-footer">{discard ? <div className="hd-discard" role="alert"><p>还有未保存的选择，是否放弃？</p><div><Button onClick={() => setDiscard(false)}>继续编辑</Button><Button danger onClick={onClose}>放弃修改</Button></div></div> : <>
      <div className="hd-save-summary">{confirmReplace ? '确认后替换当天现有课程' : courses.length ? `将安排 ${courses.length} 个课程时段` : '选择来源后即可预览课程'}</div>
      <div className="hd-footer-actions">{existing ? <button className="hd-text-action" onClick={onRemove}>撤销补课</button> : <Button onClick={close}>取消</Button>}<Button type="primary" onClick={save} disabled={!!existing && !changed}>{confirmReplace ? '确认替换' : '保存补课'}</Button></div>
    </>}</div>}>
    <section className="hd-source-section"><h3>补哪天的课</h3>
      <div className="hd-segment" role="group" aria-label="补课来源方式">
        <button aria-pressed={mode === 'weekday'} onClick={() => { edit(); setMode('weekday') }}>同周星期</button>
        <button aria-pressed={mode === 'date'} onClick={() => { edit(); setMode('date') }}>指定日期</button>
      </div>
      {mode === 'weekday' ? <><p className="hd-field-note">第 {weekOf(date)} 周 · {shortDate(sourceForWeekday(date, 1))}—{shortDate(sourceForWeekday(date, 7))}</p>
        <div className="hd-weekdays" role="group" aria-label="选择补课星期">{DAYS.map((name, i) => <button key={name} aria-pressed={weekday === i + 1} disabled={weekdayOf(date) === i + 1}
          onClick={() => { edit(); setWeekday(i + 1) }}>{name}</button>)}</div></> : <div className="hd-date-field"><label htmlFor="hd-source-date">来源日期</label><SourcePicker source={source} invalid={showError} onChange={value => { if (source !== value) edit(); setSource(value) }} /><p className="hd-field-note">可以选择本学期其他周的日期。</p></div>}
      {showError && <p className="hd-error" id="hd-source-error" role="alert">{error}</p>}
    </section>
    {courses.length > 0 && <section className="hd-preview" aria-label="补课预览"><header><span>{fullDate(sourceDate)}</span><small>第 {weekOf(sourceDate)} 周</small></header><CourseList courses={courses} />
      <p className="hd-field-note">按这一天的原排课补课，后续修改会同步。</p>
    </section>}
    {confirmReplace && <div className="hd-replace" role="alert" ref={warning}><strong>将替换当天 {current.length} 个课程时段</strong><p>{current.map(course => course.name).join('、')}</p><small>撤销补课可恢复原来的课程。</small></div>}
    {existing && !changed && <p className="hd-field-note">当前补课安排已保存，可修改来源或撤销。</p>}
  </Drawer>
}
