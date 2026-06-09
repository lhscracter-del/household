import { useForm } from 'react-hook-form'
import Input from '../common/Input'
import Button from '../common/Button'
import { PAYMENT_METHODS } from '../../utils/constants'
import { useCategories } from '../../hooks/useCategories'

const selectCls = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100'
const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-200'

export default function ExpenseForm({ onSubmit, defaultValues, isLoading }) {
  const { data: categories = [] } = useCategories()
  const today = new Date().toISOString().slice(0, 10)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { date: today, ...defaultValues },
  })

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
        <select className={selectCls} {...register('payment_method', { required: true })}>
          {PAYMENT_METHODS.filter((m) => m.value !== 'all').map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
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
