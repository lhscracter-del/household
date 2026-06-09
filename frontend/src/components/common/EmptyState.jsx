export default function EmptyState({ message = '데이터가 없습니다.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <span className="text-4xl mb-3">📭</span>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}
