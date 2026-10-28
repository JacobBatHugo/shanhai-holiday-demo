import type { ThemeConfig } from 'antd'
import { designTokenReader } from '../../../appearance/designTokens'

/** 青绿使用方共用语义色板，但保留原控件字体和 AntD 默认值，避免跨批次改变视觉。 */
export function buildQinglvTheme(): ThemeConfig {
  const v = designTokenReader()
  return {
    inherit: false,
    token: {
      colorPrimary: v('color-primary'), colorInfo: v('color-primary'), colorError: v('color-error'),
      colorText: v('color-text'), colorTextSecondary: v('color-text-muted'),
      colorBgContainer: v('color-bg-surface'), colorBgElevated: v('color-bg-elevated'), colorBorder: v('color-border'),
      borderRadius: Number.parseFloat(v('radius-control')), fontFamily: v('font-family-control'), controlHeight: Number.parseFloat(v('control-height')),
    },
    components: {
      Button: { primaryShadow: v('shadow-surface'), defaultShadow: v('shadow-surface') },
      Drawer: { paddingLG: 28 },
      Modal: { borderRadiusLG: Number.parseFloat(v('radius-dialog')) },
    },
  }
}
