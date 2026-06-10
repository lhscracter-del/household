import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSummary } from '../hooks/useStats'
import { useExpenses } from '../hooks/useExpenses'
import { useBudgets } from '../hooks/useBudgets'
import { useRecurring } from '../hooks/useRecurring'
import { PaymentBadge } from '../components/common/Badge'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { formatAmount, formatDateWithWeekday, groupExpensesByDate } from '../utils/format'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { clsx } from 'clsx'

export default function DashboardPage() {
  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const today = now.toISOString().slice(0, 10)
  // 이번 달 1일 계산 — 전체 기간이 아닌 이번 달 지출만 조회하여 전송 데이터 양을 줄임
  const startOfMonth = `${today.slice(0, 7)}-01`

  const { data: summary, isLoading: summaryLoading } = useSummary({ year, month })
  const { data: recentExpenses = [], isLoading: expensesLoading } = useExpenses({ start_date: startOfMonth, end_date: today })
  const { data: budgets = [] } = useBudgets(year)
  const { data: recurring = [], isLoading: recurringLoading } = useRecurring()
  const { data: paymentMethods = [] } = usePaymentMethods()
  const pmMap = Object.fromEntries(paymentMethods.map((pm) => [pm.id, pm]))

  const recentFive = recentExpenses.slice(0, 5)
  const recentGroups = groupExpensesByDate(recentFive)
  const monthlyBudget = budgets.find((b) => b.budget_type === 'monthly' && b.month === month)

  // 월 지출 (실제 기록된 지출)
  const monthlySpent = summary?.total ?? 0
  // 고정 지출 합계 (매월 반복 항목만)
  const monthlyRecurringTotal = recurring
    .filter((r) => r.cycle === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0)
  // 합산
  const combinedTotal = monthlySpent + monthlyRecurringTotal

  const budgetAmount = monthlyBudget?.amount ?? 0
  const budgetRate = budgetAmount ? Math.min((combinedTotal / budgetAmount) * 100, 100) : 0
  const isOver = combinedTotal > budgetAmount

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">대시보드</h2>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-300 mt-0.5">{year}년 {month}월 현황</p>
        </div>
        {/* <Link
          to="/expense"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + 지출 추가
        </Link> */}
      </div>

      {/* 이번달 합산 카드 */}
      {summaryLoading || recurringLoading ? (
        <Spinner />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">이번달 총 지출 (월 지출 + 고정 지출)</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">{formatAmount(combinedTotal)}</p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* 월 지출 */}
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 sm:p-4">
              <p className="text-xs text-blue-500 font-medium mb-1">월 지출</p>
              <p className="text-base sm:text-xl font-bold text-blue-700 dark:text-blue-300">{formatAmount(monthlySpent)}</p>
              <p className="text-xs text-blue-400 mt-1">{summary?.count ?? 0}건</p>
            </div>

            {/* 고정 지출 */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-emerald-500 font-medium">고정 지출</p>
                <Link to="/recur" className="text-xs text-emerald-500 hover:underline">관리</Link>
              </div>
              <p className="text-base sm:text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatAmount(monthlyRecurringTotal)}</p>
              <p className="text-xs text-emerald-400 mt-1">
                {recurring.filter((r) => r.cycle === 'monthly').length}건 (매월)
              </p>
            </div>
          </div>

          {/* 예산 대비 프로그레스 */}
          {budgetAmount > 0 ? (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">예산 {formatAmount(budgetAmount)}</span>
                <span className={clsx('text-xs font-medium', isOver ? 'text-red-500' : 'text-blue-500')}>
                  {isOver
                    ? `${formatAmount(combinedTotal - budgetAmount)} 초과`
                    : `${formatAmount(budgetAmount - combinedTotal)} 남음`}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all', isOver ? 'bg-red-400' : 'bg-blue-400')}
                  style={{ width: `${budgetRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-300 mt-1 text-right">{budgetRate.toFixed(1)}% 사용</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-300 mt-4 pt-4 border-t border-gray-100 dark:border-gray-600">
              <Link to="/budget" className="text-blue-500 underline">예산을 설정</Link>하면 지출 현황을 한눈에 볼 수 있어요.
            </p>
          )}
        </div>
      )}

      {/* 최근 월 지출 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">최근 월 지출</h3>
          <Link to="/expense" className="text-xs text-blue-500 hover:underline">전체 보기</Link>
        </div>
        {expensesLoading ? (
          <Spinner size="sm" />
        ) : recentFive.length ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentGroups.map((group) => (
              <div key={group.date} className="py-2">
                <div className="mb-1">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{formatDateWithWeekday(group.date)}</span>
                </div>
                {group.items.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-1.5">
                    {pmMap[e.payment_method_id] && (
                      <PaymentBadge paymentType={pmMap[e.payment_method_id].payment_type} name={pmMap[e.payment_method_id].name} />
                    )}
                    <div className="flex flex-col gap-0.5 items-end">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatAmount(e.amount)}</span>
                      {e.memo && <span className="text-xs text-gray-400 dark:text-gray-300">{e.memo}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="최근 지출 내역이 없어요." />
        )}
      </div>
    </div>
  )
}
