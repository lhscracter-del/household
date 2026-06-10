import { useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '../hooks/usePaymentMethods'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Spinner from '../components/common/Spinner'
import { useForm } from 'react-hook-form'
import { clsx } from 'clsx'
import { PAYMENT_TYPE_OPTIONS, PAYMENT_TYPE_LABELS } from '../utils/constants'

const EMOJI_OPTIONS = [
  '🛒','🍽️','🚌','🏥','🎬','🛍️','📱','📦','🙏','🏠','✈️','🎓',
  '💊','🐶','🎮','🍺','☕','🎁','💡','🔧','📚','🏋️','🎵','💰',
]

const COLOR_OPTIONS = [
  '#4CAF50','#FF9800','#2196F3','#9C27B0','#F44336',
  '#00BCD4','#E91E63','#607D8B','#795548','#FF5722',
  '#3F51B5','#009688','#FFC107','#8BC34A','#673AB7',
]

const PAYMENT_TYPE_ICONS = { cash: '💵', check_card: '💳', credit_card: '💳' }
const selectCls = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 dark:text-gray-100'

export default function SettingsPage() {
  const [isCatOpen, setIsCatOpen] = useState(false)
  const [catEditTarget, setCatEditTarget] = useState(null)
  const [isPmOpen, setIsPmOpen] = useState(false)
  const [pmEditTarget, setPmEditTarget] = useState(null)
  const [selectedEmoji, setSelectedEmoji] = useState('📦')
  const [selectedColor, setSelectedColor] = useState('#607D8B')
  const [confirmState, setConfirmState] = useState(null) // { message, onConfirm }

  const { data: categories = [], isLoading: catLoading } = useCategories()
  const { mutate: createCat, isPending: catPending } = useCreateCategory()
  const { mutate: updateCat, isPending: catUpdating } = useUpdateCategory()
  const { mutate: removeCat } = useDeleteCategory()
  const { register: regCat, handleSubmit: handleCat, reset: resetCat } = useForm()

  const { data: paymentMethods = [], isLoading: pmLoading } = usePaymentMethods()
  const { mutate: createPm, isPending: pmPending } = useCreatePaymentMethod()
  const { mutate: updatePm, isPending: pmUpdating } = useUpdatePaymentMethod()
  const { mutate: removePm } = useDeletePaymentMethod()
  const { register: regPm, handleSubmit: handlePm, reset: resetPm } = useForm()

  // 대분류별 그룹핑
  const pmGrouped = paymentMethods.reduce((acc, pm) => {
    if (!acc[pm.payment_type]) acc[pm.payment_type] = []
    acc[pm.payment_type].push(pm)
    return acc
  }, {})

  const closeCatModal = () => {
    setIsCatOpen(false)
    setCatEditTarget(null)
    resetCat()
    setSelectedEmoji('📦')
    setSelectedColor('#607D8B')
  }

  const openCatEdit = (c) => {
    resetCat({ name: c.name })
    setSelectedEmoji(c.icon || '📦')
    setSelectedColor(c.color || '#607D8B')
    setCatEditTarget(c)
  }

  const handleCatSubmit = (data) => {
    const payload = { ...data, icon: selectedEmoji, color: selectedColor }
    if (catEditTarget) {
      updateCat({ id: catEditTarget.id, ...payload }, { onSuccess: closeCatModal })
    } else {
      createCat(payload, { onSuccess: closeCatModal })
    }
  }

  const closePmModal = () => {
    setIsPmOpen(false)
    setPmEditTarget(null)
    resetPm()
  }

  const openPmEdit = (pm) => {
    resetPm({ payment_type: pm.payment_type, name: pm.name })
    setPmEditTarget(pm)
  }

  const handlePmSubmit = (data) => {
    if (pmEditTarget) {
      updatePm({ id: pmEditTarget.id, name: data.name }, { onSuccess: closePmModal })
    } else {
      createPm(data, { onSuccess: closePmModal })
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-lg">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">설정</h2>

      {/* ── 결제 수단 관리 ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">결제 수단 관리</h3>
          <Button size="sm" onClick={() => { resetPm({ payment_type: 'cash', name: '' }); setIsPmOpen(true) }}>+ 추가</Button>
        </div>

        {pmLoading ? <Spinner /> : (
          <div className="flex flex-col gap-4">
            {PAYMENT_TYPE_OPTIONS.map(({ value, label }) => {
              const items = pmGrouped[value] || []
              return (
                <div key={value}>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                    {PAYMENT_TYPE_ICONS[value]} {label}
                  </p>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 pl-5">없음</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {items.map((pm) => (
                        <div key={pm.id} className="flex items-center justify-between py-1.5 pl-5">
                          <span className="text-sm text-gray-800 dark:text-gray-200">{pm.name}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPmEdit(pm)}
                              className="text-blue-500 text-xs"
                            >
                              수정
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmState({ message: `'${pm.name}' 결제 수단을 삭제하시겠습니까?`, onConfirm: () => removePm(pm.id) })}
                              className="text-red-500 text-xs"
                            >
                              삭제
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 카테고리 관리 ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">카테고리 관리</h3>
          <Button size="sm" onClick={() => { resetCat({ name: '' }); setSelectedEmoji('📦'); setSelectedColor('#607D8B'); setIsCatOpen(true) }}>+ 추가</Button>
        </div>

        {catLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: c.color ? `${c.color}30` : '#f3f4f6' }}>
                    {c.icon}
                  </span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">{c.name}</span>
                </div>
                {c.user_id && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm"
                      onClick={() => openCatEdit(c)}
                      className="text-blue-500 text-xs">수정</Button>
                    <Button variant="ghost" size="sm"
                      onClick={() => setConfirmState({ message: `'${c.icon} ${c.name}' 카테고리를 삭제하시겠습니까?`, onConfirm: () => removeCat(c.id) })}
                      className="text-red-500 text-xs">삭제</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 결제 수단 추가/수정 모달 ── */}
      <Modal isOpen={isPmOpen || !!pmEditTarget} onClose={closePmModal} title={pmEditTarget ? '결제 수단 수정' : '결제 수단 추가'}>
        <form onSubmit={handlePm(handlePmSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">대분류</label>
            <select className={selectCls} disabled={!!pmEditTarget} {...regPm('payment_type', { required: true })}>
              {PAYMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Input label="이름 (예: 삼성카드, 국민체크)" {...regPm('name', { required: true })} placeholder="카드 별칭" />
          <Button type="submit" disabled={pmPending || pmUpdating}>{(pmPending || pmUpdating) ? '저장 중...' : '저장'}</Button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmState}
        onConfirm={() => { confirmState?.onConfirm(); setConfirmState(null) }}
        onCancel={() => setConfirmState(null)}
        message={confirmState?.message ?? ''}
      />

      {/* ── 카테고리 추가/수정 모달 ── */}
      <Modal isOpen={isCatOpen || !!catEditTarget} onClose={closeCatModal} title={catEditTarget ? '카테고리 수정' : '카테고리 추가'}>
        <form onSubmit={handleCat(handleCatSubmit)} className="flex flex-col gap-5">
          <Input label="이름" {...regCat('name', { required: true })} placeholder="카테고리 이름" />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              아이콘 <span className="text-xl ml-1">{selectedEmoji}</span>
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setSelectedEmoji(emoji)}
                  className={clsx('text-xl p-1.5 rounded-lg transition-colors',
                    selectedEmoji === emoji ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700')}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              색상{' '}
              <span className="inline-block w-4 h-4 rounded-full align-middle ml-1" style={{ backgroundColor: selectedColor }} />
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button key={color} type="button" onClick={() => setSelectedColor(color)}
                  className={clsx('w-8 h-8 rounded-full transition-transform',
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-105')}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <Button type="submit" disabled={catPending || catUpdating}>{(catPending || catUpdating) ? '저장 중...' : '저장'}</Button>
        </form>
      </Modal>
    </div>
  )
}
