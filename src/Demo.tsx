import { useCallback, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Button, Checkbox, ConfigProvider, Modal } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import { buildQinglvTheme } from './shared/components/schedule/qinglv/qinglvTheme'
import { nightAntdTheme } from './shared/appearance/antdTheme'
import WeekRuler from './shared/components/schedule/qinglv/WeekRuler'
import VoyageLandscape from './shared/components/schedule/qinglv/VoyageLandscape'
import headingStyles from './shared/components/schedule/qinglv/ScheduleHeading.module.css'
import FolioHeading from './shared/components/folio/FolioHeading'
import MakeupSheet, { CourseList } from './MakeupSheet'
import HolidayCard, { HolidayFace } from './HolidayCard'
import useDialogViewport from './useDialogViewport'
import Feedback from './Feedback'
import ReviewMode from './ReviewMode'
import type { Notice } from './Feedback'
import { DAYS, HOLIDAYS, PERIODS, TOTAL_WEEKS, fullDate, holidayAt, initialState, makeupEntrySlot, removeMakeup, resolveDay, restoreHoliday, saveMakeup, shortDate, visibleDays, weekDates } from './model'
import type { Course, State } from './model'

const SCENES = [
  ['initial', '初始设置'], ['holiday', '国庆假期'], ['makeup', '调休补课'], ['replace', '当天已有课'], ['missing', '跨年数据缺失'], ['stale', '年历更新失败'],
] as const
type Scene = typeof SCENES[number][0]

function Settings({ enabled, onSave, onClose }: { enabled: boolean; onSave: (value: boolean) => void; onClose: () => void }) {
  const [checked, setChecked] = useState(enabled)
  return <Modal open centered transitionName="" maskTransitionName="" width={560} onCancel={onClose} closable={{ 'aria-label': '关闭' }} rootClassName="qinglv folio hd-dialog hd-form-dialog hd-settings"
    title={<FolioHeading title="课表设置" />} footer={<><Button onClick={onClose}>取消</Button><Button type="primary" onClick={() => onSave(checked)}>保存设置</Button></>}>
    <section className="hd-setting-option"><Checkbox checked={checked} onChange={event => setChecked(event.target.checked)}>按节假日自动调整</Checkbox>
      <p>{checked ? '放假日自动停课，调休补课由你设置。' : '按原课表显示，已设置的调整会保留。'}</p>
    </section>
  </Modal>
}

