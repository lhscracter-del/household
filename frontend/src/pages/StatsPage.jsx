import { useState } from 'react'
import { useSummary, useByCategory, useByPayment, useTrend } from '../hooks/useStats'
import SummaryCards from '../components/stats/SummaryCards'
import TrendChart from '../components/stats/TrendChart'
import CategoryChart from '../components/stats/CategoryChart'
import PaymentChart from '../components/stats/PaymentChart'

export default function StatsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: summary, isLoading: sl } = useSummary({ year, month })
  const { data: categoryData, isLoading: cl } = useByCategory({ year, month })
  const { data: paymentData, isLoading: pl } = useByPayment({ year, month })
  const { data: trendData, isLoading: tl } = useTrend({ type: 'monthly', year })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">통계</h2>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
        </div>
      </div>

      <SummaryCards data={summary} isLoading={sl} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={trendData} isLoading={tl} title={`${year}년 월별 소비 추이`} />
        <CategoryChart data={categoryData} isLoading={cl} />
        <PaymentChart data={paymentData} isLoading={pl} />
      </div>
    </div>
  )
}
