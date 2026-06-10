import { useMemo } from 'react'
import ExpenseItem from './ExpenseItem'
import EmptyState from '../common/EmptyState'
import Spinner from '../common/Spinner'
import { usePaymentMethods } from '../../hooks/usePaymentMethods'
import { useCategories } from '../../hooks/useCategories'
import { formatDateWithWeekday, groupExpensesByDate } from '../../utils/format'

export default function ExpenseList({ expenses, isLoading, onEdit, onDelete }) {
  const { data: paymentMethods = [] } = usePaymentMethods()
  const { data: categories = [] } = useCategories()
  const pmMap = useMemo(
    () => Object.fromEntries(paymentMethods.map((pm) => [pm.id, pm])),
    [paymentMethods]
  )
  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )
  const groups = useMemo(() => groupExpensesByDate(expenses), [expenses])

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
      <Spinner />
      <p className="mt-3 text-sm">지출 내역을 불러오는 중...</p>
    </div>
  )
  if (!expenses?.length) return <EmptyState message="선택한 날짜에 지출 내역이 없어요. 오늘 쓴 돈을 기록해보세요! 💰" />

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 divide-y divide-gray-100 dark:divide-gray-700">
      {groups.map((group) => (
        <div key={group.date} className="py-2">
          <div className="py-1.5">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{formatDateWithWeekday(group.date)}</span>
          </div>
          {group.items.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              paymentMethodMap={pmMap}
              categoryMap={catMap}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