export default function Demo() {
  useDialogViewport()
  const [state, setState] = useState<State>(initialState)
  const [week, setWeek] = useState(5)
  const [scene, setScene] = useState<Scene>('initial')
  const [dark, setDark] = useState(false)
  const [settings, setSettings] = useState(false)
  const [gallery, setGallery] = useState(false)
  const [restoreDate, setRestoreDate] = useState<string | null>(null)
  const [lastRestore, setLastRestore] = useState('2026-10-01')
  const [makeupDate, setMakeupDate] = useState<string | null>(null)
  const [makeupOpen, setMakeupOpen] = useState(false)
  const [makeupSession, setMakeupSession] = useState(0)
  const [detail, setDetail] = useState<{ course: Course; source?: string } | null>(null)
  const [feedback, setFeedback] = useState<Notice | null>(null)
  const dismissFeedback = useCallback((notice: Notice) => setFeedback(current => current === notice ? null : current), [])
  const grid = useRef<HTMLDivElement>(null)
  const settingsButton = useRef<HTMLButtonElement>(null)
  const restoreChoice = useRef<HTMLButtonElement>(null)
  const dates = weekDates(week).slice(0, visibleDays(week, state))
  const resolved = dates.map(date => resolveDay(date, state))
  const holiday = holidayAt(restoreDate ?? lastRestore)!
  const missingYears = [...new Set(dates.filter((_, i) => resolved[i].status === 'missing').map(date => date.slice(0, 4)))]
  const stale = state.enabled && dates.some(date => state.years[date.slice(0, 4)] === 'stale')
  const totalCourses = resolved.reduce((sum, day) => sum + day.courses.length, 0)
  const daysOff = resolved.filter(day => day.status === 'holiday').length
  function change(next: State, message: string, undo = true) { setFeedback({ message, previous: undo ? state : undefined, date: makeupOpen ? makeupDate ?? undefined : undefined }); setState(next) }
  function undoFeedback(notice: Notice) {
    if (notice.previous) setState(notice.previous)
    setFeedback(null)
    if (notice.date) focusDate(notice.date)
    else requestAnimationFrame(() => settingsButton.current?.focus())
  }
  function focusDate(date: string) { requestAnimationFrame(() => (document.querySelector<HTMLElement>(`[data-date-action="${date}"]`) ?? document.querySelector<HTMLElement>(`[data-date-heading="${date}"]`))?.focus()) }
  function openMakeup(date: string) { setFeedback(null); setMakeupDate(date); setMakeupSession(value => value + 1); setMakeupOpen(true) }
  function chooseScene(next: Scene) {
    const sample = initialState()
    sample.enabled = next !== 'initial'
    sample.weekendOriginal = next === 'replace'
    if (next === 'stale') sample.years['2026'] = 'stale'
    setState(sample); setFeedback(null); setScene(next)
    setWeek(next === 'missing' ? 18 : next === 'makeup' || next === 'replace' ? 6 : 5)
    requestAnimationFrame(() => {
      if (!grid.current) return
      grid.current.scrollLeft = next === 'makeup' || next === 'replace' ? grid.current.scrollWidth : next === 'holiday' || next === 'stale' ? 380 : 0
    })
  }
  const theme = buildQinglvTheme()
  return <ConfigProvider locale={zhCN} theme={dark ? nightAntdTheme(theme) : theme}>
    <div className="qinglv hd-app">
      <header className="hd-nav"><a href="#hd-main" className="hd-brand"><svg viewBox="0 0 32 24" aria-hidden="true"><path d="M2 21 11 5l6 10 5-7 8 13H2ZM9 8l3 3 2-1M21 4l2-2" /></svg>山海课表</a><div><span className="hd-demo-label">交互预览</span><button className="hd-theme" aria-label={dark ? '切换日间模式' : '切换夜间模式'} onClick={() => { document.documentElement.dataset.theme = dark ? 'light' : 'dark'; setDark(!dark) }}>{dark ? '日间' : '夜间'}</button></div></header>
      <div className="hd-demo-tools"><label htmlFor="hd-scene">预览场景</label><select id="hd-scene" value={scene} onChange={event => chooseScene(event.target.value as Scene)}>{SCENES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button onClick={() => setGallery(true)}>节日卡片</button><button onClick={() => chooseScene(scene)}>重置示例</button><ReviewMode context={`${SCENES.find(([value]) => value === scene)![1]}；第 ${week} 周；${dark ? '夜间' : '日间'}；自动调整${state.enabled ? '开启' : '关闭'}`} /><span>虚构课表 · 刷新重置</span></div>
      <main id="hd-main" className="hd-main">
        <div className={headingStyles.breadcrumb}><span>我的课表</span><span>/</span><span>学期课表</span></div>
        <section className={headingStyles.heading} aria-label="学期信息"><VoyageLandscape week={week} total={TOTAL_WEEKS} currentWeek={5} /><div className={headingStyles.copy}><h1>大学 · 大三 · 上学期</h1><p>2026—2027 学年<i>·</i>20 周<i>·</i>开始 08/31</p></div><span className={headingStyles.milestone}>航程<b>{String(week).padStart(2, '0')}</b><small>/ 20 周</small></span></section>
        <div className="hd-feedback-slot">
          {feedback && !settings && !restoreDate && !detail && !gallery && !makeupOpen && <Feedback notice={feedback} onDismiss={dismissFeedback} onUndo={() => undoFeedback(feedback)} />}
        </div>
        <div className="hd-toolbar"><WeekRuler week={week} total={TOTAL_WEEKS} currentWeek={5} dateRange={`${dates[0].slice(5).replace('-', '/')} — ${dates.at(-1)!.slice(5).replace('-', '/')}`} onChange={value => { setWeek(value); setFeedback(null) }} /><div className="hd-toolbar-right"><span className="hd-enabled" data-enabled={state.enabled}>{state.enabled ? '已按节假日调整' : '原课表'}</span><Button ref={settingsButton} onClick={() => setSettings(true)}>课表设置</Button></div></div>
        {missingYears.length > 0 && <div className="hd-data-notice" role="status">{missingYears.join('、')} 年节假日数据暂不可用，相关日期按原课表显示。</div>}
        {stale && <div className="hd-data-notice" role="status">年历暂时无法更新，继续使用已有的节假日安排。</div>}
        <div className="hd-week-summary"><span>本周 {totalCourses} 个课程时段{daysOff > 0 ? ` · ${daysOff} 天放假` : ''}</span>{dates.length > 5 && <span>本周含调休，临时展开周末</span>}</div>
        <div className="hd-grid-scroll" ref={grid} tabIndex={0} aria-label="课表，可横向滚动查看其他日期">
          <div className="hd-grid" style={{ '--days': dates.length } as CSSProperties}>
            <div className="hd-axis-head">节次 / 时间</div>
            {dates.map((date, i) => <div key={date} className="hd-day-head" data-date-heading={date} tabIndex={-1} aria-label={fullDate(date)} style={{ gridColumn: i + 2 }}><span>{DAYS[i]}<small>{date.slice(5).replace('-', '/')}</small></span>
              {resolved[i].status === 'makeup' && <button data-date-action={date} onClick={() => openMakeup(date)}>补 {resolved[i].sourceDate!.slice(5).replace('-', '/')} 的课 <span aria-hidden="true">↗</span></button>}
            </div>)}
            {PERIODS.map(([start, end], i) => <div key={start} className={`hd-axis ${i >= 4 ? 'hd-afternoon' : ''}`} style={{ gridColumn: 1, gridRow: i + 2 }}><b>{'一二三四五六七八'[i]}</b><span>{start}<br />{end}</span></div>)}
            {dates.flatMap((date, dayIndex) => PERIODS.map((_, p) => <div className={`hd-cell ${p >= 4 ? 'hd-afternoon' : ''}`} aria-hidden="true" key={`${date}-${p}`} style={{ gridColumn: dayIndex + 2, gridRow: p + 2 }} />))}
            {dates.map((date, i) => resolved[i].status === 'holiday' ? <HolidayCard data-date-action={date} key={date} name={resolved[i].holiday!.name} aria-label={`${fullDate(date)}，${resolved[i].holiday!.name}，恢复上课`} style={{ gridColumn: i + 2, gridRow: '2 / 10' }} onClick={() => { setLastRestore(date); setRestoreDate(date) }} /> : resolved[i].courses.map(course => <button className="hd-course" key={course.id} style={{ gridColumn: i + 2, gridRow: `${course.start + 1} / ${course.end + 2}` }} aria-label={`${fullDate(date)} ${course.name} 第${course.start}至${course.end}节`} onClick={() => setDetail({ course, source: resolved[i].sourceDate })}><strong>{course.name}</strong><span>{course.teacher}</span><span>{course.room}</span><small>{resolved[i].status === 'makeup' ? '调休补课' : course.cadence}</small></button>))}
            {dates.map((date, i) => {
              if (resolved[i].status !== 'pending') return null
              const slot = makeupEntrySlot(resolved[i].courses)
              return <button key={`makeup-${date}`} className="hd-makeup-entry" data-date-action={date} data-compact={!!slot && slot[0] === slot[1]} style={{ gridColumn: i + 2, gridRow: slot ? `${slot[0] + 1} / ${slot[1] + 2}` : '10' }} onClick={() => openMakeup(date)}><span aria-hidden="true">＋</span>设置补课</button>
            })}
          </div>
        </div>
        <footer className="hd-page-footer"><span>日程有序，所学皆有所得。</span><details><summary>示例工具</summary><button onClick={() => { setState({ ...state, sourceRoomUpdated: !state.sourceRoomUpdated }); setFeedback(null) }}>工程力学教室：{state.sourceRoomUpdated ? 'A302' : 'A205'} · 点击变更</button><p>用于检查补课是否同步来源排课。</p></details></footer>
      </main>
      {settings && <Settings enabled={state.enabled} onClose={() => { setSettings(false); requestAnimationFrame(() => settingsButton.current?.focus()) }} onSave={value => { change({ ...state, enabled: value }, value ? '已开启节假日自动调整' : '已暂停调整，设置仍保留'); setSettings(false); requestAnimationFrame(() => settingsButton.current?.focus()) }} />}
      <Modal open={restoreDate !== null} centered transitionName="" maskTransitionName="" width={440} rootClassName="qinglv hd-dialog hd-restore-dialog" title="恢复上课？" footer={null} onCancel={() => setRestoreDate(null)} focusTriggerAfterClose={false} afterClose={() => focusDate(lastRestore)} afterOpenChange={visible => { if (visible) restoreChoice.current?.focus() }}>
        <p className="hd-restore-description">按原课表恢复所选范围内的课程。</p>
        <p className="hd-holiday-context">{holiday.name}</p>
        <div className="hd-restore-choices"><button ref={restoreChoice} onClick={() => { change(restoreHoliday(state, lastRestore, 'day'), `${shortDate(lastRestore)}已恢复上课`, false); setRestoreDate(null) }}><strong>仅恢复当天</strong><span>{fullDate(lastRestore)}</span><i aria-hidden="true">↗</i></button>
          <button onClick={() => { change(restoreHoliday(state, lastRestore, 'event'), `${holiday.name}本次假期已恢复上课`, false); setRestoreDate(null) }}><strong>恢复本次假期</strong><span>{shortDate(holiday.dates[0])}—{shortDate(holiday.dates.at(-1)!)} · {holiday.dates.length} 天</span><i aria-hidden="true">↗</i></button>
          <button className="hd-cancel" onClick={() => setRestoreDate(null)}>取消</button>
        </div>
      </Modal>
      {makeupDate && <MakeupSheet key={makeupSession} date={makeupDate} state={state} open={makeupOpen} onClose={() => setMakeupOpen(false)} afterClose={() => focusDate(makeupDate)}
        onSave={(source, mode) => { change(saveMakeup(state, makeupDate, source, mode), `${shortDate(makeupDate)}已安排补课`); setMakeupOpen(false) }}
        onRemove={() => { change(removeMakeup(state, makeupDate), '已撤销补课，恢复当天原课表'); setMakeupOpen(false) }} />}
      <Modal open={!!detail} transitionName="" maskTransitionName="" width={420} rootClassName="qinglv hd-dialog hd-detail-dialog" title={detail?.course.name} footer={<Button onClick={() => setDetail(null)}>知道了</Button>} onCancel={() => setDetail(null)}>
        {detail && <><p className="hd-detail-date">{fullDate(detail.course.date)}{detail.source && <span>调休补课</span>}</p><CourseList courses={[detail.course]} />{detail.source && <p className="hd-detail-source">补 {fullDate(detail.source)} 的课</p>}</>}
      </Modal>
      <Modal open={gallery} transitionName="" maskTransitionName="" width={960} rootClassName="qinglv hd-dialog hd-gallery-dialog" title="七节题签" onCancel={() => setGallery(false)} footer={<Button onClick={() => setGallery(false)}>收起图鉴</Button>}>
        <p className="hd-gallery-note">同一纸面，七种节令。此处仅对照卡片纹样，不改变示例学期与年历。</p>
        <div className="hd-holiday-gallery">{HOLIDAYS.map(name => <div className="hd-holiday" data-holiday={name} key={name}><HolidayFace name={name} /></div>)}</div>
      </Modal>
      <span className="hd-sr-only" aria-live="polite">{state.enabled ? '节假日自动调整已开启' : '节假日自动调整已关闭'}</span>
    </div>
  </ConfigProvider>
}
