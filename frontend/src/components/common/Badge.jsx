import { clsx } from 'clsx'

const PAYMENT_TYPE_COLORS = {
  cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  check_card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  credit_card: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

// paymentType: 대분류(cash/check_card/credit_card), name: 소분류 별칭
export function PaymentBadge({ paymentType, name }) {
  const colorCls = PAYMENT_TYPE_COLORS[paymentType] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', colorCls)}>
      {name || paymentType}
    </span>
  )
}

export function CategoryBadge({ name, color, icon }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium dark:text-gray-200"
      style={{ backgroundColor: color ? `${color}30` : '#374151', color: color || undefined }}
    >
      {icon} {name}
    </span>
  )
}
