import { useState, useRef, useEffect } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecurring, createRecurring, updateRecurring, deleteRecurring } from '../api/recurring'
import { QUERY_KEYS } from '../utils/queryKeys'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useCategories } from '../hooks/useCategories'
import { formatAmount } from '../utils/format'
import { downloadCsv, parseCsv } from '../utils/csv'
import { calcNextDueDate, formatDueLabel } from '../utils/recurring'
import { PaymentBadge } from '../components/common/Badge'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import RecurringForm from '../components/recurring/RecurringForm'

const RECURRING_CSV_HEADERS = ['설명', '금액']

export default function RecurringPage() {
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [createKey, setCreateKey] = useState(0)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const itemRefs = useRef({})
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
    onSuccess: () => { invalidate(); setFormOpen(false); setCreateKey((k) => k + 1) },
  })
  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }) => updateRecurring(id, data),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })
  const { mutate: remove } = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: invalidate,
  })
  const { mutateAsync: createBulk } = useMutation({ mutationFn: createRecurring })

  const pmMap = Object.fromEntries(paymentMethods.map((pm) => [pm.id, pm]))
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  useEffect(() => {
    if (editingId != null) {
      itemRefs.current[editingId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [editingId])

  const handleExportCsv = () => {
    const headers = ['설명', '금액', '카테고리', '결제수단', '주기', '결제일']
    const rows = items.map((item) => [
      item.description,
      item.amount,
      catMap[item.category_id]?.name ?? '',
      pmMap[item.payment_method_id]?.name ?? '',
      item.cycle === 'monthly' ? '매월' : '매주',
      formatDueLabel(item),
    ])
    downloadCsv('반복지출.csv', headers, rows)
  }

  const handleUploadClick = () => {
    if (!categories.length || !paymentMethods.length) {
      setUploadMessage('카테고리/결제수단이 먼저 등록되어 있어야 업로드할 수 있어요.')
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploadMessage('')
    const text = await file.text()
    const rows = parseCsv(text)
    const [header, ...dataRows] = rows

    if (!header || RECURRING_CSV_HEADERS.some((h, i) => header[i]?.trim() !== h)) {
      setUploadMessage(`CSV 헤더는 "${RECURRING_CSV_HEADERS.join(',')}" 형식이어야 해요.`)
      return
    }

    const categoryId = categories[0].id
    const paymentMethodId = paymentMethods[0].id
    const next_due_date = calcNextDueDate(10, 'monthly')
    let successCount = 0
    let failCount = 0

    setIsUploading(true)
    for (const row of dataRows) {
      const [description, amountRaw] = row
      const amount = Number(String(amountRaw).replace(/[^0-9-]/g, ''))
      if (!description?.trim() || !amount) {
        failCount += 1
        continue
      }
      try {
        await createBulk({
          description: description.trim(),
          amount,
          cycle: 'monthly',
          next_due_date,
          category_id: categoryId,
          payment_method_id: paymentMethodId,
        })
        successCount += 1
      } catch {
        failCount += 1
      }
    }
    setIsUploading(false)
    invalidate()
    setUploadMessage(`업로드 완료: 성공 ${successCount}건, 실패 ${failCount}건`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">반복 지출</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCsv} disabled={!items.length}>CSV 내보내기</Button>
          <Button variant="secondary" onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? '업로드 중...' : 'CSV 업로드'}
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {uploadMessage && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{uploadMessage}</p>
      )}

      {/* 인라인 입력 폼 (신규 등록 전용) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">새 항목 등록</h3>
          <svg
            className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${formOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {formOpen && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
            <RecurringForm
              key={createKey}
              categories={categories}
              paymentMethods={paymentMethods}
              onSubmit={(data) => create(data)}
              isPending={isCreating}
              submitLabel="등록"
            />
          </div>
        )}
      </div>

      {/* 등록된 항목 목록 */}
      {isLoading ? <Spinner /> : items.length ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {items.map((item) => {
            const pm = pmMap[item.payment_method_id]
            const cat = catMap[item.category_id]
            const isEditing = editingId === item.id
            return (
              <div
                key={item.id}
                ref={(el) => { itemRefs.current[item.id] = el }}
                className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors scroll-mt-20 ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                {isEditing ? (
                  <RecurringForm
                    item={item}
                    categories={categories}
                    paymentMethods={paymentMethods}
                    onSubmit={(data) => update({ id: item.id, data })}
                    onCancel={() => setEditingId(null)}
                    isPending={isUpdating}
                    submitLabel="수정 저장"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.description} — {formatAmount(item.amount)}</p>
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-1">
                        {cat && <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{cat.icon} {cat.name}</span>}
                        {pm && <PaymentBadge paymentType={pm.payment_type} name={pm.name} />}
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDueLabel(item)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(item.id)}>수정</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTargetId(item.id)} className="text-red-500">삭제</Button>
                    </div>
                  </div>
                )}
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
