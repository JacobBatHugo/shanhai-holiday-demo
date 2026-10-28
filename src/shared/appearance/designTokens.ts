import source from '../styles/tokens.css?raw'

/** 仅解析本项目固定的 :root 声明块，作为 CSS 尚未生效时的同源兜底。
 * 不另存一份 HEX 常量，避免 JS 兜底与设计色板漂移。 */
function declarations(css: string, dark = false): Record<string, string> {
  const block = css.match(dark ? /:root\[data-theme="dark"\]\s*\{([^}]*)\}/ : /:root\s*\{([^}]*)\}/)?.[1] ?? ''
  return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]))
}

const light = declarations(source)
const dark = { ...light, ...declarations(source, true) }

/** 读取根元素的已计算变量；样式未加载、预渲染或测试环境从同一 CSS 解析兜底。
 * 语义变量含嵌套 var()/rgba()，按括号深度展开，避免用简单正则截断透明色。 */
export function designTokenReader(mode?: 'light' | 'dark') {
  const root = typeof document === 'undefined' ? null : document.documentElement
  const css = root ? getComputedStyle(root) : null
  const palette = (mode ?? root?.dataset.theme) === 'dark' ? dark : light
  function resolve(value: string, trail: Set<string>): string {
    let start = value.indexOf('var(')
    while (start >= 0) {
      let end = start + 4
      let depth = 1
      while (end < value.length && depth) {
        if (value[end] === '(') depth++
        if (value[end] === ')') depth--
        end++
      }
      if (depth) return ''
      const contents = value.slice(start + 4, end - 1)
      const comma = contents.indexOf(',')
      const name = (comma < 0 ? contents : contents.slice(0, comma)).trim()
      const fallback = comma < 0 ? '' : contents.slice(comma + 1).trim()
      const replacement = trail.has(name) ? '' : resolve(palette[name] ?? fallback, new Set([...trail, name]))
      value = value.slice(0, start) + replacement + value.slice(end)
      start = value.indexOf('var(')
    }
    return value
  }
  return (name: string) => css?.getPropertyValue(`--${name}`).trim() || resolve(palette[`--${name}`] ?? '', new Set([`--${name}`]))
}
