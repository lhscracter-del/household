import { useForm } from 'react-hook-form'
import Input from '../common/Input'
import Button from '../common/Button'
import PaymentMethodSelect from '../common/PaymentMethodSelect'

const selectCls = 'w-full min-w-0 px-1.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs outline-none bg-white dark:bg-gray-700 dark:text-gray-100'
const inputCls = 'min-w-0 px-2 py-1.5 text-sm'
const labelCls = 'text-xs font-medium text-gray-700 dark:text-gray-200'

export default function ExpenseForm({ item, categories, paymentMethods, onSubmit, onCancel, isPending, submitLabel }) {
  const today = new Date().toISOString().slice(0, 10)
  const defaultCat = categories.find((c) => c.name === '기타')

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      amount: item?.amount ?? '',
      payment_method_id: item?.payment_method_id ?? paymentMethods[0]?.id ?? '',
      category_id: item?.category_id ?? defaultCat?.id ?? '',
      date: item?.date ?? today,
      memo: item?.memo ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="금액 (원)"
          type="number"
          className={inputCls}
          error={errors.amount?.message}
          {...register('amount', { required: '금액을 입력하세요', min: { value: 1, message: '1원 이상 입력하세요' }, valueAsNumber: true })}
        />
        <Input
          label="날짜"
          type="date"
          className={inputCls}
          error={errors.date?.message}
          {...register('date', { required: '날짜를 입력하세요' })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <label className={labelCls}>결제수단</label>
          <PaymentMethodSelect
            paymentMethods={paymentMethods}
            className={selectCls}
            {...register('payment_method_id', { valueAsNumber: true })}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <label className={labelCls}>카테고리</label>
          <select className={selectCls} {...register('category_id', { valueAsNumber: true })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="메모 (선택)"
        type="text"
        placeholder="어디서 무엇을 샀나요? (선택)"
        className={inputCls}
        {...register('memo')}
      />

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? '저장 중...' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>취소</Button>
        )}
      </div>
    </form>
  )
}
