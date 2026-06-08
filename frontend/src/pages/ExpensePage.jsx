import { useState } from 'react'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses'
import ExpenseList from '../components/expense/ExpenseList'
import ExpenseFilter from '../components/expense/ExpenseFilter'
import ExpenseForm from '../components/expense/ExpenseForm'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'

export default function ExpensePage() {
  const [filters, setFilters] = useState({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const { data: expenses, isLoading } = useExpenses(filters)
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
  const handleDelete = (id) => { if (confirm('삭제하시겠습니까?')) deleteExpense(id) }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">지출 관리</h2>
        <Button onClick={() => setIsFormOpen(true)}>+ 지출 추가</Button>
      </div>

      <ExpenseFilter filters={filters} onChange={setFilters} />
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
    </div>
  )
}
