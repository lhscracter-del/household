import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatAmount } from '../../utils/format'
import Spinner from '../common/Spinner'
import EmptyState from '../common/EmptyState'

const COLOR_SCHEMES = {
  expense: ['#10B981', '#3B82F6', '#0EA5E9', '#F59E0B', '#EF4444', '#22C55E'],
  recurring: ['#0F766E', '#16A34A', '#047857', '#0E7490', '#166534', '#6EE7B7'],
}

export default function PaymentChart({
  data, isLoading, dataKey = 'total', title = '결제 수단별 지출', emptyMessage = '결제 수단 데이터가 없습니다.', colorScheme = 'expense',
}) {
  if (isLoading) return <Spinner />

  const chartData = data?.filter((d) => d[dataKey] > 0).map((d) => ({ ...d, name: d.payment_method_name })) ?? []
  if (!chartData.length) return <EmptyState message={emptyMessage} />

  const COLORS = COLOR_SCHEMES[colorScheme] ?? COLOR_SCHEMES.expense

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} dataKey={dataKey} nameKey="name" cx="50%" cy="50%" outerRadius={80}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatAmount(value)} />
          <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
