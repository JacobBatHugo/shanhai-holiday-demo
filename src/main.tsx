import '@ant-design/v5-patch-for-react-19'
import React from 'react'
import ReactDOM from 'react-dom/client'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/zh-cn'
import './shared/styles/tokens.css'
import './shared/components/schedule/qinglv/base.css'
import './shared/components/schedule/qinglv/week-navigation.css'
import './style.css'
import Demo from './Demo'

dayjs.extend(customParseFormat)
dayjs.locale('zh-cn')
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Demo /></React.StrictMode>)
