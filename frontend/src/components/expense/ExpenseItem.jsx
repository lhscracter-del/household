import { PaymentBadge } from '../common/Badge'
import { formatAmount, formatDate } from '../../utils/format'
import Button from '../common/Button'

export default function ExpenseItem({ expense, paymentMethodMap, onEdit, onDelete }) {
  const pm = paymentMethodMap?.[expense.payment_method_id]

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">{formatAmount(expense.amount)}</span>
          {pm && <PaymentBadge paymentType={pm.payment_type} name={pm.name} />}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDate(expense.date)}</span>
          {expense.memo && <span>· {expense.memo}</span>}
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(expense)} className="px-3 py-2 min-h-[44px]">수정</Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(expense.id)} className="px-3 py-2 min-h-[44px] text-red-500 hover:text-red-600">삭제</Button>
      </div>
    </div>
  )
}
