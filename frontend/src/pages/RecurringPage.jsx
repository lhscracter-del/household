import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecurring, createRecurring, deleteRecurring } from '../api/recurring'
import { QUERY_KEYS } from '../utils/queryKeys'
import { useCategories } from '../hooks/useCategories'
import { formatAmount } from '../utils/format'
import { PaymentBadge } from '../components/common/Badge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { useForm } from 'react-hook-form'
import { PAYMENT_METHODS } from '../utils/constants'

export default function RecurringPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const { data: items = [], isLoading } = useQuery({ queryKey: [QUERY_KEYS.RECURRING], queryFn: getRecurring })
  const { mutate: create, isPending } = useMutation({
    mutationFn: createRecurring,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECURRING] }); setIsFormOpen(false) },
  })
  const { mutate: remove } = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECURRING] }),
  })
  const { register, handleSubmit } = useForm()

  const CYCLE_LABELS = { monthly: '매월', weekly: '매주' }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-800">반복 지출</h2>
        <Button onClick={() => setIsFormOpen(true)}>+ 추가</Button>
      </div>

      {isLoading ? <Spinner /> : items.length ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{item.description} — {formatAmount(item.amount)}</p>
                <div className="flex gap-2 mt-1">
                  <PaymentBadge method={item.payment_method} />
                  <span className="text-xs text-gray-500">{CYCLE_LABELS[item.cycle]} · 다음: {item.next_due_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { if (confirm('이 항목을 삭제하시겠습니까? 삭제한 내역은 복구할 수 없어요.')) remove(item.id) }} className="text-red-500">삭제</Button>
            </div>
          ))}
        </div>
      ) : <EmptyState message="등록된 반복 지출이 없어요. 월세, 구독료 같은 고정 지출을 등록하면 자동으로 집계돼요. 🔄" />}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="반복 지출 추가">
        <form onSubmit={handleSubmit(create)} className="flex flex-col gap-4">
          <Input label="설명" {...register('description', { required: true })} />
          <Input label="금액" type="number" {...register('amount', { required: true, valueAsNumber: true })} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">결제 수단</label>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 dark:text-gray-100" {...register('payment_method', { required: true })}>
              {PAYMENT_METHODS.filter((m) => m.value !== 'all').map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">주기</label>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 dark:text-gray-100" {...register('cycle', { required: true })}>
              <option value="monthly">매월</option>
              <option value="weekly">매주</option>
            </select>
          </div>
          <Input label="다음 결제일" type="date" {...register('next_due_date', { required: true })} />
          <Button type="submit" disabled={isPending}>{isPending ? '저장 중...' : '저장하기'}</Button>
        </form>
      </Modal>
    </div>
  )
}
