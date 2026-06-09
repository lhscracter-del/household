import { useForm } from 'react-hook-form'
import Input from '../common/Input'
import Button from '../common/Button'
import { useCategories } from '../../hooks/useCategories'
import { usePaymentMethods } from '../../hooks/usePaymentMethods'
import { PAYMENT_TYPE_LABELS } from '../../utils/constants'

const selectCls = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100'
const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-200'

// 대분류별로 결제수단 그룹핑
function groupByType(paymentMethods) {
  return paymentMethods.reduce((acc, pm) => {
    const key = pm.payment_type
    if (!acc[key]) acc[key] = []
    acc[key].push(pm)
    return acc
  }, {})
}

export default function ExpenseForm({ onSubmit, defaultValues, isLoading }) {
  const { data: categories = [] } = useCategories()
  const { data: paymentMethods = [] } = usePaymentMethods()
  const today = new Date().toISOString().slice(0, 10)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { date: today, ...defaultValues },
  })

  const grouped = groupByType(paymentMethods)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="금액 (원)"
        type="number"
        placeholder="예: 15000"
        error={errors.amount?.message}
        {...register('amount', { required: '금액을 입력하세요', min: { value: 1, message: '1원 이상 입력하세요' }, valueAsNumber: true })}
      />

      <div className="flex flex-col gap-1">
        <label className={labelCls}>결제 수단</label>
        <select className={selectCls} {...register('payment_method_id', { valueAsNumber: true })}>
          <option value="">선택 안함</option>
          {Object.entries(grouped).map(([type, methods]) => (
            <optgroup key={type} label={PAYMENT_TYPE_LABELS[type] || type}>
              {methods.map((pm) => (
                <option key={pm.id} value={pm.id}>{pm.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>카테고리</label>
        <select className={selectCls} {...register('category_id', { valueAsNumber: true })}>
          <option value="">미분류</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      <Input
        label="날짜"
        type="date"
        error={errors.date?.message}
        {...register('date', { required: '날짜를 입력하세요' })}
      />

      <Input
        label="메모 (선택)"
        type="text"
        placeholder="어디서 무엇을 샀나요? (선택)"
        {...register('memo')}
      />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? '저장 중...' : '저장하기'}
      </Button>
    </form>
  )
}
