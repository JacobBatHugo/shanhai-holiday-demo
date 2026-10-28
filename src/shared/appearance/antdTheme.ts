import type { ThemeConfig } from 'antd'
import { designTokenReader } from './designTokens'

/** 仅覆盖颜色；各页面原有尺寸、字体和组件设置保持，不再读取旧夜间专用变量。 */
export function nightAntdTheme(base: ThemeConfig): ThemeConfig {
  const read = designTokenReader('dark')
  const color = (name: string) => read(`color-${name}`)
  return {
    ...base,
    token: { ...base.token,
      colorPrimary: color('primary'), colorInfo: color('primary'), colorSuccess: color('primary'),
      colorError: color('error'), colorWarning: color('warning'), colorLink: color('primary'),
      colorText: color('text'), colorTextSecondary: color('text-muted'), colorTextTertiary: color('text-muted'),
      colorTextLightSolid: color('on-primary'),
      colorTextQuaternary: color('text-muted'), colorTextPlaceholder: color('text-muted'), colorTextDisabled: color('text-disabled'),
      colorIcon: color('text-muted'), colorIconHover: color('text'),
      colorBgLayout: color('bg-page'), colorBgContainer: color('bg-surface'), colorBgElevated: color('bg-elevated'),
      colorBgContainerDisabled: color('bg-surface'), colorBorder: color('border-control'), colorBorderSecondary: color('border'), colorSplit: color('border'),
      colorBgTextHover: color('bg-hover'), colorBgTextActive: color('bg-selected'),
      colorPrimaryBg: color('bg-hover'), colorPrimaryBgHover: color('bg-selected'),
      colorSuccessBg: color('bg-hover'), colorSuccessBorder: color('primary'),
      colorInfoBg: color('bg-hover'), colorInfoBorder: color('primary'),
      colorWarningBg: color('warning-soft'), colorWarningBorder: color('warning'),
      colorErrorBg: color('error-soft'), colorErrorBorder: color('error'), colorBgMask: color('mask'),
    },
    components: {
      ...base.components,
      Button: { ...base.components?.Button, primaryColor: color('on-primary'), primaryShadow: 'none', defaultShadow: 'none', defaultBg: color('bg-surface'), defaultBorderColor: color('border-control'), defaultColor: color('text') },
      Select: { ...base.components?.Select, optionSelectedBg: color('bg-selected'), optionSelectedColor: color('text'), optionActiveBg: color('bg-hover') },
      Modal: { ...base.components?.Modal, contentBg: color('bg-elevated'), headerBg: color('bg-elevated') },
      Card: { ...base.components?.Card, colorBgContainer: color('bg-surface') },
      Tooltip: { ...base.components?.Tooltip, colorBgSpotlight: color('bg-selected') },
    },
  }
}
