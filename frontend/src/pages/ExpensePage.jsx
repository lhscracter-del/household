import { useState, useRef } from 'react'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useCategories } from '../hooks/useCategories'
import ExpenseList from '../components/expense/ExpenseList'
import ExpenseFilter from '../components/expense/ExpenseFilter'
import ExpenseForm from '../components/expense/ExpenseForm'
import ConfirmModal from '../components/common/ConfirmModal'
import Button from '../components/common/Button'
import { downloadCsv, parseCsv } from '../utils/csv'

const EXPENSE_CSV_HEADERS = ['날짜', '금액', '메모']

export default function ExpensePage() {
  const today = new Date().toISOString().slice(0, 10)
  const [filters, setFilters] = useState({ start_date: today, end_date: today })
  const [order, setOrder] = useState('desc')
  const [formOpen, setFormOpen] = useState(false)
  const [createKey, setCreateKey] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const [uploadMessage, setUploadMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const { data: expenses, isLoading } = useExpenses({ ...filters, order })
  const { mutate: createExpense, mutateAsync: createExpenseAsync, isPending: isCreating } = useCreateExpense()
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense()
  const { mutate: deleteExpense } = useDeleteExpense()
  const { data: paymentMethods = [] } = usePaymentMethods()
  const { data: categories = [] } = useCategories()

  const handleExportCsv = () => {
    const pmMap = Object.fromEntries(paymentMethods.map((pm) => [pm.id, pm]))
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
    const headers = ['날짜', '카테고리', '결제수단', '금액', '메모']
    const rows = (expenses ?? []).map((e) => [
      e.date,
      catMap[e.category_id]?.name ?? '',
      pmMap[e.payment_method_id]?.name ?? '',
      e.amount,
      e.memo ?? '',
    ])
    downloadCsv(`지출내역_${filters.start_date}_${filters.end_date}.csv`, headers, rows)
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

    if (!header || EXPENSE_CSV_HEADERS.some((h, i) => header[i]?.trim() !== h)) {
      setUploadMessage(`CSV 헤더는 "${EXPENSE_CSV_HEADERS.join(',')}" 형식이어야 해요.`)
      return
    }

    const categoryId = categories[0].id
    const paymentMethodId = paymentMethods[0].id
    let successCount = 0
    let failCount = 0

    setIsUploading(true)
    for (const row of dataRows) {
      const [date, amountRaw, memo] = row
      const amount = Number(String(amountRaw).replace(/[^0-9-]/g, ''))
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !amount) {
        failCount += 1
        continue
      }
      try {
        await createExpenseAsync({
          date,
          amount,
          memo: memo || undefined,
          category_id: categoryId,
          payment_method_id: paymentMethodId,
        })
        successCount += 1
      } catch {
        failCount += 1
      }
    }
    setIsUploading(false)
    setUploadMessage(`업로드 완료: 성공 ${successCount}건, 실패 ${failCount}건`)
  }

  const handleCreate = (data) => {
    createExpense(data, { onSuccess: () => { setFormOpen(false); setCreateKey((k) => k + 1) } })
  }

  const handleEditSubmit = (data) => {
    updateExpense({ id: editingId, data }, { onSuccess: () => setEditingId(null) })
  }

  const handleEdit = (id) => setEditingId(id)
  const handleDelete = (id) => setDeleteTargetId(id)
  const handleDeleteConfirm = () => { deleteExpense(deleteTargetId); setDeleteTargetId(null) }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">지출 관리</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCsv} disabled={!expenses?.length}>CSV 내보내기</Button>
          <Button variant="secondary" onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? '업로드 중...' : 'CSV 업로드'}
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {uploadMessage && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{uploadMessage}</p>
      )}

      {/* 인라인 입력 폼 (신규 등록) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">+ 지출 추가</h3>
          <svg
            className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${formOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {formOpen && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
            <ExpenseForm
              key={createKey}
              categories={categories}
              paymentMethods={paymentMethods}
              onSubmit={handleCreate}
              isPending={isCreating}
              submitLabel="등록"
            />
          </div>
        )}
      </div>

      <ExpenseFilter filters={filters} order={order} onChange={setFilters} onOrderChange={setOrder} />
      <ExpenseList
        expenses={expenses}
        isLoading={isLoading}
        editingId={editingId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onEditSubmit={handleEditSubmit}
        onEditCancel={() => setEditingId(null)}
        isUpdating={isUpdating}
      />

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        message="이 항목을 삭제하시겠습니까? 삭제한 내역은 복구할 수 없어요."
      />
    </div>
  )
}
