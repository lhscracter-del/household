import { useState } from 'react'
import { useBudgets, useCreateBudget } from '../hooks/useBudgets'
import { useByCategory } from '../hooks/useStats'
import { useCategories } from '../hooks/useCategories'
import BudgetForm from '../components/budget/BudgetForm'
import BudgetProgress from '../components/budget/BudgetProgress'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'

export default function BudgetPage() {
  const now = new Date()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { data: budgets, isLoading } = useBudgets()
  const { data: categories = [] } = useCategories()
  const { data: categoryStats = [] } = useByCategory({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const { mutate: createBudget, isPending } = useCreateBudget()

  const getSpent = (categoryId) => categoryStats.find((s) => s.category_id === categoryId)?.total ?? 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">예산 관리</h2>
        <Button onClick={() => setIsFormOpen(true)}>+ 예산 설정</Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : budgets?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const category = categories.find((c) => c.id === budget.category_id) || { name: '미분류', icon: '📦' }
            return (
              <BudgetProgress
                key={budget.id}
                category={category}
                budgetAmount={budget.amount}
                spentAmount={getSpent(budget.category_id)}
              />
            )
          })}
        </div>
      ) : (
        <EmptyState message="예산이 설정되지 않았습니다." />
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="예산 설정">
        <BudgetForm onSubmit={(data) => createBudget(data, { onSuccess: () => setIsFormOpen(false) })} isLoading={isPending} />
      </Modal>
    </div>
  )
}
