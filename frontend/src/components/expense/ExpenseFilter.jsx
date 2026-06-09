import { PAYMENT_METHODS } from '../../utils/constants'

const inputCls = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100'

export default function ExpenseFilter({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="date"
        className={inputCls}
        value={filters.start_date || ''}
        onChange={(e) => onChange({ ...filters, start_date: e.target.value || undefined })}
      />
      <span className="text-gray-400 dark:text-gray-500 text-sm">~</span>
      <input
        type="date"
        className={inputCls}
        value={filters.end_date || ''}
        onChange={(e) => onChange({ ...filters, end_date: e.target.value || undefined })}
      />
      <select
        className={inputCls}
        value={filters.payment_method || 'all'}
        onChange={(e) => onChange({ ...filters, payment_method: e.target.value === 'all' ? undefined : e.target.value })}
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  )
}
