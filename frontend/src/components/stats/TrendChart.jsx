import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatAmount } from '../../utils/format'
import Spinner from '../common/Spinner'
import EmptyState from '../common/EmptyState'

export default function TrendChart({ data, isLoading, onBarClick, selectedIndex }) {
  if (isLoading) return <Spinner />
  if (!data?.length || data.every((d) => d.total === 0)) return <EmptyState message="이 기간의 지출 데이터가 없어요." />

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
        <Tooltip formatter={(value) => [formatAmount(value), '지출']} />
        <Bar
          dataKey="total"
          radius={[4, 4, 0, 0]}
          onClick={onBarClick ? (_, index) => onBarClick(index) : undefined}
          cursor={onBarClick ? 'pointer' : 'default'}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={selectedIndex === i ? '#1D4ED8' : '#3B82F6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
