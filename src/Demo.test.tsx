// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ConfigProvider } from 'antd'
import Demo from './Demo'

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(query => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true } }))
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { cleanup(); vi.useRealTimers() })
const renderDemo = () => render(<ConfigProvider theme={{ token: { motion: false } }}><Demo /></ConfigProvider>)

describe('revised holiday preview', () => {
  it('returns focus to the restored makeup action after undo replaces its trigger', async () => {
    renderDemo()
    fireEvent.change(screen.getByLabelText('预览场景'), { target: { value: 'makeup' } })
    fireEvent.click(screen.getByRole('button', { name: '设置补课' }))
    fireEvent.click(screen.getByRole('button', { name: '周二' }))
    fireEvent.click(screen.getByRole('button', { name: '保存补课' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: '撤销' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: '设置补课' })))
  })
  it('automatically clears restoration feedback after five seconds', () => {
    vi.useFakeTimers()
    renderDemo()
    fireEvent.change(screen.getByLabelText('预览场景'), { target: { value: 'holiday' } })
    fireEvent.click(screen.getByRole('button', { name: '10月1日 周四，国庆节，恢复上课' }))
    fireEvent.click(screen.getByRole('button', { name: /仅恢复当天/ }))
    expect(screen.getByText('10月1日已恢复上课')).toBeTruthy()
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByText('10月1日已恢复上课')).toBeNull()
  })
  it('restores one day without offering a holiday reapply or restoration undo', async () => {
    renderDemo()
    fireEvent.change(screen.getByLabelText('预览场景'), { target: { value: 'holiday' } })
    fireEvent.click(screen.getByRole('button', { name: '10月1日 周四，国庆节，恢复上课' }))
    fireEvent.click(await screen.findByRole('button', { name: /仅恢复当天/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /10月1日 周四 机械设计基础/ })).toBeTruthy())
    expect(screen.getByRole('button', { name: '10月2日 周五，国庆节，恢复上课' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '重新放假' })).toBeNull()
    expect(screen.queryByRole('button', { name: '撤销' })).toBeNull()
  })
  it('cancels a holiday restoration without changing the timetable', async () => {
    renderDemo()
    fireEvent.change(screen.getByLabelText('预览场景'), { target: { value: 'holiday' } })
    fireEvent.click(screen.getByRole('button', { name: '10月1日 周四，国庆节，恢复上课' }))
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.queryByRole('button', { name: /10月1日 周四 机械设计基础/ })).toBeNull()
    expect(screen.getByRole('button', { name: '10月1日 周四，国庆节，恢复上课' })).toBeTruthy()
  })
  it('shows all seven statutory holiday designs without changing the active scenario', () => {
    renderDemo()
    fireEvent.click(screen.getByRole('button', { name: '节日卡片' }))
    for (const name of ['元旦', '春节', '清明节', '劳动节', '端午节', '中秋节', '国庆节']) expect(screen.getByText(name, { exact: true })).toBeTruthy()
    expect(screen.getByLabelText('预览场景')).toHaveProperty('value', 'initial')
  })
})
