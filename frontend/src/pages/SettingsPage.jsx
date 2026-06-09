import { useState } from 'react'
import { useCategories, useCreateCategory, useDeleteCategory } from '../hooks/useCategories'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Spinner from '../components/common/Spinner'
import { useForm } from 'react-hook-form'
import { clsx } from 'clsx'

const EMOJI_OPTIONS = [
  '🛒','🍽️','🚌','🏥','🎬','🛍️','📱','📦','🙏','🏠','✈️','🎓',
  '💊','🐶','🎮','🍺','☕','🎁','💡','🔧','📚','🏋️','🎵','💰',
]

const COLOR_OPTIONS = [
  '#4CAF50','#FF9800','#2196F3','#9C27B0','#F44336',
  '#00BCD4','#E91E63','#607D8B','#795548','#FF5722',
  '#3F51B5','#009688','#FFC107','#8BC34A','#673AB7',
]

export default function SettingsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState('📦')
  const [selectedColor, setSelectedColor] = useState('#607D8B')
  const { data: categories = [], isLoading } = useCategories()
  const { mutate: create, isPending } = useCreateCategory()
  const { mutate: remove } = useDeleteCategory()
  const { register, handleSubmit, reset } = useForm()

  const handleCreate = (data) => {
    create(
      { ...data, icon: selectedEmoji, color: selectedColor },
      {
        onSuccess: () => {
          setIsFormOpen(false)
          reset()
          setSelectedEmoji('📦')
          setSelectedColor('#607D8B')
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">설정</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">카테고리 관리</h3>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>+ 추가</Button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: c.color ? `${c.color}30` : '#f3f4f6' }}
                  >
                    {c.icon}
                  </span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">{c.name}</span>
                </div>
                {c.user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (confirm('삭제?')) remove(c.id) }}
                    className="text-red-500 text-xs"
                  >
                    삭제
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="카테고리 추가">
        <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-5">
          <Input label="이름" {...register('name', { required: true })} placeholder="카테고리 이름" />

          {/* 이모지 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              아이콘 <span className="text-xl ml-1">{selectedEmoji}</span>
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={clsx(
                    'text-xl p-1.5 rounded-lg transition-colors',
                    selectedEmoji === emoji
                      ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              색상{' '}
              <span
                className="inline-block w-4 h-4 rounded-full align-middle ml-1"
                style={{ backgroundColor: selectedColor }}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={clsx(
                    'w-8 h-8 rounded-full transition-transform',
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? '저장 중...' : '저장'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
