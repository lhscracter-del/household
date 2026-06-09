import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecurring, createRecurring, deleteRecurring } from '../api/recurring'
import { QUERY_KEYS } from '../utils/queryKeys'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useCategories } from '../hooks/useCategories'
import { formatAmount } from '../utils/format'
import { PaymentBadge } from '../components/common/Badge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { useForm } from 'react-hook-form'
import { PAYMENT_TYPE_OPTIONS } from '../utils/constants'

const selectCls = 'flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 dark:text-gray-100'

const DAY_OPTIONS = [
  { value: 0, label: '미설정' },
  ...Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}일` })),
]

const WEEKDAY_OPTIONS = [
  { value: 0, label: '미설정' },
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' },
  { value: 7, label: '일요일' },
]

function localDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function calcNextDueDate(day, cycle) {
  const today = new Date()
  if (!day) return localDateStr(today)

  if (cycle === 'monthly') {
    const y = today.getFullYear()
    const m = today.getMonth()
    const lastDay = new Date(y, m + 1, 0).getDate()
    const d = Math.min(day, lastDay)
    const candidate = new Date(y, m, d)
    if (candidate >= today) return localDateStr(candidate)
    const nm = m + 1 > 11 ? 0 : m + 1
    const ny = m + 1 > 11 ? y + 1 : y
    const lastDay2 = new Date(ny, nm + 1, 0).getDate()
    return localDateStr(new Date(ny, nm, Math.min(day, lastDay2)))
  }

  if (cycle === 'weekly') {
    const jsDay = day === 7 ? 0 : day
    const cur = today.getDay()
    let diff = jsDay - cur
    if (diff <= 0) diff += 7
    const next = new Date(today)
    next.setDate(today.getDate() + diff)
    return localDateStr(next)
  }

  return localDateStr(today)
}

function formatDueLabel(item) {
  if (item.cycle === 'monthly') {
    const d = new Date(item.next_due_date).getUTCDate()
    return `매월 ${d}일`
  }
  if (item.cycle === 'weekly') {
    const DAYS = ['일', '월', '화', '수', '목', '금', '토']
    const d = new Date(item.next_due_date).getUTCDay()
    return `매주 ${DAYS[d]}요일`
  }
  return item.next_due_date
}

export default function RecurringPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [dueDay, setDueDay] = useState(0)
  const queryClient = useQueryClient()
  const { data: paymentMethods = [] } = usePaymentMethods()
  const { data: categories = [] } = useCategories()
  const { data: items = [], isLoading } = useQuery({ queryKey: [QUERY_KEYS.RECURRING], queryFn: getRecurring })
  const { mutate: create, isPending } = useMutation({
    mutationFn: createRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECURRING] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STATS] })
      handleClose()
    },
  })
  const { mutate: remove } = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECURRING] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STATS] })
    },
  })
  const { register, handleSubmit, setValue, watch, reset } = useForm({ defaultValues: { cycle: 'monthly' } })
  const cycle = watch('cycle')

  const pmMap = Object.fromEntries(paymentMethods.map((pm) => [pm.id, pm]))
  const filteredMethods = selectedType ? paymentMethods.filter((pm) => pm.payment_type === selectedType) : []

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value)
    setValue('payment_method_id', '')
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setSelectedType('')
    setDueDay(0)
    reset({ cycle: 'monthly' })
  }

  const handleCreate = (data) => {
    create({ ...data, next_due_date: calcNextDueDate(dueDay, data.cycle) })
  }

  const dayOptions = cycle === 'weekly' ? WEEKDAY_OPTIONS : DAY_OPTIONS

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">반복 지출</h2>
        <Button onClick={() => setIsFormOpen(true)}>+ 추가</Button>
      </div>

      {isLoading ? <Spinner /> : items.length ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {items.map((item) => {
            const pm = pmMap[item.payment_method_id]
            return (
              <div key={item.id} className="flex items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.description} — {formatAmount(item.amount)}</p>
                  <div className="flex gap-2 mt-1">
                    {pm && <PaymentBadge paymentType={pm.payment_type} name={pm.name} />}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDueLabel(item)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm('이 항목을 삭제하시겠습니까?')) remove(item.id) }} className="text-red-500">삭제</Button>
              </div>
            )
          })}
        </div>
      ) : <EmptyState message="등록된 반복 지출이 없어요. 월세, 구독료 같은 고정 지출을 등록하면 자동으로 집계돼요. 🔄" />}

      <Modal isOpen={isFormOpen} onClose={handleClose} title="반복 지출 추가">
        <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-4">
          <Input label="설명" {...register('description', { required: true })} />
          <Input label="금액" type="number" {...register('amount', { required: true, valueAsNumber: true })} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">결제 수단</label>
            <div className="flex gap-2">
              <select className={selectCls} value={selectedType} onChange={handleTypeChange}>
                <option value="">대분류</option>
                {PAYMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select className={selectCls} disabled={!selectedType} {...register('payment_method_id', { valueAsNumber: true })}>
                <option value="">소분류</option>
                {filteredMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">카테고리</label>
            <select className={selectCls} {...register('category_id', { valueAsNumber: true })}>
              <option value="">미분류</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">주기</label>
            <select className={selectCls} {...register('cycle', { required: true })} onChange={() => setDueDay(0)}>
              <option value="monthly">매월</option>
              <option value="weekly">매주</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {cycle === 'weekly' ? '결제 요일' : '결제일'}
            </label>
            <select
              className={selectCls}
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
            >
              {dayOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={isPending}>{isPending ? '저장 중...' : '저장하기'}</Button>
        </form>
      </Modal>
    </div>
  )
}
