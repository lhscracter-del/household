import { useFilterStore } from '../store/filterStore'
import { useSummary, useByCategory, useTrend } from '../hooks/useStats'
import SummaryCards from '../components/stats/SummaryCards'
import TrendChart from '../components/stats/TrendChart'
import CategoryChart from '../components/stats/CategoryChart'

export default function DashboardPage() {
  const { year, month } = useFilterStore()
  const { data: summary, isLoading: summaryLoading } = useSummary({ year, month })
  const { data: categoryData, isLoading: categoryLoading } = useByCategory({ year, month })
  const { data: trendData, isLoading: trendLoading } = useTrend({ type: 'monthly', year })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          {year}년 {month}월 대시보드
        </h2>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
            value={month}
            onChange={(e) => useFilterStore.getState().setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
            value={year}
            onChange={(e) => useFilterStore.getState().setYear(Number(e.target.value))}
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>
      </div>

      <SummaryCards data={summary} isLoading={summaryLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={trendData} isLoading={trendLoading} title={`${year}년 월별 소비`} />
        <CategoryChart data={categoryData} isLoading={categoryLoading} />
      </div>
    </div>
  )
}
