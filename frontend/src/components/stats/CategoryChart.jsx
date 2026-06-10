import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatAmount } from '../../utils/format'
import Spinner from '../common/Spinner'
import EmptyState from '../common/EmptyState'

const COLOR_SCHEMES = {
  expense: ['#3B82F6', '#0EA5E9', '#22C55E', '#EAB308', '#F97316', '#EF4444', '#06B6D4', '#84CC16', '#6B7280'],
  recurring: ['#14B8A6', '#047857', '#0F766E', '#6EE7B7', '#0E7490', '#5EEAD4', '#16A34A', '#166534', '#6B7280'],
}

export default function CategoryChart({
  data, isLoading, dataKey = 'total', title = '카테고리별 지출', emptyMessage = '카테고리 데이터가 없습니다.', colorScheme = 'expense',
}) {
  if (isLoading) return <Spinner />

  const chartData = data?.filter((d) => d[dataKey] > 0) ?? []
  if (!chartData.length) return <EmptyState message={emptyMessage} />

  const COLORS = COLOR_SCHEMES[colorScheme] ?? COLOR_SCHEMES.expense

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} dataKey={dataKey} nameKey="category_name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
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
