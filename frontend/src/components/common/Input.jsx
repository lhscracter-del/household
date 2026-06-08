import { clsx } from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'px-3 py-2 border rounded-lg text-sm outline-none transition-colors',
          'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          error ? 'border-red-400' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
})

export default Input
