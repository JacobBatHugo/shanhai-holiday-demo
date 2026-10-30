export type ReviewTarget = {
  selector: string
  label: string
  dialog: string | null
}
export type Annotation = {
  id: number
  comment: string
  target: ReviewTarget
  url: string
  version: string
  context: string
  settingsState: { savedEnabled: boolean; draftEnabled: boolean } | null
  viewport: { width: number; height: number; devicePixelRatio: number; visualWidth: number; visualHeight: number; scale: number | null; visualAvailable: boolean }
  scroll: { x: number; y: number }
}

// Prefer the control over its icon/text, but leave non-interactive text selectable.
export function reviewElement(target: EventTarget | null): Element | null {
  if (!(target instanceof Element) || target.closest('[data-review-ui]')) return null
  const element = target.closest('button, a, input, textarea, select, label, [role="button"], [role="checkbox"], svg') ?? target
  if (['HTML', 'BODY'].includes(element.tagName) || element.classList.contains('ant-modal-mask') || element.classList.contains('ant-modal-wrap')) return null
  return element
}

export function describeTarget(element: Element): ReviewTarget {
  const parts: string[] = []
  let node: Element | null = element
  while (node && node !== document.body) {
    const stable = ['data-review-id', 'data-date-action', 'data-date-heading', 'id'].find(name => {
      const value = node!.getAttribute(name)
      return value && (name !== 'id' || value === 'root' || value.startsWith('hd-'))
        && document.querySelectorAll(`[${name}=${JSON.stringify(value)}]`).length === 1
    })
    if (stable) { parts.unshift(`[${stable}=${JSON.stringify(node.getAttribute(stable))}]`); break }
    const tag = node.tagName.toLowerCase()
    const siblings = node.parentElement ? Array.from(node.parentElement.children).filter(sibling => sibling.tagName === node!.tagName) : [node]
    const names = Array.from(node.classList).filter(name => name.startsWith('hd-') && !name.startsWith('hd-review'))
    const anchor = names.map(name => `.${name}`).join('')
    if (anchor && document.querySelectorAll(anchor).length === 1) { parts.unshift(anchor); break }
    parts.unshift(`${tag}${names.map(name => `.${name}`).join('')}:nth-of-type(${siblings.indexOf(node) + 1})`)
    node = node.parentElement
  }
  const dialog = element.closest('[role="dialog"]')
  const title = dialog?.getAttribute('aria-labelledby')
  const labels = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
    ? Array.from(element.labels ?? []).map(label => label.textContent).join(' ') : ''
  return {
    selector: parts.join(' > '),
    label: (element.getAttribute('aria-label') || labels || element.getAttribute('alt') || element.textContent || element.tagName.toLowerCase()).replace(/\s+/g, ' ').trim().slice(0, 180),
    dialog: dialog ? (title ? document.getElementById(title)?.textContent : null) ?? dialog.querySelector('.ant-modal-title')?.textContent ?? '弹窗' : null,
  }
}

export function captureAnnotation(element: Element, version: string, context: string, id: number): Annotation {
  const visual = window.visualViewport
  // Only the explicitly opted-in settings switch is captured, never arbitrary input values.
  const settings = element.closest('[role="dialog"]')?.querySelector('[data-review-form="settings"]')
  const saved = settings?.getAttribute('data-review-saved-enabled')
  const draft = settings?.getAttribute('data-review-draft-enabled')
  const settingsState = (saved === 'true' || saved === 'false') && (draft === 'true' || draft === 'false')
    ? { savedEnabled: saved === 'true', draftEnabled: draft === 'true' } : null
  return {
    id, comment: '', target: describeTarget(element), url: window.location.href, version, context, settingsState,
    viewport: {
      width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio,
      visualWidth: visual?.width ?? window.innerWidth, visualHeight: visual?.height ?? window.innerHeight,
      scale: visual && Number.isFinite(visual.scale) && visual.scale > 0 ? visual.scale : null,
      visualAvailable: !!visual,
    },
    scroll: { x: window.scrollX, y: window.scrollY },
  }
}

export function exportAnnotations(notes: Annotation[]): string {
  const px = (value: number) => Number(value.toFixed(2))
  return ['山海课表 · 验收批注', `共 ${notes.length} 条；以下原话未经改写。`, ...notes.map((note, index) => [
    `\n--- 批注 ${index + 1} ---`, `页面：${note.url}`, `版本：${note.version}`, `状态：${note.context}`,
    ...(note.settingsState ? [
      `设置已保存：按节假日自动调整=${note.settingsState.savedEnabled ? '开启' : '关闭'}`,
      `当前表单：按节假日自动调整=${note.settingsState.draftEnabled ? '开启' : '关闭'}（${note.settingsState.savedEnabled === note.settingsState.draftEnabled ? '与已保存一致' : '有未保存更改'}）`,
    ] : []),
    `视口：${note.viewport.width} × ${note.viewport.height} CSS px；DPR ${px(note.viewport.devicePixelRatio)}；可见 ${px(note.viewport.visualWidth)} × ${px(note.viewport.visualHeight)}${note.viewport.visualAvailable ? '' : '（回退为布局视口）'}`,
    `视口缩放：${note.viewport.scale === null ? '不可用（浏览器未提供有效值）' : `${note.viewport.scale}×`}`,
    `页面滚动：${px(note.scroll.x)}, ${px(note.scroll.y)}`, `弹窗：${note.target.dialog ?? '无'}`, `元素：${note.target.label}`, `定位：${note.target.selector}`,
    '原话（开始）', note.comment, '原话（结束）',
  ].join('\n'))].join('\n')
}
