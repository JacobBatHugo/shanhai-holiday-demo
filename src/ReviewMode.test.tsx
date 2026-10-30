// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import ReviewMode from './ReviewMode'
import { captureAnnotation, describeTarget, exportAnnotations } from './review'
import { DEMO_VERSION } from './demoVersion'

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(query => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true } }))
  class TestPointerEvent extends MouseEvent {
    pointerId: number; pointerType: string; isPrimary: boolean
    constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? 'mouse'; this.isPrimary = init.isPrimary ?? true }
  }
  window.PointerEvent = TestPointerEvent as unknown as typeof PointerEvent
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function setup() {
  const action = vi.fn()
  render(<><ReviewMode context="调休补课；第 6 周；日间；自动调整开启" /><button data-review-id="open-settings" onClick={action}><span>打开设置</span></button><button disabled>禁用按钮</button></>)
  fireEvent.click(screen.getByRole('button', { name: '验收模式' }))
  return action
}
function begin() { fireEvent.click(screen.getByRole('button', { name: '选取元素' })) }
function tap(element: Element, pointerType = 'mouse') {
  fireEvent.pointerDown(element, { pointerType, clientX: 60, clientY: 80 })
  fireEvent.pointerUp(element, { pointerType, clientX: 60, clientY: 80 })
  fireEvent.click(element, { detail: 1 })
}
async function add(comment: string) {
  begin(); tap(screen.getByText('打开设置'))
  fireEvent.change(screen.getByLabelText('你的原话'), { target: { value: comment } })
  fireEvent.click(screen.getByRole('button', { name: '保存批注' }))
  await waitFor(() => expect(screen.queryByLabelText('你的原话')).toBeNull())
}

