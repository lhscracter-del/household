import { clsx } from 'clsx'

const PAYMENT_COLORS = {
  cash: 'bg-green-100 text-green-700',
  check_card: 'bg-blue-100 text-blue-700',
  credit_card: 'bg-purple-100 text-purple-700',
}

const PAYMENT_LABELS = {
  cash: '현금',
  check_card: '체크카드',
  credit_card: '신용카드',
}

export function PaymentBadge({ method }) {
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', PAYMENT_COLORS[method])}>
      {PAYMENT_LABELS[method] || method}
    </span>
  )
}

export function CategoryBadge({ name, color, icon }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: color ? `${color}20` : '#f3f4f6', color: color || '#374151' }}
    >
      {icon} {name}
    </span>
  )
}
