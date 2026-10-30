import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Modal } from 'antd'
import { DEMO_VERSION } from './demoVersion'
import { captureAnnotation, exportAnnotations, reviewElement } from './review'
import type { Annotation } from './review'
import './review.css'

export default function ReviewMode({ context }: { context: string }) {
  const [enabled, setEnabled] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [top, setTop] = useState(false)
  const [notes, setNotes] = useState<Annotation[]>([])
  const [draft, setDraft] = useState<Annotation | null>(null)
  const [panel, setPanel] = useState<'list' | 'export' | null>(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [copying, setCopying] = useState(false)
  const sequence = useRef(0)
  const suppressClickUntil = useRef(0)
  const selectButton = useRef<HTMLButtonElement>(null)
  const entryButton = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const exportInput = useRef<HTMLTextAreaElement>(null)
  const exported = exportAnnotations(notes)

  useEffect(() => {
    if (!enabled) return
    let hover: Element | null = null
    let gesture: { id: number; x: number; y: number; moved: boolean; started: number } | null = null
    const highlight = (element: Element | null) => {
      hover?.removeAttribute('data-review-highlight')
      hover = element
      hover?.setAttribute('data-review-highlight', '')
    }
    const stop = (event: Event) => { event.preventDefault(); event.stopImmediatePropagation() }
    const choose = (element: Element) => {
      setDraft(captureAnnotation(element, DEMO_VERSION, context, ++sequence.current))
      setSelecting(false)
      highlight(null)
    }
    const down = (event: PointerEvent) => {
      if (!selecting || !reviewElement(event.target)) return
      if (!event.isPrimary || event.button > 0) { gesture = null; return }
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, started: Date.now() }
      event.stopImmediatePropagation()
      // Touch must retain native scrolling and pinch-to-zoom.
      if (event.pointerType !== 'touch') event.preventDefault()
    }
    const move = (event: PointerEvent) => {
      if (!selecting) return
      if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 12) gesture.moved = true
      if (event.pointerType !== 'touch') highlight(reviewElement(event.target))
    }
    const up = (event: PointerEvent) => {
      if (!selecting || !gesture || gesture.id !== event.pointerId) return
      const tap = !gesture.moved && Date.now() - gesture.started < 1000
      gesture = null
      suppressClickUntil.current = Date.now() + 700
      const element = reviewElement(event.target)
      if (tap && element) { stop(event); choose(element) }
    }
    const cancel = () => { gesture = null; highlight(null) }
    const click = (event: MouseEvent) => {
      if ((event.target as Element)?.closest?.('[data-review-ui]')) return
      if (selecting) {
        stop(event)
        const element = reviewElement(event.target)
        if (event.detail === 0 && element) choose(element)
      } else if (Date.now() < suppressClickUntil.current) { stop(event); suppressClickUntil.current = 0 }
    }
    const key = (event: KeyboardEvent) => {
      if (!selecting) return
      if (event.key === 'Escape') { stop(event); setSelecting(false); selectButton.current?.focus() }
      else if ((event.target as Element)?.closest?.('[data-review-ui]')) return
      else if (event.key === 'Enter' || event.key === ' ') {
        const element = reviewElement(event.target)
        if (element) { stop(event); choose(element) }
      }
    }
    const menu = (event: Event) => { if (selecting && reviewElement(event.target)) stop(event) }
    document.documentElement.toggleAttribute('data-review-selecting', selecting)
    window.addEventListener('pointerdown', down, true)
    window.addEventListener('pointermove', move, true)
    window.addEventListener('pointerup', up, true)
    window.addEventListener('pointercancel', cancel, true)
    window.addEventListener('click', click, true)
    window.addEventListener('keydown', key, true)
    window.addEventListener('contextmenu', menu, true)
    return () => {
      highlight(null)
      document.documentElement.removeAttribute('data-review-selecting')
      window.removeEventListener('pointerdown', down, true)
      window.removeEventListener('pointermove', move, true)
      window.removeEventListener('pointerup', up, true)
      window.removeEventListener('pointercancel', cancel, true)
      window.removeEventListener('click', click, true)
      window.removeEventListener('keydown', key, true)
      window.removeEventListener('contextmenu', menu, true)
    }
  }, [context, enabled, selecting])

  const draftId = draft?.id
  useEffect(() => { if (draftId !== undefined) input.current?.focus() }, [draftId])

  function closePanel() { setDraft(null); setPanel(null) }
  async function copy() {
    setCopying(true)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(exported)
      setCopyStatus('已复制全部批注，可粘贴发送。')
    } catch {
      setCopyStatus('自动复制未成功。请点“全选文本”，再长按或按 Ctrl/Cmd+C 复制。')
    } finally { setCopying(false) }
  }
  function save() {
    if (!draft?.comment.trim()) return
    setNotes(current => current.some(note => note.id === draft.id) ? current.map(note => note.id === draft.id ? draft : note) : [...current, draft])
    closePanel()
  }
  return <>
    <button ref={entryButton} data-review-ui aria-pressed={enabled} onClick={() => { setEnabled(true); setSelecting(false) }}>验收模式{notes.length ? ` · ${notes.length}` : ''}</button>
    {enabled && !draft && !panel && createPortal(<aside data-review-ui className="qinglv hd-review-bar" data-top={top} aria-label="验收工具">
      <div className="hd-review-bar-heading"><span role="status">{selecting ? '点选元素 · 滑动仍可滚动' : '验收 · 浏览操作'}</span><button onClick={() => setTop(!top)} aria-label={top ? '工具移到底部' : '工具移到顶部'}>{top ? '移到底部' : '移到顶部'}</button></div>
      <div className="hd-review-actions"><button ref={selectButton} aria-pressed={selecting} onClick={() => setSelecting(!selecting)}>{selecting ? '取消选取' : '选取元素'}</button><button onClick={() => { setSelecting(false); setPanel('list'); setCopyStatus('') }}>批注 {notes.length}</button><button onClick={() => { setSelecting(false); setEnabled(false); entryButton.current?.focus() }}>退出验收</button></div>
    </aside>, document.body)}
    <Modal open={!!draft || !!panel} centered width={560} zIndex={3000} transitionName="" maskTransitionName="" destroyOnHidden
      rootClassName="qinglv hd-dialog hd-review-dialog" title={draft ? (notes.some(note => note.id === draft.id) ? '编辑批注' : '添加批注') : panel === 'export' ? '导出批注' : `验收批注 · ${notes.length}`}
      closable={{ 'aria-label': '关闭批注' }} onCancel={closePanel} focusTriggerAfterClose={false}
      afterOpenChange={open => { if (open) input.current?.focus(); else selectButton.current?.focus() }}
      modalRender={node => <div data-review-ui>{node}</div>}
      footer={draft ? <><Button onClick={closePanel}>取消</Button><Button type="primary" disabled={!draft.comment.trim()} onClick={save}>保存批注</Button></> : panel === 'export' ? <><Button onClick={() => { exportInput.current?.focus(); exportInput.current?.select() }}>全选文本</Button><Button type="primary" loading={copying} onClick={copy}>复制全部</Button></> : <><Button onClick={closePanel}>继续浏览</Button><Button type="primary" disabled={!notes.length} onClick={() => { setPanel('export'); setCopyStatus('') }}>导出全部</Button></>}>
      <div className="hd-review-content">
        {draft ? <><p className="hd-review-target">{draft.target.dialog ? `${draft.target.dialog} · ` : ''}{draft.target.label || '页面元素'}</p><label htmlFor="hd-review-comment">你的原话</label><textarea id="hd-review-comment" ref={input} value={draft.comment} onChange={event => setDraft({ ...draft, comment: event.target.value })} rows={5} placeholder="描述你希望调整的地方…" /><p className="hd-review-help">自动附上元素定位、页面地址、版本和选取时的视口。</p></> : panel === 'export' ? <><label htmlFor="hd-review-export">完整导出文本</label><textarea id="hd-review-export" ref={exportInput} readOnly value={exported} rows={10} /><p role="status" className="hd-review-help">{copyStatus || '可复制全部，也可全选后手动复制。'}</p></> : <><p className="hd-review-help">先正常打开要验收的页面或弹窗，再点“选取元素”。批注只留在本页，刷新即清空；退出验收后仍可回来导出。</p>{notes.length ? <ol className="hd-review-list">{notes.map((note, index) => <li key={note.id}><strong>{index + 1}. {note.target.label || '页面元素'}</strong><p>{note.comment}</p><div><button onClick={() => { setPanel(null); setDraft(note) }} aria-label={`编辑批注 ${index + 1}`}>编辑</button><button onClick={() => setNotes(current => current.filter(item => item.id !== note.id))} aria-label={`删除批注 ${index + 1}`}>删除</button></div></li>)}</ol> : <p>暂无批注。</p>}</>}
        <p className="hd-review-privacy">仅在本页暂存，不会自动发送 · v{DEMO_VERSION}</p>
      </div>
    </Modal>
  </>
}
