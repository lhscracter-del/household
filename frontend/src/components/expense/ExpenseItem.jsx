import { PaymentBadge } from '../common/Badge'
import { formatAmount, formatDate } from '../../utils/format'
import Button from '../common/Button'

export default function ExpenseItem({ expense, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{formatAmount(expense.amount)}</span>
          <PaymentBadge method={expense.payment_method} />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{formatDate(expense.date)}</span>
          {expense.memo && <span>· {expense.memo}</span>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(expense)}>수정</Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(expense.id)} className="text-red-500 hover:text-red-600">삭제</Button>
      </div>
    </div>
  )
}
