// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import MakeupSheet from './MakeupSheet'
import { initialState } from './model'
import type { State } from './model'

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(query => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true } }))
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(cleanup)
function openSheet(state: State = { ...initialState(), enabled: true }) {
  const onSave = vi.fn(), onClose = vi.fn()
  render(<ConfigProvider locale={zhCN}><MakeupSheet date="2026-10-10" state={state} open onSave={onSave} onRemove={vi.fn()} onClose={onClose} afterClose={vi.fn()} /></ConfigProvider>)
  return { onSave, onClose }
}
function enterDate(value: string) {
  const input = screen.getByLabelText('来源日期')
  fireEvent.focus(input)
  fireEvent.input(input, { target: { value } })
  fireEvent.change(input, { target: { value } })
  fireEvent.blur(input)
  return input
}

describe('makeup sheet validation and commit boundaries', () => {
  it('does not submit a source day with no courses', () => {
    const { onSave } = openSheet()
    fireEvent.click(screen.getByRole('button', { name: '周日' }))
    fireEvent.click(screen.getByRole('button', { name: '保存补课' }))
    expect(screen.getByRole('alert').textContent).toContain('这一天没有课程')
    expect(onSave).not.toHaveBeenCalled()
  })
  it('requires a second explicit action before replacing existing target courses', () => {
    const { onSave } = openSheet({ ...initialState(), enabled: true, weekendOriginal: true })
    fireEvent.click(screen.getByRole('button', { name: '周二' }))
    fireEvent.click(screen.getByRole('button', { name: '保存补课' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain('程序设计实践')
    fireEvent.click(screen.getByRole('button', { name: '确认替换' }))
    expect(onSave).toHaveBeenCalledExactlyOnceWith('2026-10-06', 'weekday')
  })
  it.each(['关闭', '取消'])('immediately discards an unsaved selection on %s without saving', action => {
    const { onClose, onSave } = openSheet()
    fireEvent.click(screen.getByRole('button', { name: '周二' }))
    fireEvent.click(screen.getByRole('button', { name: action === '取消' ? /^取\s*消$/ : action }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.queryByText('还有未保存的选择，是否放弃？')).toBeNull()
  })
  it('shows the preview only for a valid selected source and removes stale previews', () => {
    openSheet()
    expect(screen.queryByRole('region', { name: '补课预览' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '周二' }))
    expect(screen.getByRole('region', { name: '补课预览' }).textContent).toContain('10月6日')
    fireEvent.click(screen.getByRole('button', { name: '指定日期' }))
    expect(screen.queryByRole('region', { name: '补课预览' })).toBeNull()
    enterDate('2026-10-13')
    expect(screen.getByRole('region', { name: '补课预览' }).textContent).toContain('10月13日')
    enterDate('2026-02-30')
    expect(screen.queryByRole('region', { name: '补课预览' })).toBeNull()
    enterDate('')
    expect(screen.queryByRole('region', { name: '补课预览' })).toBeNull()
  })
  it('does not silently submit the previous valid date after invalid text', () => {
    const state = { ...initialState(), enabled: true, makeups: { '2026-10-10': { sourceDate: '2026-10-13', mode: 'date' as const } } }
    const { onSave } = openSheet(state)
    const input = enterDate('2026-02-30')
    fireEvent.click(screen.getByRole('button', { name: '保存补课' }))
    expect(input).toHaveProperty('value', '2026-02-30')
    expect(screen.getByRole('alert').textContent).toContain('请输入有效日期')
    expect(onSave).not.toHaveBeenCalled()
  })
  it('retains a newly typed valid date after blur and validates its meaning', () => {
    const state = { ...initialState(), enabled: true, makeups: { '2026-10-10': { sourceDate: '2026-10-13', mode: 'date' as const } } }
    const { onSave } = openSheet(state)
    const input = enterDate('2026-10-10')
    fireEvent.click(screen.getByRole('button', { name: '保存补课' }))
    expect(input).toHaveProperty('value', '2026-10-10')
    expect(screen.getByRole('alert').textContent).toContain('不能选择补课当天')
    expect(onSave).not.toHaveBeenCalled()
  })
  it('does not read an input value from a picker-panel blur event', () => {
    const state = { ...initialState(), enabled: true, makeups: { '2026-10-10': { sourceDate: '2026-10-13', mode: 'date' as const } } }
    openSheet(state)
    const input = screen.getByLabelText('来源日期')
    fireEvent.blur(input.closest('.ant-picker')!)
    expect(input).toHaveProperty('value', '2026-10-13')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
