import { formatAmount } from '../../utils/format'
import Button from '../common/Button'

export default function ExpenseItem({ expense, paymentMethodMap, categoryMap, onEdit, onDelete }) {
  const pm = paymentMethodMap?.[expense.payment_method_id]
  const cat = categoryMap?.[expense.category_id]

  return (
    <div className="flex items-center justify-between py-2 gap-2">
      <div className="flex flex-col gap-1 min-w-0">
        {pm && <span className="text-xs text-gray-500 dark:text-gray-400">{pm.name}</span>}
        <span className="font-semibold text-base text-gray-900 dark:text-gray-100">{formatAmount(expense.amount)}</span>
        {(cat || expense.memo) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 min-w-0">
            {cat && <span className="flex-shrink-0">{cat.icon} {cat.name}</span>}
            {expense.memo && <span className="truncate">{expense.memo}</span>}
          </div>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onEdit(expense)} className="px-3 py-2 min-h-[44px]">수정</Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(expense.id)} className="px-3 py-2 min-h-[44px] text-red-500 hover:text-red-600">삭제</Button>
      </div>
    </div>
  )
}
