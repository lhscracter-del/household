import { PAYMENT_METHODS } from '../../utils/constants'

export default function ExpenseFilter({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="date"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
        value={filters.start_date || ''}
        onChange={(e) => onChange({ ...filters, start_date: e.target.value || undefined })}
      />
      <span className="text-gray-400 text-sm">~</span>
      <input
        type="date"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
        value={filters.end_date || ''}
        onChange={(e) => onChange({ ...filters, end_date: e.target.value || undefined })}
      />
      <select
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
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
