import { usePaymentMethods } from '../../hooks/usePaymentMethods'
import { PAYMENT_TYPE_LABELS } from '../../utils/constants'
import { clsx } from 'clsx'

const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100'

const RANGES = [
  { label: '오늘', days: 0 },
  { label: '1주', days: 7 },
  { label: '1개월', months: 1 },
  { label: '3개월', months: 3 },
  { label: '6개월', months: 6 },
]

function calcRange(range) {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  const from = new Date(today)
  if (range.days) from.setDate(from.getDate() - range.days)
  if (range.months) from.setMonth(from.getMonth() - range.months)
  return { start_date: from.toISOString().slice(0, 10), end_date: end }
}

function groupByType(paymentMethods) {
  return paymentMethods.reduce((acc, pm) => {
    if (!acc[pm.payment_type]) acc[pm.payment_type] = []
    acc[pm.payment_type].push(pm)
    return acc
  }, {})
}

export default function ExpenseFilter({ filters, order, onChange, onOrderChange }) {
  const { data: paymentMethods = [] } = usePaymentMethods()
  const grouped = groupByType(paymentMethods)

  const activeRange = RANGES.find((r) => {
    const { start_date } = calcRange(r)
    return filters.start_date === start_date
  })

  return (
    <div className="flex flex-col gap-2">
      {/* 기간 빠른 선택 + 정렬 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 flex-wrap">
          {RANGES.map((r) => {
            const isActive = activeRange?.label === r.label
            return (
              <button
                key={r.label}
                onClick={() => onChange({ ...filters, ...calcRange(r) })}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {r.label}
              </button>
            )
          })}
        </div>
        {/* 정렬 토글 */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
          {[{ value: 'desc', label: '최신순' }, { value: 'asc', label: '과거순' }].map((o) => (
            <button
              key={o.value}
              onClick={() => onOrderChange(o.value)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                order === o.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* 날짜 직접 입력 + 결제수단 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="date"
            className={inputCls}
            value={filters.start_date || ''}
            onChange={(e) => onChange({ ...filters, start_date: e.target.value || undefined })}
          />
          <span className="text-gray-400 dark:text-gray-500 text-sm flex-shrink-0">~</span>
          <input
            type="date"
            className={inputCls}
            value={filters.end_date || ''}
            onChange={(e) => onChange({ ...filters, end_date: e.target.value || undefined })}
          />
        </div>
        <select
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
          value={filters.payment_method_id || ''}
          onChange={(e) => onChange({ ...filters, payment_method_id: e.target.value || undefined })}
        >
          <option value="">전체 결제수단</option>
          {Object.entries(grouped).map(([type, methods]) => (
            <optgroup key={type} label={PAYMENT_TYPE_LABELS[type] || type}>
              {methods.map((pm) => (
                <option key={pm.id} value={pm.id}>{pm.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  )
}
