import { useState } from 'react'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses'
import ExpenseList from '../components/expense/ExpenseList'
import ExpenseFilter from '../components/expense/ExpenseFilter'
import ExpenseForm from '../components/expense/ExpenseForm'
import Modal from '../components/common/Modal'
import ConfirmModal from '../components/common/ConfirmModal'
import Button from '../components/common/Button'

export default function ExpensePage() {
  const today = new Date().toISOString().slice(0, 10)
  const [filters, setFilters] = useState({ start_date: today, end_date: today })
  const [order, setOrder] = useState('desc')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const { data: expenses, isLoading } = useExpenses({ ...filters, order })
  const { mutate: createExpense, isPending: isCreating } = useCreateExpense()
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense()
  const { mutate: deleteExpense } = useDeleteExpense()

  const handleSubmit = (data) => {
    if (editTarget) {
      updateExpense({ id: editTarget.id, data }, { onSuccess: () => setEditTarget(null) })
    } else {
      createExpense(data, { onSuccess: () => setIsFormOpen(false) })
    }
  }

  const handleEdit = (expense) => setEditTarget(expense)
  const handleDelete = (id) => setDeleteTargetId(id)
  const handleDeleteConfirm = () => { deleteExpense(deleteTargetId); setDeleteTargetId(null) }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">지출 관리</h2>
        <Button onClick={() => setIsFormOpen(true)}>+ 지출 추가</Button>
      </div>

      <ExpenseFilter filters={filters} order={order} onChange={setFilters} onOrderChange={setOrder} />
      <ExpenseList expenses={expenses} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="지출 추가">
        <ExpenseForm onSubmit={handleSubmit} isLoading={isCreating} />
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="지출 수정">
        <ExpenseForm
          onSubmit={handleSubmit}
          defaultValues={editTarget ? { ...editTarget, date: editTarget.date } : {}}
          isLoading={isUpdating}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        message="이 항목을 삭제하시겠습니까? 삭제한 내역은 복구할 수 없어요."
      />
    </div>
  )
}
