import { usePaymentMethods } from '../../hooks/usePaymentMethods'
import { PAYMENT_TYPE_LABELS } from '../../utils/constants'

const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100'

function groupByType(paymentMethods) {
  return paymentMethods.reduce((acc, pm) => {
    if (!acc[pm.payment_type]) acc[pm.payment_type] = []
    acc[pm.payment_type].push(pm)
    return acc
  }, {})
}

export default function ExpenseFilter({ filters, onChange }) {
  const { data: paymentMethods = [] } = usePaymentMethods()
  const grouped = groupByType(paymentMethods)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
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
  )
}
