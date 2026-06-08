export const formatAmount = (amount) =>
  `${amount.toLocaleString('ko-KR')}원`

export const formatDate = (dateStr) =>
  dateStr.replace(/-/g, '.')

export const formatDiff = (current, prev) => {
  if (!prev) return null
  const diff = ((current - prev) / prev * 100).toFixed(1)
  return diff > 0 ? `+${diff}%` : `${diff}%`
}
