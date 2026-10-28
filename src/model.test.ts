import { describe, expect, it } from 'vitest'
import { baseCourses, initialState, resolveDay, restoreHoliday, resumeHoliday, saveMakeup, removeMakeup, sourceForWeekday, sourceError, validDate, visibleDays, weekOf } from './model'

const enabled = () => ({ ...initialState(), enabled: true })
describe('holiday and makeup decisions', () => {
  it('defaults off and resumes saved adjustments after toggling', () => {
    expect(initialState().enabled).toBe(false)
    const saved = saveMakeup(enabled(), '2026-10-10', '2026-10-06', 'weekday')
    expect(resolveDay('2026-10-10', { ...saved, enabled: false }).status).toBe('normal')
    expect(resolveDay('2026-10-10', saved).status).toBe('makeup')
    expect(saved.makeups['2026-10-10'].sourceDate).toBe('2026-10-06')
  })
  it('restores only the chosen day and can put it back on holiday', () => {
    const restored = restoreHoliday(enabled(), '2026-10-02', 'day')
    expect(resolveDay('2026-10-02', restored).status).toBe('restored')
    expect(resolveDay('2026-10-01', restored).courses).toHaveLength(0)
    expect(resolveDay('2026-10-02', resumeHoliday(restored, '2026-10-02')).status).toBe('holiday')
  })
  it('restores exact holiday event membership across weeks, not makeup dates or other years', () => {
    const events = [
      { id: 'a', name: '国庆节', dates: ['2026-10-01', '2026-10-02', '2026-10-07'] },
      { id: 'b', name: '国庆节', dates: ['2027-10-01'] },
      { id: 'c', name: '国庆节', dates: ['2026-09-25'] },
    ]
    const state = restoreHoliday(enabled(), '2026-10-02', 'event', events)
    expect(state.restored).toEqual(events[0].dates)
    expect(state.restored).not.toContain('2026-10-10')
    expect(state.restored).not.toContain('2027-10-01')
    expect(state.restored).not.toContain('2026-09-25')
  })
  it('clips a holiday event to this term and repeated restoration is idempotent', () => {
    const events = [{ id: 'a', name: '示例节日', dates: ['2026-08-30', '2026-08-31', '2026-09-01'] }]
    const first = restoreHoliday(enabled(), '2026-08-31', 'event', events)
    expect(first.restored).toEqual(['2026-08-31', '2026-09-01'])
    expect(restoreHoliday(first, '2026-09-01', 'event', events)).toEqual(first)
  })
  it('restores a whole real fixture without modifying unrelated makeups', () => {
    const state = saveMakeup(enabled(), '2026-10-10', '2026-10-06', 'weekday')
    const next = restoreHoliday(state, '2026-10-02', 'event')
    expect(next.restored).toHaveLength(7)
    expect(next.makeups).toEqual(state.makeups)
    expect(resolveDay('2026-09-25', next).status).toBe('holiday')
  })
  it('uses the target teaching week in weekday mode and the source week in date mode', () => {
    expect(sourceForWeekday('2026-10-10', 2)).toBe('2026-10-06')
    const odd = saveMakeup(enabled(), '2026-10-10', '2026-09-01', 'date')
    const even = saveMakeup(enabled(), '2026-10-10', '2026-10-06', 'weekday')
    expect(resolveDay('2026-10-10', odd).courses[1].name).toBe('电路分析')
    expect(resolveDay('2026-10-10', even).courses[1].name).toBe('电路实验')
    expect(weekOf('2026-10-10')).toBe(6)
  })
  it('reads baseline courses even when the source is on holiday, without moving that source', () => {
    const state = saveMakeup(enabled(), '2026-10-10', '2026-10-06', 'weekday')
    expect(resolveDay('2026-10-06', state).courses).toHaveLength(0)
    expect(resolveDay('2026-10-10', state).courses).toHaveLength(2)
    const normal = saveMakeup(enabled(), '2026-10-10', '2026-09-01', 'date')
    expect(resolveDay('2026-09-01', normal).courses).toEqual(baseCourses('2026-09-01', normal))
  })
  it('replaces all target courses and restores them on removal', () => {
    const original = { ...enabled(), weekendOriginal: true }
    const state = saveMakeup(original, '2026-10-10', '2026-10-06', 'weekday')
    expect(resolveDay('2026-10-10', state).courses.some(course => course.name === '程序设计实践')).toBe(false)
    expect(resolveDay('2026-10-10', removeMakeup(state, '2026-10-10')).courses).toEqual(baseCourses('2026-10-10', original))
  })
  it('follows changes to source courses without a second copy', () => {
    const state = saveMakeup(enabled(), '2026-10-10', '2026-10-06', 'weekday')
    expect(resolveDay('2026-10-10', { ...state, sourceRoomUpdated: true }).courses[0].room).toBe('知行楼 A302')
  })
  it('retains baseline courses on pending and missing-data days', () => {
    const state = { ...enabled(), weekendOriginal: true }
    expect(resolveDay('2026-10-10', state).status).toBe('pending')
    expect(resolveDay('2026-10-10', state).courses).toHaveLength(1)
    expect(resolveDay('2027-01-01', state).status).toBe('missing')
    expect(resolveDay('2027-01-01', state).courses).toHaveLength(2)
  })
  it('keeps cached holiday data usable when refresh fails', () => {
    expect(resolveDay('2026-10-01', { ...enabled(), years: { '2026': 'stale' } }).status).toBe('holiday')
  })
  it('expands weekends locally and returns to five days when off or in another week', () => {
    expect(visibleDays(6, enabled())).toBe(6)
    expect(visibleDays(3, enabled())).toBe(7)
    expect(visibleDays(7, enabled())).toBe(5)
    expect(visibleDays(6, initialState())).toBe(5)
  })
  it('rejects invalid, out-of-term, self, and empty sources without saving', () => {
    for (const source of ['', '2026-02-30', '2025-10-01', '2026-10-10', '2026-10-11']) {
      expect(sourceError('2026-10-10', source, enabled())).toBeTruthy()
      expect(() => saveMakeup(enabled(), '2026-10-10', source, 'date')).toThrow()
    }
    expect(validDate('2026-02-30')).toBe(false)
  })
})
