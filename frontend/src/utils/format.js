export const formatAmount = (amount) =>
  `${(amount ?? 0).toLocaleString('ko-KR')}원`

export const formatDate = (dateStr) =>
  dateStr ? dateStr.replace(/-/g, '.') : ''

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export const formatDateWithWeekday = (dateStr) => {
  if (!dateStr) return ''
  const weekday = WEEKDAYS[new Date(dateStr).getDay()]
  return `${formatDate(dateStr)} (${weekday})`
}

// 날짜순으로 정렬된 지출 목록을 같은 날짜끼리 그룹화
export const groupExpensesByDate = (expenses = []) => {
  const groups = []
  for (const expense of expenses) {
    const last = groups[groups.length - 1]
    if (last && last.date === expense.date) {
      last.items.push(expense)
    } else {
      groups.push({ date: expense.date, items: [expense] })
    }
  }
  return groups
}

export const formatDiff = (current, prev) => {
  if (!prev) return null
  const diff = ((current - prev) / prev * 100).toFixed(1)
  return diff > 0 ? `+${diff}%` : `${diff}%`
}
