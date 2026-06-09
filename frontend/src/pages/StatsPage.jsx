import { useState, useMemo } from 'react'
import { useByCategory, useByPayment, useTrend } from '../hooks/useStats'
import TrendChart from '../components/stats/TrendChart'
import CategoryChart from '../components/stats/CategoryChart'
import PaymentChart from '../components/stats/PaymentChart'
import { formatAmount } from '../utils/format'
import { clsx } from 'clsx'

const TREND_TABS = [
  { key: 'monthly', label: '월별' },
  { key: 'weekly', label: '주별' },
]

const selectCls = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100'

export default function StatsPage() {
  const now = useMemo(() => new Date(), [])
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [trendType, setTrendType] = useState('monthly')

  const { data: categoryData, isLoading: isCategoryLoading } = useByCategory({ year, month })
  const { data: paymentData, isLoading: isPaymentLoading } = useByPayment({ year, month })
  const { data: trendData, isLoading: isTrendLoading } = useTrend(
    trendType === 'monthly'
      ? { type: 'monthly', year }
      : { type: 'weekly', year, month }
  )

  const totalByCategory = categoryData?.reduce((s, c) => s + c.total, 0) ?? 0

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">통계</h2>
        <div className="flex gap-2">
          <select className={selectCls} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 4 }, (_, i) => now.getFullYear() - 1 + i).map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select className={selectCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
      </div>

      {/* 소비 트렌드 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">소비 트렌드</h3>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            {TREND_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTrendType(tab.key)}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  trendType === tab.key
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <TrendChart
          data={trendData}
          isLoading={isTrendLoading}
          title={trendType === 'monthly' ? `${year}년 월별 소비` : `${year}년 ${month}월 주별 소비`}
        />
      </div>

      {/* 카테고리 & 결제수단 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <CategoryChart data={categoryData} isLoading={isCategoryLoading} />
        <PaymentChart data={paymentData} isLoading={isPaymentLoading} />
      </div>

      {!categoryData?.length && !isCategoryLoading && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
          이번 달 지출 데이터가 없어요. 지출을 기록하면 통계가 표시됩니다.
        </div>
      )}

      {/* 카테고리별 상세 테이블 */}
      {categoryData?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 sm:mb-4">카테고리별 상세</h3>
          <div className="flex flex-col gap-2">
            {categoryData.map((item) => {
              const ratio = totalByCategory ? (item.total / totalByCategory * 100).toFixed(1) : 0
              return (
                <div key={item.category_id ?? 'none'} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm w-16 sm:w-20 text-gray-600 dark:text-gray-300 truncate">{item.category_name}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${ratio}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-8 sm:w-10 text-right">{ratio}%</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 w-20 sm:w-24 text-right">
                    {formatAmount(item.total)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
