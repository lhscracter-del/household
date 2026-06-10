export const DAY_OPTIONS = [
  { value: 0, label: '미설정' },
  ...Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}일` })),
]

export const WEEKDAY_OPTIONS = [
  { value: 0, label: '미설정' },
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' },
  { value: 7, label: '일요일' },
]

function localDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function calcNextDueDate(day, cycle) {
  const today = new Date()
  if (!day) return localDateStr(today)

  if (cycle === 'monthly') {
    const y = today.getFullYear()
    const m = today.getMonth()
    const lastDay = new Date(y, m + 1, 0).getDate()
    const d = Math.min(day, lastDay)
    const candidate = new Date(y, m, d)
    if (candidate >= today) return localDateStr(candidate)
    const nm = m + 1 > 11 ? 0 : m + 1
    const ny = m + 1 > 11 ? y + 1 : y
    const lastDay2 = new Date(ny, nm + 1, 0).getDate()
    return localDateStr(new Date(ny, nm, Math.min(day, lastDay2)))
  }

  if (cycle === 'weekly') {
    const jsDay = day === 7 ? 0 : day
    const cur = today.getDay()
    let diff = jsDay - cur
    if (diff <= 0) diff += 7
    const next = new Date(today)
    next.setDate(today.getDate() + diff)
    return localDateStr(next)
  }

  return localDateStr(today)
}

export function formatDueLabel(item) {
  if (item.cycle === 'monthly') {
    const d = new Date(item.next_due_date).getUTCDate()
    return `매월 ${d}일`
  }
  if (item.cycle === 'weekly') {
    const DAYS = ['일', '월', '화', '수', '목', '금', '토']
    const d = new Date(item.next_due_date).getUTCDay()
    return `매주 ${DAYS[d]}요일`
  }
  return item.next_due_date
}

export function extractDueDay(item) {
  const date = new Date(item.next_due_date)
  if (item.cycle === 'monthly') return date.getUTCDate()
  if (item.cycle === 'weekly') {
    const jsDay = date.getUTCDay()
    return jsDay === 0 ? 7 : jsDay
  }
  return 0
}
