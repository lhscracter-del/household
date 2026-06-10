import { clsx } from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, className, wrapperClassName, labelClassName, ...props }, ref) {
  return (
    <div className={clsx('flex flex-col gap-1', wrapperClassName)}>
      {label && <label className={labelClassName ?? 'text-sm font-medium text-gray-700 dark:text-gray-200'}>{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'px-3 py-2 border rounded-lg text-sm outline-none transition-colors',
          'bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400',
          'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          error ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
})

export default Input
