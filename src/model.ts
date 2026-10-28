// Independent, in-memory fixtures. No production API, store, or browser persistence.
export const TERM_START = '2026-08-31'
export const TOTAL_WEEKS = 20
export const TERM_END = '2027-01-17'
export const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const HOLIDAYS = ['元旦', '春节', '清明节', '劳动节', '端午节', '中秋节', '国庆节'] as const
export const PERIODS = [
  ['08:00', '08:45'], ['08:55', '09:40'], ['10:00', '10:45'], ['10:55', '11:40'],
  ['14:00', '14:45'], ['14:55', '15:40'], ['16:00', '16:45'], ['16:55', '17:40'],
]
const DAY_MS = 86_400_000
export function validDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date + 'T00:00:00Z')) &&
    new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date
}
export function addDays(date: string, days: number): string {
  if (!validDate(date)) return ''
  return new Date(Date.parse(date + 'T00:00:00Z') + days * DAY_MS).toISOString().slice(0, 10)
}
export const inTerm = (date: string) => validDate(date) && date >= TERM_START && date <= TERM_END
export const weekOf = (date: string) => Math.floor((Date.parse(date + 'T00:00:00Z') - Date.parse(TERM_START + 'T00:00:00Z')) / DAY_MS / 7) + 1
export const weekdayOf = (date: string) => (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7 + 1
export const weekDates = (week: number) => Array.from({ length: 7 }, (_, i) => addDays(TERM_START, (week - 1) * 7 + i))
export const shortDate = (date: string) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`
export const fullDate = (date: string) => `${shortDate(date)} ${DAYS[weekdayOf(date) - 1]}`
export const sourceForWeekday = (target: string, weekday: number) => inTerm(target) && weekday >= 1 && weekday <= 7 ? addDays(target, weekday - weekdayOf(target)) : ''

export type HolidayEvent = { id: string; name: string; dates: string[] }
export const holidayEvents: HolidayEvent[] = [
  { id: '2026-mid-autumn', name: '中秋节', dates: ['2026-09-25', '2026-09-26', '2026-09-27'] },
  { id: '2026-national-day', name: '国庆节', dates: Array.from({ length: 7 }, (_, i) => addDays('2026-10-01', i)) },
]
export const makeupDates = ['2026-09-20', '2026-10-10']
export const holidayAt = (date: string, events = holidayEvents) => events.find(event => event.dates.includes(date))
export type SourceMode = 'weekday' | 'date'
export type Makeup = { sourceDate: string; mode: SourceMode }
export type State = {
  enabled: boolean
  restored: string[]
  makeups: Record<string, Makeup>
  weekendOriginal: boolean
  sourceRoomUpdated: boolean
  years: Record<string, 'ready' | 'missing' | 'stale'>
}
export const initialState = (): State => ({
  enabled: false, restored: [], makeups: {}, weekendOriginal: false, sourceRoomUpdated: false,
  years: { '2026': 'ready', '2027': 'missing' },
})
export type Course = { id: string; name: string; teacher: string; room: string; start: number; end: number; date: string; cadence: string }
const regular = [
  { day: 1, name: '自动控制原理', teacher: '沈老师', room: '知行楼 A203', start: 1, end: 2 },
  { day: 1, name: '计算机基础', teacher: '林老师', room: '实验楼 C105', start: 5, end: 6 },
  { day: 2, name: '工程力学', teacher: '陈老师', room: '知行楼 A205', start: 3, end: 4 },
  { day: 3, name: '高等数学', teacher: '吴老师', room: '文理楼 B201', start: 1, end: 2 },
  { day: 3, name: '大学英语', teacher: '周老师', room: '文理楼 B306', start: 7, end: 8 },
  { day: 4, name: '机械设计基础', teacher: '徐老师', room: '知行楼 A202', start: 3, end: 4 },
  { day: 4, name: '电路分析', teacher: '陆老师', room: '实验楼 C105', start: 5, end: 6 },
  { day: 5, name: '线性代数', teacher: '吴老师', room: '文理楼 B201', start: 1, end: 2 },
  { day: 5, name: '体育', teacher: '程老师', room: '体育馆', start: 5, end: 6 },
]
export function baseCourses(date: string, state: Pick<State, 'weekendOriginal' | 'sourceRoomUpdated'>): Course[] {
  if (!inTerm(date)) return []
  const day = weekdayOf(date)
  const result: Course[] = regular.filter(course => course.day === day).map(course => ({
    ...course, id: `${date}-${course.start}`, date, cadence: '每周',
    room: state.sourceRoomUpdated && course.name === '工程力学' ? '知行楼 A302' : course.room,
  }))
  if (day === 2) result.push({ id: `${date}-5`, date, start: 5, end: 6, teacher: '陆老师', room: '实验楼 C105',
    name: weekOf(date) % 2 ? '电路分析' : '电路实验', cadence: weekOf(date) % 2 ? '单周' : '双周' })
  if (day === 6 && state.weekendOriginal) result.push({ id: `${date}-7`, date, start: 7, end: 8, name: '程序设计实践', teacher: '李老师', room: '实验楼 C206', cadence: '每周' })
  return result
}
export type Resolved = { status: 'normal' | 'holiday' | 'restored' | 'pending' | 'makeup' | 'missing'; courses: Course[]; holiday?: HolidayEvent; sourceDate?: string }
export function resolveDay(date: string, state: State): Resolved {
  const courses = baseCourses(date, state)
  if (!state.enabled) return { status: 'normal', courses }
  const holiday = holidayAt(date)
  if (state.restored.includes(date)) return { status: 'restored', courses, holiday }
  const makeup = state.makeups[date]
  if (makeup) return { status: 'makeup', sourceDate: makeup.sourceDate,
    courses: baseCourses(makeup.sourceDate, state).map(course => ({ ...course, date, id: `${date}-from-${course.id}` })) }
  if (state.years[date.slice(0, 4)] === 'missing' || !state.years[date.slice(0, 4)]) return { status: 'missing', courses }
  if (holiday) return { status: 'holiday', courses: [], holiday }
  return { status: makeupDates.includes(date) ? 'pending' : 'normal', courses }
}
export function restoreHoliday(state: State, date: string, scope: 'day' | 'event', events = holidayEvents): State {
  const holiday = holidayAt(date, events)
  if (!state.enabled || !holiday) return state
  // Exact event membership, never matching by display name or by year alone.
  const dates = (scope === 'day' ? [date] : holiday.dates).filter(inTerm)
  return { ...state, restored: [...new Set([...state.restored, ...dates])] }
}
// Use the largest free run, nearest the day's centre when runs tie. Never cover a course.
export function makeupEntrySlot(courses: Pick<Course, 'start' | 'end'>[]): [number, number] | null {
  const gaps: [number, number][] = []
  let start = 0
  for (let period = 1; period <= PERIODS.length + 1; period++) {
    const free = period <= PERIODS.length && !courses.some(course => period >= course.start && period <= course.end)
    if (free && !start) start = period
    if (!free && start) { gaps.push([start, period - 1]); start = 0 }
  }
  return gaps.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]) || Math.abs(a[0] + a[1] - 9) - Math.abs(b[0] + b[1] - 9))[0] ?? null
}
export function sourceError(target: string, source: string, state: State): string {
  if (!source) return '请选择要补哪天的课。'
  if (!validDate(source)) return '请输入有效日期，如 2026-10-06。'
  if (!inTerm(source)) return '请选择本学期内的日期。'
  if (target === source) return '不能选择补课当天，请换一个日期。'
  if (!baseCourses(source, state).length) return '这一天没有课程，请重新选择。'
  return ''
}
export function saveMakeup(state: State, target: string, sourceDate: string, mode: SourceMode): State {
  const error = sourceError(target, sourceDate, state)
  if (error || !makeupDates.includes(target)) throw new Error(error || '该日期不是示例调休日。')
  return { ...state, makeups: { ...state.makeups, [target]: { sourceDate, mode } } }
}
export function removeMakeup(state: State, date: string): State {
  const makeups = { ...state.makeups }; delete makeups[date]
  return { ...state, makeups }
}
export function visibleDays(week: number, state: State): number {
  if (!state.enabled) return 5
  return Math.max(5, ...weekDates(week).filter(date => makeupDates.includes(date) || !!state.makeups[date]).map(weekdayOf))
}
