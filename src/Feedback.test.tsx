// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Feedback from './Feedback'
import { initialState } from './model'

beforeEach(() => { vi.useFakeTimers(); Element.prototype.scrollIntoView = vi.fn() })
afterEach(() => { cleanup(); vi.useRealTimers() })
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const pointer = (type: string, pointerType: string) => Object.assign(new Event(type, { bubbles: true }), { pointerType })

describe('result feedback lifetime', () => {
  it('gives normal feedback five seconds and undo feedback ten seconds', () => {
    const onDismiss = vi.fn()
    const normal = { message: '10月1日已恢复上课' }
    const undoable = { message: '已开启节假日自动调整', previous: initialState() }
    const { rerender } = render(<Feedback notice={normal} onDismiss={onDismiss} onUndo={vi.fn()} />)
    advance(4999)
    expect(onDismiss).not.toHaveBeenCalled()
    advance(1)
    expect(onDismiss).toHaveBeenCalledWith(normal)
    onDismiss.mockClear()
    rerender(<Feedback notice={undoable} onDismiss={onDismiss} onUndo={vi.fn()} />)
    advance(9999)
    expect(onDismiss).not.toHaveBeenCalled()
    advance(1)
    expect(onDismiss).toHaveBeenCalledWith(undoable)
  })

  it('restarts for repeated identical messages and cancels the previous timer', () => {
    const onDismiss = vi.fn()
    const first = { message: '已保存' }
    const second = { message: '已保存' }
    const { rerender } = render(<Feedback notice={first} onDismiss={onDismiss} onUndo={vi.fn()} />)
    advance(4000)
    rerender(<Feedback notice={second} onDismiss={onDismiss} onUndo={vi.fn()} />)
    advance(1000)
    expect(onDismiss).not.toHaveBeenCalled()
    advance(4000)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledWith(second)
  })

  it('pauses for mouse hover and starts a full reading interval after leaving', () => {
    const onDismiss = vi.fn()
    render(<Feedback notice={{ message: '已保存' }} onDismiss={onDismiss} onUndo={vi.fn()} />)
    advance(4000)
    fireEvent(screen.getByRole('status'), pointer('pointerover', 'mouse'))
    advance(20000)
    expect(onDismiss).not.toHaveBeenCalled()
    fireEvent(screen.getByRole('status'), pointer('pointerout', 'mouse'))
    advance(4999)
    expect(onDismiss).not.toHaveBeenCalled()
    advance(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not leave a touch notice stuck in a hover state', () => {
    const onDismiss = vi.fn()
    render(<Feedback notice={{ message: '已保存' }} onDismiss={onDismiss} onUndo={vi.fn()} />)
    fireEvent(screen.getByRole('status'), pointer('pointerover', 'touch'))
    advance(5000)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('keeps actions while focused, including focus moving between buttons', () => {
    const onDismiss = vi.fn()
    render(<><button>课表设置</button><Feedback notice={{ message: '已保存', previous: initialState() }} onDismiss={onDismiss} onUndo={vi.fn()} /></>)
    const undo = screen.getByRole('button', { name: '撤销' })
    const close = screen.getByRole('button', { name: '关闭提示' })
    fireEvent.focus(undo, { relatedTarget: screen.getByText('课表设置') })
    advance(20000)
    fireEvent.blur(undo, { relatedTarget: close })
    fireEvent.focus(close, { relatedTarget: undo })
    advance(20000)
    expect(onDismiss).not.toHaveBeenCalled()
    fireEvent.blur(close, { relatedTarget: screen.getByText('课表设置') })
    advance(10000)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('allows undo and dismiss, restores keyboard focus, and clears timers on unmount', () => {
    const onDismiss = vi.fn()
    const onUndo = vi.fn()
    const notice = { message: '已保存', previous: initialState() }
    const { unmount } = render(<><button>课表设置</button><Feedback notice={notice} onDismiss={onDismiss} onUndo={onUndo} /></>)
    const origin = screen.getByText('课表设置')
    act(() => origin.focus())
    act(() => screen.getByRole('button', { name: '撤销' }).focus())
    fireEvent.click(screen.getByRole('button', { name: '撤销' }))
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(origin)
    fireEvent.click(screen.getByRole('button', { name: '关闭提示' }))
    expect(onDismiss).toHaveBeenCalledWith(notice)
    onDismiss.mockClear()
    unmount()
    advance(20000)
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
