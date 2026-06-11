import { useState, useMemo } from 'react'
import { useBudgets, useUpsertBudget, useDeleteBudget } from '../hooks/useBudgets'
import { useSummary, useYearlyTotal } from '../hooks/useStats'
import { useRecurring } from '../hooks/useRecurring'
import { formatAmount } from '../utils/format'
import { clsx } from 'clsx'

const selectCls = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100'

function BudgetCard({ label, budget, spent, breakdown, breakdownLabels = { monthly: '월 지출', recurring: '고정 지출' }, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  const rate = budget ? Math.min((spent / budget) * 100, 100) : 0
  const isOver = spent > budget
  const remaining = budget - spent

  const handleSave = () => {
    const amount = Number(value)
    if (amount > 0) {
      onEdit(amount)
      setEditing(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{label}</h3>
        <div className="flex gap-2">
          {budget > 0 && (
            <>
              <button onClick={() => { setValue(String(budget)); setEditing(true) }} className="text-xs text-blue-500 hover:underline">수정</button>
              <button onClick={onDelete} className="text-xs text-red-400 hover:underline">삭제</button>
            </>
          )}
        </div>
      </div>

      {budget > 0 ? (
        <>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(spent)}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">예산 {formatAmount(budget)}</p>
            </div>
            <p className={clsx('text-sm font-medium', isOver ? 'text-red-500' : 'text-blue-500')}>
              {isOver ? `${formatAmount(Math.abs(remaining))} 초과` : `${formatAmount(remaining)} 남음`}
            </p>
          </div>

          <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
            <div
              className={clsx('h-full rounded-full transition-all', isOver ? 'bg-red-400' : 'bg-blue-400')}
              style={{ width: `${rate}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-right mb-4">{rate.toFixed(1)}% 사용</p>

          {breakdown && (
            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">{breakdownLabels.monthly}</p>
                <p className="text-base font-bold text-blue-700 dark:text-blue-300">{formatAmount(breakdown.monthly)}</p>
              </div>
              <div className="flex-1 bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                <p className="text-xs text-purple-500 dark:text-purple-400 font-medium mb-1">{breakdownLabels.recurring}</p>
                <p className="text-base font-bold text-purple-700 dark:text-purple-300">{formatAmount(breakdown.recurring)}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">예산이 설정되지 않았습니다.</p>
      )}

      {editing ? (
        <div className="flex gap-2 mt-4">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
            placeholder="금액 입력"
            autoFocus
          />
          <button onClick={handleSave} className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">저장</button>
          <button onClick={() => setEditing(false)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">취소</button>
        </div>
      ) : budget === 0 ? (
        <button
          onClick={() => setEditing(true)}
          className="mt-2 w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-400 dark:text-gray-500 hover:border-blue-300 hover:text-blue-400 transition-colors"
        >
          예산 설정하기
        </button>
      ) : null}
    </div>
  )
}

export default function BudgetPage() {
  const now = useMemo(() => new Date(), [])
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: budgets = [] } = useBudgets(year)
  const { data: monthlySummary } = useSummary({ year, month })
  const { data: yearlyTotal } = useYearlyTotal(year)
  const { data: recurring = [] } = useRecurring()
  const { mutate: upsert } = useUpsertBudget()
  const { mutate: remove } = useDeleteBudget()

  const monthlyBudget = budgets.find((b) => b.budget_type === 'monthly' && b.month === month)
  const yearlyBudget = budgets.find((b) => b.budget_type === 'yearly')

  const monthlyExpense = monthlySummary?.total ?? 0
  const recurringMonthly = recurring
    .filter((r) => r.cycle === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0)

  const monthlySpent = monthlyExpense + recurringMonthly
  const yearlySpent = (yearlyTotal?.total ?? 0) + recurringMonthly * 12

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">예산 관리</h2>
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

      <BudgetCard
        label={`${year}년 ${month}월 예산`}
        budget={monthlyBudget?.amount ?? 0}
        spent={monthlySpent}
        breakdown={{ monthly: monthlyExpense, recurring: recurringMonthly }}
        onEdit={(amount) => upsert({ budget_type: 'monthly', amount, year, month })}
        onDelete={monthlyBudget ? () => remove(monthlyBudget.id) : undefined}
      />

      <BudgetCard
        label={`${year}년 연간 예산`}
        budget={yearlyBudget?.amount ?? 0}
        spent={yearlySpent}
        breakdown={{ monthly: yearlyTotal?.total ?? 0, recurring: recurringMonthly * 12 }}
        breakdownLabels={{ monthly: '연 지출', recurring: '고정 지출(연)' }}
        onEdit={(amount) => upsert({ budget_type: 'yearly', amount, year })}
        onDelete={yearlyBudget ? () => remove(yearlyBudget.id) : undefined}
      />
    </div>
  )
}
