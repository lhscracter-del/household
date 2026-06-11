import { useState, useRef } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '../hooks/usePaymentMethods'
import { useRestoreBackup } from '../hooks/useBackup'
import { getBackup } from '../api/backup'
import { useAuthStore } from '../store/authStore'
import {
  useHouseholdMembers,
  useHouseholdInvitations,
  useCreateHouseholdInvitation,
  useAcceptHouseholdInvitation,
  useRejectHouseholdInvitation,
  useCancelHouseholdInvitation,
  useLeaveHousehold,
} from '../hooks/useHousehold'
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

const lastBackupKey = (userId) => `household-last-backup-${userId}`

const formatDateTime = (isoStr) => {
  if (!isoStr) return null
  const d = new Date(isoStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SettingsPage() {
  const [isCatOpen, setIsCatOpen] = useState(false)
  const [catEditTarget, setCatEditTarget] = useState(null)
  const [isPmOpen, setIsPmOpen] = useState(false)
  const [pmEditTarget, setPmEditTarget] = useState(null)
  const [selectedEmoji, setSelectedEmoji] = useState('📦')
  const [selectedColor, setSelectedColor] = useState('#607D8B')
  const [confirmState, setConfirmState] = useState(null) // { message, onConfirm }
  const [backupDownloading, setBackupDownloading] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState(null) // { type: 'success' | 'error', text }
  const fileInputRef = useRef(null)
  const { mutate: restoreBackup, isPending: restoring } = useRestoreBackup()
  const userId = useAuthStore((s) => s.user?.id)
  const userEmail = useAuthStore((s) => s.user?.email)
  const [lastBackupAt, setLastBackupAt] = useState(() => localStorage.getItem(lastBackupKey(userId)))

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState(null)
  const { data: members = [] } = useHouseholdMembers()
  const { data: invitations = [] } = useHouseholdInvitations()
  const { mutate: sendInvite, isPending: invitePending } = useCreateHouseholdInvitation()
  const { mutate: acceptInvite } = useAcceptHouseholdInvitation()
  const { mutate: rejectInvite } = useRejectHouseholdInvitation()
  const { mutate: cancelInvite } = useCancelHouseholdInvitation()
  const { mutate: leaveHousehold, isPending: leavingHousehold } = useLeaveHousehold()

  const receivedInvitations = invitations.filter((i) => i.invitee_email === userEmail && i.status === 'pending')
  const sentInvitations = invitations.filter((i) => i.inviter_id === userId && i.status === 'pending')

  const handleSendInvite = (e) => {
    e.preventDefault()
    setInviteError(null)
    const email = inviteEmail.trim()
    if (!email) return
    sendInvite(email, {
      onSuccess: () => setInviteEmail(''),
      onError: (err) => setInviteError(err?.response?.data?.detail || '초대 보내기에 실패했습니다.'),
    })
  }

  const handleLeaveHousehold = () => {
    setConfirmState({
      message: '가족 공유에서 나가면 더 이상 다른 가족 구성원의 데이터를 공유하지 않으며, 내 데이터만 남은 새로운 가구로 분리됩니다. 계속하시겠습니까?',
      onConfirm: () => leaveHousehold(),
    })
  }

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

  const handleDownloadBackup = async () => {
    setBackupDownloading(true)
    setRestoreMessage(null)
    try {
      const data = await getBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const today = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `household-backup-${today}.json`
      a.click()
      URL.revokeObjectURL(url)

      const now = new Date().toISOString()
      localStorage.setItem(lastBackupKey(userId), now)
      setLastBackupAt(now)
    } catch {
      setRestoreMessage({ type: 'error', text: '백업 다운로드에 실패했습니다.' })
    } finally {
      setBackupDownloading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRestoreMessage(null)

    const reader = new FileReader()
    reader.onload = () => {
      let data
      try {
        data = JSON.parse(reader.result)
      } catch {
        setRestoreMessage({ type: 'error', text: '올바른 백업 파일이 아닙니다.' })
        return
      } finally {
        e.target.value = ''
      }

      setConfirmState({
        message: '백업 파일로 복원하면 현재 저장된 모든 데이터(지출, 결제수단, 카테고리, 반복지출, 예산)가 삭제되고 백업 내용으로 교체됩니다. 계속하시겠습니까?',
        onConfirm: () => {
          restoreBackup(data, {
            onSuccess: () => setRestoreMessage({ type: 'success', text: '복원이 완료되었습니다.' }),
            onError: () => setRestoreMessage({ type: 'error', text: '복원에 실패했습니다. 백업 파일을 확인해주세요.' }),
          })
        },
      })
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">설정</h2>

      {/* ── 데이터 백업 및 복원 ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">데이터 백업 및 복원</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
          내 모든 데이터(지출, 결제수단, 카테고리, 반복지출, 예산)를 파일로 저장하거나 복원할 수 있어요.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          마지막 백업: {lastBackupAt ? formatDateTime(lastBackupAt) : '백업 기록 없음'}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" onClick={handleDownloadBackup} disabled={backupDownloading}>
            {backupDownloading ? '다운로드 중...' : '백업 다운로드'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            className="border border-gray-300 dark:border-gray-600"
          >
            {restoring ? '복원 중...' : '백업 파일에서 복원'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {restoreMessage && (
          <p className={clsx('text-xs mt-2', restoreMessage.type === 'error' ? 'text-red-500' : 'text-emerald-500')}>
            {restoreMessage.text}
          </p>
        )}
      </div>

      {/* ── 가족 공유 ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">가족 공유</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          이메일로 가족을 초대해서 가계부 데이터를 함께 보고 편집할 수 있어요.
        </p>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            함께 사용 중인 멤버
          </p>
          <div className="flex flex-col gap-1">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {m.name} <span className="text-xs text-gray-400 dark:text-gray-500">({m.email})</span>
                  {m.id === userId && <span className="ml-1 text-xs text-blue-500">(나)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {receivedInvitations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              받은 초대
            </p>
            <div className="flex flex-col gap-1">
              {receivedInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {inv.inviter_name}님의 초대
                  </span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" onClick={() => acceptInvite(inv.id)}>수락</Button>
                    <Button variant="ghost" size="sm" onClick={() => rejectInvite(inv.id)} className="text-red-500 text-xs">
                      거절
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sentInvitations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              보낸 초대
            </p>
            <div className="flex flex-col gap-1">
              {sentInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-800 dark:text-gray-200">{inv.invitee_email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelInvite(inv.id)}
                    className="text-red-500 text-xs"
                  >
                    취소
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-2 mb-2">
          <Input
            type="email"
            placeholder="초대할 가족의 이메일"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            wrapperClassName="flex-1"
          />
          <Button type="submit" size="sm" disabled={invitePending || !inviteEmail.trim()}>
            {invitePending ? '보내는 중...' : '초대 보내기'}
          </Button>
        </form>
        {inviteError && <p className="text-xs text-red-500 mb-2">{inviteError}</p>}

        {members.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveHousehold}
            disabled={leavingHousehold}
            className="text-red-500 border border-gray-300 dark:border-gray-600"
          >
            {leavingHousehold ? '처리 중...' : '가족 공유에서 나가기'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
