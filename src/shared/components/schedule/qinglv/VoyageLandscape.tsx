import { useEffect, useRef, useState } from 'react'
import headerLandscape from '../../../assets/qinglv/detail-voyage-landscape.png'
import styles from './ScheduleHeading.module.css'

const route = 'M448 181 C550 179 595 192 702 186 S861 172 952 179 S1056 187 1118 178'
function Boat() {
 return <g strokeLinecap="round" strokeLinejoin="round">
   {/* Broken washes and a low hull sit in the same quiet water as the landscape. */}
   <g fill="none" stroke="#829a8e" strokeWidth=".65" opacity=".32">
     <path d="M-29 4Q-12 2 8 4M-19 7Q-3 5 17 6M-9 10H8M19 3H27"/>
   </g>
   <path d="M-11 4Q0 6 13 4L8 8H-6Z" fill="#81968a" opacity=".16"/>
   <path d="M-20-3Q-5 1 12-2L23-5Q19 1 13 3Q-3 5-15 1Z" fill="#7e897b" stroke="#65776c" strokeWidth=".65"/>
   <path d="M-17-2Q0 2 18-2M-12 1Q0 4 12 2" fill="none" stroke="#c1b599" strokeWidth=".7"/>
   <path d="M-4-3L-3-30" stroke="#897e66" strokeWidth=".85"/>
   <path d="M-4-28Q-13-19-14-8Q-9-6-4-6Z" fill="#d0c6ac" stroke="#a49c83" strokeWidth=".55"/>
   <path d="M-2-28Q6-23 11-10Q5-7-2-6Z" fill="#e7deca" stroke="#b1a68b" strokeWidth=".55"/>
   <path d="M-1-26Q5-20 8-11L-1-8Z" fill="#c7bca1" opacity=".32"/>
   <g fill="none" stroke="#a99e83" strokeWidth=".45" opacity=".75">
     <path d="M-10-20L-4-19M-12-15L-4-14M-13-10L-4-9M-1-21L4-20M-1-16L7-15M-1-11L9-11"/>
     <path d="M-3-29L-18-2M-2-28L17-2" opacity=".6"/>
   </g>
   <path d="M4-3Q5-8 10-7Q13-7 15-3Z" fill="#a6aa94" stroke="#7e8b78" strokeWidth=".55"/>
   <path d="M7-6L7-3M10-6V-3" stroke="#d4ccb5" strokeWidth=".6"/>
   <path d="M-16-4L-24 3" stroke="#8e866f" strokeWidth=".65"/>
 </g>
}

export default function VoyageLandscape({ week, total, currentWeek }: { week: number; total: number; currentWeek: number }) {
 const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width:760px)').matches)
 useEffect(() => { const media = window.matchMedia('(max-width:760px)'); const update = () => setNarrow(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update) }, [])
 const path = useRef<SVGPathElement>(null), vessel = useRef<SVGGElement>(null)
 const position = useRef(total > 1 ? (week - 1) / (total - 1) : 0)
 const [points, setPoints] = useState<{x:number;y:number}[]>([])
 useEffect(() => { const p = path.current!; if (!p.getTotalLength) return; const l = p.getTotalLength(); setPoints(Array.from({length:total},(_,i)=> {const v=p.getPointAtLength(total > 1 ? l*i/(total-1) : 0);return {x:v.x,y:v.y}})) }, [total])
 useEffect(() => {
   const p = path.current!, boat = vessel.current!
   if (!p.getTotalLength) return
   const length = p.getTotalLength(), target = total > 1 ? Math.min(1, Math.max(0, (week-1)/(total-1))) : 0, start = position.current
   const media = window.matchMedia('(prefers-reduced-motion: reduce)')
   let frame = 0
   const render = (value:number) => {position.current=value; const point=p.getPointAtLength(value*length);boat.setAttribute('transform',`translate(${point.x} ${point.y})`)}
   const begin=performance.now(), duration=Math.min(420,300+Math.abs(target-start)*120)
   const tick=(now:number)=>{const t=Math.min(1,(now-begin)/duration);render(start+(target-start)*(t*t*(3-2*t)));if(t<1)frame=requestAnimationFrame(tick)}
   const reduce=()=>{if(media.matches){cancelAnimationFrame(frame);render(target)}}
   if(media.matches)render(target);else frame=requestAnimationFrame(tick)
   media.addEventListener('change',reduce)
   return()=>{cancelAnimationFrame(frame);media.removeEventListener('change',reduce)}
 },[week,total])
 const active=points[week-1]
 return <svg className={styles.voyageMap} viewBox={narrow ? "400 65 800 155" : "0 0 1200 220"} preserveAspectRatio="none" aria-hidden="true">
   <image className={styles.headerLandscape} href={headerLandscape} x="390" y="-37" width="810" height="272" preserveAspectRatio="none"/>
   <path ref={path} d={route} fill="none" stroke="var(--voyage-route)" strokeWidth="1" opacity=".7"/>
   <path d="M1118 178Q1194 181 1200 204H0" fill="none" stroke="var(--voyage-waterline)" strokeWidth=".7" opacity=".5"/>
   {points.map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y})`}><path d="M0-3V3" stroke={i===week-1?'var(--voyage-active-tick)':'var(--voyage-tick)'} strokeWidth={i===week-1?1.5:.7} opacity={i===week-1?1:.4}/>{i===currentWeek-1&&<circle cy="6" r="1.7" fill="var(--voyage-current-week)"/>}</g>)}
   {active&&<g className={styles.routeLabel} transform={`translate(${Math.min(1058,Math.max(475,active.x))} ${active.y>130?active.y-47:active.y+30})`}><path d="M-31-15h73v23h-73" fill="var(--auth-paper)" opacity=".94"/><path d="M-31-15v23" stroke="#ad503d"/><text x="-21" y="1" fill="var(--voyage-label-ink)" fontSize="16" fontFamily="Georgia,serif">{String(week).padStart(2,'0')}<tspan fill="var(--voyage-label-muted)" fontSize="10"> / {total}</tspan></text></g>}
   <g ref={vessel} data-voyage-boat transform="translate(448 181)"><g className={styles.boatShape}><Boat/></g></g>
 </svg>
}
