import { forwardRef } from 'react'
import { PAYMENT_TYPE_LABELS } from '../../utils/constants'

function groupByType(paymentMethods) {
  return paymentMethods.reduce((acc, pm) => {
    if (!acc[pm.payment_type]) acc[pm.payment_type] = []
    acc[pm.payment_type].push(pm)
    return acc
  }, {})
}

const PaymentMethodSelect = forwardRef(function PaymentMethodSelect(
  { paymentMethods = [], includeAll, className, ...props },
  ref
) {
  const grouped = groupByType(paymentMethods)

  return (
    <select ref={ref} className={className} {...props}>
      {includeAll && <option value="">전체 결제수단</option>}
      {Object.entries(grouped).map(([type, methods]) => (
        <optgroup key={type} label={PAYMENT_TYPE_LABELS[type] || type}>
          {methods.map((pm) => (
            <option key={pm.id} value={pm.id}>{pm.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
})

export default PaymentMethodSelect
