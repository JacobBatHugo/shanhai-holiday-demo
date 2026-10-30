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
  viewport: { width: number; height: number; devicePixelRatio: number; visualWidth: number; visualHeight: number }
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
    const stable = ['data-review-id', 'data-date-action', 'data-date-heading'].find(name => node!.hasAttribute(name))
    if (stable) { parts.unshift(`[${stable}=${JSON.stringify(node.getAttribute(stable))}]`); break }
    if (node.id === 'root' || node.id.startsWith('hd-')) { parts.unshift(`[id=${JSON.stringify(node.id)}]`); break }
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
  return {
    id, comment: '', target: describeTarget(element), url: window.location.href, version, context,
    viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio, visualWidth: visual?.width ?? window.innerWidth, visualHeight: visual?.height ?? window.innerHeight },
    scroll: { x: window.scrollX, y: window.scrollY },
  }
}

export function exportAnnotations(notes: Annotation[]): string {
  const px = (value: number) => Number(value.toFixed(2))
  return ['山海课表 · 验收批注', `共 ${notes.length} 条；以下原话未经改写。`, ...notes.map((note, index) => [
    `\n--- 批注 ${index + 1} ---`, `页面：${note.url}`, `版本：${note.version}`, `状态：${note.context}`,
    `视口：${note.viewport.width} × ${note.viewport.height} CSS px；DPR ${px(note.viewport.devicePixelRatio)}；可见 ${px(note.viewport.visualWidth)} × ${px(note.viewport.visualHeight)}`,
    `页面滚动：${px(note.scroll.x)}, ${px(note.scroll.y)}`, `弹窗：${note.target.dialog ?? '无'}`, `元素：${note.target.label}`, `定位：${note.target.selector}`,
    '原话（开始）', note.comment, '原话（结束）',
  ].join('\n'))].join('\n')
}
