import { formatAmount, formatDiff } from '../../utils/format'
import Spinner from '../common/Spinner'

export default function SummaryCards({ data, isLoading }) {
  if (isLoading) return <Spinner />

  const diff = data?.diff_rate
  const diffColor = diff > 0 ? 'text-red-500' : diff < 0 ? 'text-blue-500' : 'text-gray-400'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-5">
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">이번 달 총 지출</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(data?.total ?? 0)}</p>
        {diff != null && (
          <p className={`text-xs mt-1 ${diffColor}`}>전달 대비 {diff > 0 ? '+' : ''}{diff}%</p>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-5">
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">지출 건수</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data?.count ?? 0}건</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-5">
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">전달 지출</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(data?.prev_total ?? 0)}</p>
      </div>
    </div>
  )
}
