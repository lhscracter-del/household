import Modal from './Modal'
import Button from './Button'

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  message,
  confirmLabel = '삭제',
  confirmVariant = 'danger',
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button variant={confirmVariant} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