describe('local review selection and export', () => {
  it('keeps a fixed locator through wrapper and button-order changes', () => {
    const { rerender } = render(<div><button data-review-id="settings-save">保存设置</button></div>)
    const selector = describeTarget(screen.getByRole('button', { name: '保存设置' })).selector
    expect(selector).toBe('[data-review-id="settings-save"]')
    rerender(<section><p>新的说明</p><footer><button>取消</button><span><button data-review-id="settings-save">保存设置</button></span></footer></section>)
    expect(document.querySelectorAll(selector)).toHaveLength(1)
    expect(document.querySelector(selector)).toBe(screen.getByRole('button', { name: '保存设置' }))
    expect(describeTarget(screen.getByRole('button', { name: '保存设置' })).selector).toBe(selector)
  })
  it('falls back to a unique structural path when a marker is duplicated', () => {
    render(<div><button data-review-id="duplicate">甲</button><button data-review-id="duplicate">乙</button></div>)
    const button = screen.getByRole('button', { name: '乙' })
    const selector = describeTarget(button).selector
    expect(selector).not.toBe('[data-review-id="duplicate"]')
    expect(document.querySelectorAll(selector)).toHaveLength(1)
    expect(document.querySelector(selector)).toBe(button)
  })
  it('captures the actual viewport scale without changing earlier snapshots', () => {
    const viewport = { width: 310.5, height: 584.25, scale: 1.25 }
    vi.stubGlobal('visualViewport', viewport)
    const note = captureAnnotation(document.createElement('button'), DEMO_VERSION, 'test', 1)
    viewport.scale = 2
    expect(note.viewport.scale).toBe(1.25)
    expect(note.viewport.visualWidth).toBe(310.5)
    expect(note.viewport.visualHeight).toBe(584.25)
    expect(exportAnnotations([note])).toContain('视口缩放：1.25×')
  })
  it.each([undefined, null])('reports unavailable scale and dimension fallback without VisualViewport (%s)', viewport => {
    vi.stubGlobal('visualViewport', viewport)
    const note = captureAnnotation(document.createElement('button'), DEMO_VERSION, 'test', 1)
    expect(note.viewport.scale).toBeNull()
    expect(note.viewport.visualWidth).toBe(innerWidth)
    expect(note.viewport.visualHeight).toBe(innerHeight)
    expect(exportAnnotations([note])).toContain('（回退为布局视口）')
    expect(exportAnnotations([note])).toContain('视口缩放：不可用（浏览器未提供有效值）')
  })
  it('does not invent a scale when the interface provides an invalid value', () => {
    vi.stubGlobal('visualViewport', { width: 390, height: 844, scale: 0 })
    const note = captureAnnotation(document.createElement('button'), DEMO_VERSION, 'test', 1)
    expect(note.viewport.scale).toBeNull()
    expect(exportAnnotations([note])).not.toContain('回退为布局视口')
  })
  it('snapshots a unique locator, modal title, URL, version and selection-time viewport', () => {
    const { container } = render(<div role="dialog" aria-labelledby="test-title"><h2 id="test-title">补课表单</h2><section><button>周二</button><button><span>周三</span></button></section></div>)
    const button = screen.getByRole('button', { name: '周三' })
    const target = describeTarget(button)
    expect(document.querySelectorAll(target.selector)).toHaveLength(1)
    expect(document.querySelector(target.selector)).toBe(button)
    expect(target.dialog).toBe('补课表单')
    const note = captureAnnotation(button, DEMO_VERSION, '第 6 周', 1)
    expect(note.url).toBe(location.href)
    expect(note.version).toBe(DEMO_VERSION)
    expect(note.viewport.width).toBe(innerWidth)
    expect(note.viewport.height).toBe(innerHeight)
    expect(container).toBeTruthy()
  })
  it('uses the associated label for input targets without reading their values', () => {
    render(<label>设置选项<input type="checkbox" value="not-exported" /></label>)
    expect(describeTarget(screen.getByRole('checkbox')).label).toBe('设置选项')
  })
  it('selects desktop text inside a button without invoking its action; exits cleanly', async () => {
    const action = setup()
    begin(); tap(screen.getByText('打开设置'))
    expect(action).not.toHaveBeenCalled()
    expect(screen.getByLabelText('你的原话')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^取\s*消$/ }))
    await waitFor(() => expect(screen.queryByLabelText('你的原话')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: '退出验收' }))
    fireEvent.click(screen.getByText('打开设置'))
    expect(action).toHaveBeenCalledOnce()
    expect(document.documentElement.hasAttribute('data-review-selecting')).toBe(false)
  })
  it('does not prevent touch scrolling and ignores drags, cancellation, long presses and multitouch', () => {
    setup(); begin()
    const target = screen.getByText('打开设置')
    expect(fireEvent.pointerDown(target, { pointerType: 'touch', clientY: 300 })).toBe(true)
    fireEvent.pointerMove(target, { pointerType: 'touch', clientY: 200 })
    fireEvent.pointerUp(target, { pointerType: 'touch', clientY: 200 })
    fireEvent.click(target, { detail: 1 })
    expect(screen.queryByLabelText('你的原话')).toBeNull()
    fireEvent.pointerDown(target, { pointerType: 'touch' })
    fireEvent.pointerCancel(target, { pointerType: 'touch' })
    fireEvent.pointerUp(target, { pointerType: 'touch' })
    expect(screen.queryByLabelText('你的原话')).toBeNull()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000)
    fireEvent.pointerDown(target, { pointerType: 'touch' })
    clock.mockReturnValue(2500)
    fireEvent.pointerUp(target, { pointerType: 'touch' })
    expect(screen.queryByLabelText('你的原话')).toBeNull()
    fireEvent.pointerDown(target, { pointerType: 'touch' })
    fireEvent.pointerDown(target, { pointerType: 'touch', isPrimary: false, pointerId: 2 })
    fireEvent.pointerUp(target, { pointerType: 'touch' })
    expect(screen.queryByLabelText('你的原话')).toBeNull()
    tap(screen.getByRole('button', { name: '禁用按钮' }), 'touch')
    expect(screen.getByLabelText('你的原话')).toBeTruthy()
  })
  it('keeps Escape inside selection and supports keyboard selection', () => {
    const action = setup(); begin()
    const escape = vi.fn()
    window.addEventListener('keydown', escape)
    fireEvent.keyDown(screen.getByRole('button', { name: '取消选取' }), { key: 'Escape' })
    expect(escape).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '选取元素' })).toBeTruthy()
    begin()
    fireEvent.keyDown(screen.getByText('打开设置'), { key: 'Enter' })
    expect(screen.getByLabelText('你的原话')).toBeTruthy()
    expect(action).not.toHaveBeenCalled()
    window.removeEventListener('keydown', escape)
  })
  it('preserves raw whitespace and multiple notes, edits only comment text, and copies exact export', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    setup()
    await add('  测试甲\n第二行  ')
    await add('测试乙 <b>保持字面</b>')
    fireEvent.click(screen.getByRole('button', { name: '批注 2' }))
    fireEvent.click(screen.getByRole('button', { name: '编辑批注 1' }))
    expect(screen.getByLabelText('你的原话')).toHaveProperty('value', '  测试甲\n第二行  ')
    fireEvent.change(screen.getByLabelText('你的原话'), { target: { value: '  修改甲\n\n保留空行  ' } })
    fireEvent.click(screen.getByRole('button', { name: '保存批注' }))
    await waitFor(() => expect(screen.queryByLabelText('你的原话')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: '批注 2' }))
    fireEvent.click(screen.getByRole('button', { name: '导出全部' }))
    const content = (screen.getByLabelText('完整导出文本') as HTMLTextAreaElement).value
    expect(content).toContain('原话（开始）\n  修改甲\n\n保留空行  \n原话（结束）')
    expect(content).toContain('测试乙 <b>保持字面</b>')
    expect(content).toContain(`[data-review-id="open-settings"]`)
    expect(content).toContain(`版本：${DEMO_VERSION}`)
    fireEvent.click(screen.getByRole('button', { name: '复制全部' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(content))
    expect(await screen.findByText('已复制全部批注，可粘贴发送。')).toBeTruthy()
  })
  it('provides manual selection after clipboard rejection, keeps notes on exit and clears on remount', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
    setup(); await add('回退测试')
    fireEvent.click(screen.getByRole('button', { name: '退出验收' }))
    fireEvent.click(screen.getByRole('button', { name: '验收模式 · 1' }))
    fireEvent.click(screen.getByRole('button', { name: '批注 1' }))
    fireEvent.click(screen.getByRole('button', { name: '导出全部' }))
    fireEvent.click(screen.getByRole('button', { name: '复制全部' }))
    expect(await screen.findByText(/自动复制未成功/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '全选文本' }))
    const field = screen.getByLabelText('完整导出文本') as HTMLTextAreaElement
    expect(field.selectionStart).toBe(0)
    expect(field.selectionEnd).toBe(field.value.length)
    cleanup(); setup()
    expect(screen.getByRole('button', { name: '批注 0' })).toBeTruthy()
  })
  it('does not trim user text in the export helper', () => {
    const target = document.createElement('button')
    const note = { ...captureAnnotation(target, 'test', 'sample', 1), comment: '\n  精确保留\n\n' }
    expect(exportAnnotations([note])).toContain('原话（开始）\n\n  精确保留\n\n\n原话（结束）')
  })
})
