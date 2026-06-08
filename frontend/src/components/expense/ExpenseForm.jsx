import { useForm } from 'react-hook-form'
import Input from '../common/Input'
import Button from '../common/Button'
import { PAYMENT_METHODS } from '../../utils/constants'
import { useCategories } from '../../hooks/useCategories'

export default function ExpenseForm({ onSubmit, defaultValues, isLoading }) {
  const { data: categories = [] } = useCategories()
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="금액 (원)"
        type="number"
        placeholder="0"
        error={errors.amount?.message}
        {...register('amount', { required: '금액을 입력하세요', min: { value: 1, message: '1원 이상 입력하세요' }, valueAsNumber: true })}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">결제 수단</label>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
          {...register('payment_method', { required: true })}
        >
          {PAYMENT_METHODS.filter((m) => m.value !== 'all').map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">카테고리</label>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
          {...register('category_id', { valueAsNumber: true })}
        >
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
        placeholder="메모를 입력하세요"
        {...register('memo')}
      />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? '저장 중...' : '저장'}
      </Button>
    </form>
  )
}
