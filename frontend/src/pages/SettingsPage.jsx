import { useState } from 'react'
import { useCategories, useCreateCategory, useDeleteCategory } from '../hooks/useCategories'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Spinner from '../components/common/Spinner'
import { useForm } from 'react-hook-form'

export default function SettingsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { data: categories = [], isLoading } = useCategories()
  const { mutate: create, isPending } = useCreateCategory()
  const { mutate: remove } = useDeleteCategory()
  const { register, handleSubmit, reset } = useForm()

  const handleCreate = (data) => {
    create(data, {
      onSuccess: () => { setIsFormOpen(false); reset() },
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h2 className="text-xl font-bold text-gray-800">설정</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">카테고리 관리</h3>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>+ 추가</Button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm">{c.icon} {c.name}</span>
                {c.user_id && (
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm('삭제?')) remove(c.id) }} className="text-red-500 text-xs">
                    삭제
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="카테고리 추가">
        <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-4">
          <Input label="이름" {...register('name', { required: true })} />
          <Input label="아이콘 (이모지)" {...register('icon')} />
          <Input label="색상 (#hex)" {...register('color')} />
          <Button type="submit" disabled={isPending}>{isPending ? '저장 중...' : '저장'}</Button>
        </form>
      </Modal>
    </div>
  )
}
