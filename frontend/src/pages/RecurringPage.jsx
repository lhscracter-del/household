import { useState, useEffect } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecurring, createRecurring, updateRecurring, deleteRecurring } from '../api/recurring'
import { QUERY_KEYS } from '../utils/queryKeys'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useCategories } from '../hooks/useCategories'
import { formatAmount } from '../utils/format'
import { PaymentBadge } from '../components/common/Badge'
import Button from '../components/common/Button'
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

function extractDueDay(item) {
  const date = new Date(item.next_due_date)
  if (item.cycle === 'monthly') return date.getUTCDate()
  if (item.cycle === 'weekly') {
    const jsDay = date.getUTCDay()
    return jsDay === 0 ? 7 : jsDay
  }
  return 0
}

export default function RecurringPage() {
  const [editingItem, setEditingItem] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedType, setSelectedType] = useState(PAYMENT_TYPE_OPTIONS[0].value)
  const [dueDay, setDueDay] = useState(0)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const queryClient = useQueryClient()
  const { data: paymentMethods = [] } = usePaymentMethods()
  const { data: categories = [] } = useCategories()
  const { data: items = [], isLoading } = useQuery({ queryKey: [QUERY_KEYS.RECURRING], queryFn: getRecurring })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECURRING] })
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STATS] })
  }

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: createRecurring,
    onSuccess: () => { invalidate(); handleReset(true) },
  })
  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }) => updateRecurring(id, data),
    onSuccess: () => { invalidate(); handleReset(false) },
  })
  const { mutate: remove } = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: invalidate,
  })

  const { register, handleSubmit, setValue, watch, reset } = useForm({ defaultValues: { cycle: 'monthly' } })
  const cycle = watch('cycle', 'monthly')
  const isPending = isCreating || isUpdating

  const pmMap = Object.fromEntries(paymentMethods.map((pm) => [pm.id, pm]))
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const filteredMethods = paymentMethods.filter((pm) => pm.payment_type === selectedType)

  // 신규 모드일 때 기본값 자동 설정
  useEffect(() => {
    if (editingItem || !paymentMethods.length || !categories.length) return
    const defaultPm = paymentMethods.find((pm) => pm.payment_type === PAYMENT_TYPE_OPTIONS[0].value)
    const defaultCat = categories.find((c) => c.name === '기타')
    if (defaultPm) setValue('payment_method_id', defaultPm.id)
    if (defaultCat) setValue('category_id', defaultCat.id)
  }, [editingItem, paymentMethods, categories])

  const handleTypeChange = (e) => {
    const type = e.target.value
    setSelectedType(type)
    const first = paymentMethods.find((pm) => pm.payment_type === type)
    setValue('payment_method_id', first ? first.id : '')
  }

  const handleReset = (keepOpen = false) => {
    setEditingItem(null)
    if (!keepOpen) setFormOpen(false)
    setSelectedType(PAYMENT_TYPE_OPTIONS[0].value)
    setDueDay(0)
    const defaultPm = paymentMethods.find((pm) => pm.payment_type === PAYMENT_TYPE_OPTIONS[0].value)
    const defaultCat = categories.find((c) => c.name === '기타')
    reset({
      description: '',
      amount: '',
      cycle: 'monthly',
      payment_method_id: defaultPm?.id ?? '',
      category_id: defaultCat?.id ?? '',
    })
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    const pm = paymentMethods.find((p) => p.id === item.payment_method_id)
    setSelectedType(pm?.payment_type ?? PAYMENT_TYPE_OPTIONS[0].value)
    setDueDay(extractDueDay(item))
    reset({
      description: item.description,
      amount: item.amount,
      payment_method_id: item.payment_method_id ?? '',
      category_id: item.category_id ?? '',
      cycle: item.cycle,
    })
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = (data) => {
    const next_due_date = calcNextDueDate(dueDay, data.cycle)
    if (editingItem) {
      update({ id: editingItem.id, data: { ...data, next_due_date } })
    } else {
      create({ ...data, next_due_date })
    }
  }

  const dayOptions = cycle === 'weekly' ? WEEKDAY_OPTIONS : DAY_OPTIONS

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">반복 지출</h2>

      {/* 인라인 입력 폼 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => { if (!editingItem) setFormOpen((v) => !v) }}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {editingItem ? `수정 중: ${editingItem.description}` : '새 항목 등록'}
          </h3>
          {!editingItem && (
            <svg
              className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${formOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {(formOpen || editingItem) && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
        <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="설명" {...register('description', { required: true })} />
            <Input label="금액" type="number" {...register('amount', { required: true, valueAsNumber: true })} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">결제 수단</label>
            <div className="flex gap-2">
              <select className={selectCls} value={selectedType} onChange={handleTypeChange}>
                {PAYMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select className={selectCls} {...register('payment_method_id', { valueAsNumber: true })}>
                {filteredMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">카테고리</label>
              <select className={selectCls} {...register('category_id', { valueAsNumber: true })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">주기</label>
              <select className={selectCls} {...register('cycle', { required: true, onChange: () => setDueDay(0) })}>
                <option value="monthly">매월</option>
                <option value="weekly">매주</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {cycle === 'weekly' ? '결제 요일' : '결제일'}
              </label>
              <select className={selectCls} value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))}>
                {dayOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {editingItem && (
              <Button type="button" variant="secondary" onClick={handleReset}>취소</Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : editingItem ? '수정 저장' : '등록'}
            </Button>
          </div>
        </form>
        </div>
        )}
      </div>

      {/* 등록된 항목 목록 */}
      {isLoading ? <Spinner /> : items.length ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {items.map((item) => {
            const pm = pmMap[item.payment_method_id]
            const cat = catMap[item.category_id]
            const isEditing = editingItem?.id === item.id
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.description} — {formatAmount(item.amount)}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {cat && <span className="text-xs text-gray-500 dark:text-gray-400">{cat.icon} {cat.name}</span>}
                    {pm && <PaymentBadge paymentType={pm.payment_type} name={pm.name} />}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDueLabel(item)}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} disabled={isEditing}>수정</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTargetId(item.id)} className="text-red-500">삭제</Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : <EmptyState message="등록된 반복 지출이 없어요. 월세, 구독료 같은 고정 지출을 등록하면 자동으로 집계돼요." />}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onConfirm={() => { remove(deleteTargetId); setDeleteTargetId(null) }}
        onCancel={() => setDeleteTargetId(null)}
        message="이 항목을 삭제하시겠습니까?"
      />
    </div>
  )
}
