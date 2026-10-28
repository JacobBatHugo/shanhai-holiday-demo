import type { ButtonHTMLAttributes } from 'react'

// Original line drawings share one ink, paper frame and scale with the timetable.
function HolidayMotif({ name }: { name: string }) {
  return <svg className="hd-holiday-motif" viewBox="0 0 120 180" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === '元旦' && <>
      <circle className="hd-art-wash" cx="61" cy="60" r="25" /><path d="M36 60a25 25 0 0 1 50 0M30 67h63M21 77h53m8 0h19M40 88h49" />
      <path d="M60 22v7M28 31l6 6m57-6-6 6M19 54h8m67 0h8M47 143c5-22 4-33 13-46m-12 34c-15-4-19-13-19-18 13 0 20 6 21 13m4-9c13-1 19-10 20-16-12-1-18 6-20 12" />
      <path className="hd-art-fine" d="M22 154q39-9 77-2M31 160q29-6 59-1" />
    </>}
    {name === '春节' && <>
      <path d="M61 21v16m-15 0h30m-29 5h28m-28 61h28m-28 5h28M61 109v18m-6-3v18m6-17v23m6-24v18" />
      <path className="hd-art-wash" d="M47 43c-28 11-29 47 0 59h28c27-12 27-48 0-59Z" />
      <path d="M47 43c-28 11-29 47 0 59h28c27-12 27-48 0-59ZM51 44c-14 15-14 41 0 57m20-57c14 15 14 41 0 57M61 44v57M32 66h58M32 81h58" />
      <path d="M17 156c21-7 26-10 34-24m-18 16-5-12m13 4 13 5" />
      <g className="hd-art-petal"><circle cx="27" cy="131" r="4" /><circle cx="22" cy="135" r="4" /><circle cx="25" cy="141" r="4" /><circle cx="31" cy="140" r="4" /><circle cx="33" cy="134" r="4" /></g>
    </>}
    {name === '清明节' && <>
      <path d="M18 25q45-4 86 19M38 28q-8 29 1 61M59 31q-10 42 0 80M83 38q-7 24-1 51" />
      <path className="hd-art-leaf" d="M36 42q-18 5-12 20 10-6 12-20Zm0 20q16 2 10 16-7-3-10-16Zm19-13q-16 6-13 21 11-7 13-21Zm1 28q17 2 12 18-9-7-12-18Zm25-23q-15 0-14 14 10-3 14-14Zm0 20q16 0 14 12-9-1-14-12Z" />
      <path d="m76 117 13-7-5 10 15 2-16 4-12 10 4-12-10-4 11-3Z" /><path className="hd-art-fine" d="m27 108-4 13m24-5-4 13m10 16-4 12M19 159q41-6 82-1" />
    </>}
    {name === '劳动节' && <>
      <path d="M36 146q29-39 25-112M83 147Q61 102 80 59" />
      <path className="hd-art-leaf" d="M60 48q-15-4-16-17 14 4 16 17Zm1 16q15-5 18-18-17 3-18 18Zm-2 15Q42 76 39 62q17 1 20 17Zm-4 19q16-1 22-13-18-2-22 13Zm-9 21q-16-5-19-18 17 1 19 18Zm32-43q-7-15 1-23 6 13-1 23Zm-3 15q14-2 20-15-17 1-20 15Zm0 18q-12-4-16-17 13 0 16 17Z" />
      <path d="m42 140 30 9m-34-2 31 9M26 151l-4 10m16-3-3 9m38-6 2 8" /><path className="hd-art-fine" d="M30 45h-8v9m66 63h10v10m-3 12 8 4" />
    </>}
    {name === '端午节' && <>
      <path className="hd-art-wash" d="m60 35-27 49 48 17 12-43Z" /><path d="m60 35-27 49 48 17 12-43ZM60 35l21 66m-48-17 60-26M46 61l40 21m-47-10 47 11M60 94l-4 17m5-15 4 17" />
      <path d="M19 136q44 21 83-5l-12 20H38L19 136Zm0 0-2-13 11 2 4 8m-16-11-5-5m25 11 4 23m15-18 4 18m17-18-2 18" /><path className="hd-art-fine" d="M17 159q9-5 18 0t18 0 18 0 18 0 18 0M27 168q9-5 18 0t18 0 18 0" />
    </>}
    {name === '中秋节' && <>
      <circle className="hd-art-wash" cx="55" cy="61" r="31" /><circle cx="55" cy="61" r="31" /><path className="hd-art-fine" d="M37 42q-9 11-8 23m3 9 3 5M24 96h33m10 0h19M37 105h56" />
      <path d="M92 159q-14-44-8-82m2 29 17-16m-19 36-21-15m28 34 14-14" />
      <path className="hd-art-leaf" d="M85 102q-16-3-17-17 15 2 17 17Zm9-4q14-1 14-15-12 2-14 15Zm-12 28q-15 4-20-8 15-4 20 8Zm7 14q15 1 16-11-14-2-16 11Z" />
      <g className="hd-art-petal"><circle cx="79" cy="112" r="3" /><circle cx="85" cy="113" r="3" /><circle cx="82" cy="118" r="3" /></g>
    </>}
    {name === '国庆节' && <>
      <circle className="hd-art-wash" cx="77" cy="54" r="23" /><path d="M31 91V29m0 3q16-10 33 0v27q-17-10-33 0m8-15 2-5 2 5 5 .5-4 3 1 5-4-3-4 3 1-5-4-3Z" />
      <path className="hd-art-wash" d="m16 130 26-34 14 17 19-30 30 47Z" /><path d="m15 130 27-34 14 17 19-30 31 47M34 107l8 6 6-7m17-8 10 9 7-7M24 138h70M32 149h25m9 0h31M43 159h34" />
    </>}
  </svg>
}

export function HolidayFace({ name }: { name: string }) {
  return <><span className="hd-holiday-name">{name}</span><HolidayMotif name={name} /><span className="hd-holiday-endmark" aria-hidden="true" /></>
}

export default function HolidayCard({ name, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { name: string }) {
  return <button {...props} className="hd-holiday" data-holiday={name}><HolidayFace name={name} /></button>
}
