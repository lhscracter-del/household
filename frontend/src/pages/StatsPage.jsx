import { useState, useMemo, useEffect } from 'react'
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

// 해당 날짜가 월 중 몇 주차인지 계산 (1~5)
function getWeekOfMonth(date) {
  return Math.min(Math.floor((date.getDate() - 1) / 7) + 1, 5)
}

// 연/월/주차에 해당하는 날짜 범위 계산
function getWeekRange(year, month, week) {
  const lastDay = new Date(year, month, 0).getDate()
  const startDay = (week - 1) * 7 + 1
  if (startDay > lastDay) return null
  const endDay = Math.min(week * 7, lastDay)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    start_date: `${year}-${pad(month)}-${pad(startDay)}`,
    end_date: `${year}-${pad(month)}-${pad(endDay)}`,
  }
}

// 기본 선택 주차: 조회 중인 연/월이 이번 달이면 현재 주, 아니면 1주차
function getDefaultWeek(year, month, now) {
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  return isCurrentMonth ? getWeekOfMonth(now) : 1
}

// 기본 선택 월: 조회 중인 연도가 올해면 이번 달, 아니면 1월
function getDefaultMonth(year, now) {
  return year === now.getFullYear() ? now.getMonth() + 1 : 1
}

export default function StatsPage() {
  const now = useMemo(() => new Date(), [])
  const [year, setYear] = useState(now.getFullYear())
  const [trendType, setTrendType] = useState('monthly')
  const [selectedMonth, setSelectedMonth] = useState(() => getDefaultMonth(year, now))
  const [selectedWeek, setSelectedWeek] = useState(() => getDefaultWeek(year, selectedMonth, now))

  // 연도가 바뀌면 기본 선택 월(이번 달 또는 1월)로 초기화
  useEffect(() => {
    setSelectedMonth(getDefaultMonth(year, now))
  }, [year, now])

  // 주별 탭으로 전환하거나 선택 연/월이 바뀌면 기본 선택 주차(현재 주)로 초기화
  useEffect(() => {
    if (trendType === 'weekly') {
      setSelectedWeek(getDefaultWeek(year, selectedMonth, now))
    }
  }, [trendType, year, selectedMonth, now])

  const isWeekly = trendType === 'weekly'
  const weekRange = isWeekly ? getWeekRange(year, selectedMonth, selectedWeek) : null

  // 월별 데이터 (반복지출 섹션, 월별 모드의 일반지출 섹션에서 사용)
  const { data: monthlyCategoryData, isLoading: isMonthlyCategoryLoading } = useByCategory({ year, month: selectedMonth })
  const { data: monthlyPaymentData, isLoading: isMonthlyPaymentLoading } = useByPayment({ year, month: selectedMonth })

  // 주별 모드: 선택한 주의 일반지출 데이터
  const { data: weekCategoryData, isLoading: isWeekCategoryLoading } = useByCategory(weekRange ?? {})
  const { data: weekPaymentData, isLoading: isWeekPaymentLoading } = useByPayment(weekRange ?? {})

  const { data: trendData, isLoading: isTrendLoading } = useTrend(
    trendType === 'monthly'
      ? { type: 'monthly', year }
      : { type: 'weekly', year, month: selectedMonth }
  )

  const categoryData = isWeekly ? weekCategoryData : monthlyCategoryData
  const paymentData = isWeekly ? weekPaymentData : monthlyPaymentData
  const isCategoryLoading = isWeekly ? isWeekCategoryLoading : isMonthlyCategoryLoading
  const isPaymentLoading = isWeekly ? isWeekPaymentLoading : isMonthlyPaymentLoading

  const expenseCategoryData = categoryData?.filter((c) => c.expense_total > 0) ?? []
  const recurringCategoryData = monthlyCategoryData?.filter((c) => c.recurring_total > 0) ?? []
  const hasRecurring = recurringCategoryData.length > 0

  const totalByCategory = expenseCategoryData.reduce((s, c) => s + c.expense_total, 0)
  const totalRecurringByCategory = recurringCategoryData.reduce((s, c) => s + c.recurring_total, 0)

  const expenseTitleSuffix = isWeekly ? `${selectedWeek}주차 ` : ''
  const expenseEmptyMessage = isWeekly ? '이 주의 지출 데이터가 없습니다.' : '일반 지출 데이터가 없습니다.'

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">통계</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{selectedMonth}월 소비</span>
        </div>
        <div className="flex gap-2">
          <select className={selectCls} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 4 }, (_, i) => now.getFullYear() - 1 + i).map((y) => <option key={y} value={y}>{y}년</option>)}
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
          title={trendType === 'monthly' ? `${year}년 월별 소비` : `${year}년 ${selectedMonth}월 주별 소비`}
          onBarClick={isWeekly ? (index) => setSelectedWeek(index + 1) : (index) => setSelectedMonth(index + 1)}
          selectedIndex={isWeekly ? selectedWeek - 1 : selectedMonth - 1}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
          {isWeekly ? '막대를 클릭하면 해당 주의 일반 지출 통계를 볼 수 있어요.' : '막대를 클릭하면 해당 월의 일반 지출 통계를 볼 수 있어요.'}
        </p>
      </div>

      {/* 일반 지출 그룹 */}
      <section className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
        <div className="flex items-center gap-2 px-1">
          <span className="text-base">💳</span>
          <h2 className="text-sm font-bold text-blue-700 dark:text-blue-300">일반 지출 통계</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <CategoryChart
            data={categoryData}
            isLoading={isCategoryLoading}
            dataKey="expense_total"
            title={`${expenseTitleSuffix}카테고리별 지출`}
            emptyMessage={expenseEmptyMessage}
            colorScheme="expense"
          />
          <PaymentChart
            data={paymentData}
            isLoading={isPaymentLoading}
            dataKey="expense_total"
            title={`${expenseTitleSuffix}결제 수단별 지출`}
            emptyMessage={expenseEmptyMessage}
            colorScheme="expense"
          />
        </div>

        {!expenseCategoryData.length && !isCategoryLoading && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            {isWeekly ? '이 주에 지출 데이터가 없어요.' : '이번 달 지출 데이터가 없어요.'} 지출을 기록하면 통계가 표시됩니다.
          </div>
        )}

        {/* 일반 지출 상세 테이블 */}
        {expenseCategoryData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 sm:mb-4">{expenseTitleSuffix}일반 지출 상세</h3>
            <div className="flex flex-col gap-2">
              {expenseCategoryData.map((item) => {
                const ratio = totalByCategory ? (item.expense_total / totalByCategory * 100).toFixed(1) : 0
                return (
                  <div key={item.category_id ?? 'none'} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm w-16 sm:w-20 text-gray-600 dark:text-gray-300 truncate">{item.category_name}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${ratio}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-8 sm:w-10 text-right">{ratio}%</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 w-20 sm:w-24 text-right">
                      {formatAmount(item.expense_total)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* 반복지출 그룹 */}
      {hasRecurring && (
        <section className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-2 px-1">
            <span className="text-base">🔁</span>
            <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">반복지출 통계</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-300 font-medium">
              구독 / 정기결제
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <CategoryChart
              data={monthlyCategoryData}
              isLoading={isMonthlyCategoryLoading}
              dataKey="recurring_total"
              title="카테고리별 반복지출"
              emptyMessage="반복지출 데이터가 없습니다."
              colorScheme="recurring"
            />
            <PaymentChart
              data={monthlyPaymentData}
              isLoading={isMonthlyPaymentLoading}
              dataKey="recurring_total"
              title="결제 수단별 반복지출"
              emptyMessage="반복지출 데이터가 없습니다."
              colorScheme="recurring"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 sm:mb-4">반복지출 상세</h3>
            <div className="flex flex-col gap-2">
              {recurringCategoryData.map((item) => {
                const ratio = totalRecurringByCategory ? (item.recurring_total / totalRecurringByCategory * 100).toFixed(1) : 0
                return (
                  <div key={item.category_id ?? 'none'} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm w-16 sm:w-20 text-gray-600 dark:text-gray-300 truncate">{item.category_name}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${ratio}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-8 sm:w-10 text-right">{ratio}%</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 w-20 sm:w-24 text-right">
                      {formatAmount(item.recurring_total)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
