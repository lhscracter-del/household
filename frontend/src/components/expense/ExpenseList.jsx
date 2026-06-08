import ExpenseItem from './ExpenseItem'
import EmptyState from '../common/EmptyState'
import Spinner from '../common/Spinner'

export default function ExpenseList({ expenses, isLoading, onEdit, onDelete }) {
  if (isLoading) return <Spinner />
  if (!expenses?.length) return <EmptyState message="지출 내역이 없습니다." />

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
