import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatAmount } from '../../utils/format'
import Spinner from '../common/Spinner'
import EmptyState from '../common/EmptyState'

const PAYMENT_LABELS = { cash: '현금', check_card: '체크카드', credit_card: '신용카드' }
const COLORS = ['#10B981', '#3B82F6', '#8B5CF6']

export default function PaymentChart({ data, isLoading }) {
  if (isLoading) return <Spinner />
  if (!data?.length) return <EmptyState message="결제 수단 데이터가 없습니다." />

  const chartData = data.map((d) => ({ ...d, name: PAYMENT_LABELS[d.payment_method] || d.payment_method }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">결제 수단별 지출</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
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
