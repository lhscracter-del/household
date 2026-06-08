import { formatAmount } from '../../utils/format'
import { clsx } from 'clsx'

export default function BudgetProgress({ category, budgetAmount, spentAmount }) {
  const rate = budgetAmount ? Math.min((spentAmount / budgetAmount) * 100, 100) : 0
  const isOver = spentAmount > budgetAmount

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{category.icon} {category.name}</span>
        <span className={clsx('text-xs', isOver ? 'text-red-500 font-semibold' : 'text-gray-500')}>
          {formatAmount(spentAmount)} / {formatAmount(budgetAmount)}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', isOver ? 'bg-red-500' : 'bg-blue-500')}
          style={{ width: `${rate}%` }}
        />
      </div>
      {isOver && <p className="text-xs text-red-500 mt-1">예산 초과 {formatAmount(spentAmount - budgetAmount)}</p>}
    </div>
  )
}
