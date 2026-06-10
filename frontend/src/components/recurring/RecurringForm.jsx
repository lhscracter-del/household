import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Input from '../common/Input'
import Button from '../common/Button'
import PaymentMethodSelect from '../common/PaymentMethodSelect'
import { DAY_OPTIONS, WEEKDAY_OPTIONS, calcNextDueDate, extractDueDay } from '../../utils/recurring'

const selectCls = 'w-full min-w-0 px-1.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs outline-none bg-white dark:bg-gray-700 dark:text-gray-100'
const narrowSelectCls = 'w-full min-w-0 px-1 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs outline-none bg-white dark:bg-gray-700 dark:text-gray-100'
const inputCls = 'min-w-0 px-2 py-1.5 text-sm'
const labelCls = 'text-xs font-medium text-gray-700 dark:text-gray-200'

export default function RecurringForm({ item, categories, paymentMethods, onSubmit, onCancel, isPending, submitLabel }) {
  const defaultCat = categories.find((c) => c.name === '기타')
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      description: item?.description ?? '',
      amount: item?.amount ?? '',
      payment_method_id: item?.payment_method_id ?? paymentMethods[0]?.id ?? '',
      category_id: item?.category_id ?? defaultCat?.id ?? '',
      cycle: item?.cycle ?? 'monthly',
    },
  })
  const [dueDay, setDueDay] = useState(item ? extractDueDay(item) : 0)
  const cycle = watch('cycle', 'monthly')
  const dayOptions = cycle === 'weekly' ? WEEKDAY_OPTIONS : DAY_OPTIONS

  const submit = (data) => {
    const next_due_date = calcNextDueDate(dueDay, data.cycle)
    onSubmit({ ...data, next_due_date })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Input label="설명" className={inputCls} {...register('description', { required: true })} />
        <Input label="금액" type="number" className={inputCls} {...register('amount', { required: true, valueAsNumber: true })} />
      </div>

      <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-1.5">
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

        <div className="flex flex-col gap-1 min-w-0">
          <label className={labelCls}>주기</label>
          <select className={narrowSelectCls} {...register('cycle', { required: true, onChange: () => setDueDay(0) })}>
            <option value="monthly">매월</option>
            <option value="weekly">매주</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <label className={labelCls}>
            {cycle === 'weekly' ? '결제요일' : '결제일'}
          </label>
          <select className={narrowSelectCls} value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))}>
            {dayOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

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
