import { useForm } from 'react-hook-form'
import Input from '../common/Input'
import Button from '../common/Button'
import { useCategories } from '../../hooks/useCategories'

export default function BudgetForm({ onSubmit, isLoading }) {
  const { data: categories = [] } = useCategories()
  const { register, handleSubmit, formState: { errors } } = useForm()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">카테고리</label>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
          {...register('category_id', { required: true, valueAsNumber: true })}
        >
          <option value="">선택하세요</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      <Input
        label="월 예산 (원)"
        type="number"
        placeholder="0"
        error={errors.amount?.message}
        {...register('amount', { required: '예산을 입력하세요', min: 1, valueAsNumber: true })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="연도"
          type="number"
          defaultValue={new Date().getFullYear()}
          {...register('year', { required: true, valueAsNumber: true })}
        />
        <Input
          label="월"
          type="number"
          min={1}
          max={12}
          defaultValue={new Date().getMonth() + 1}
          {...register('month', { required: true, valueAsNumber: true })}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? '저장 중...' : '예산 설정'}
      </Button>
    </form>
  )
}
