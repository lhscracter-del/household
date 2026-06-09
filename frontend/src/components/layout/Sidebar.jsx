import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', label: '대시보드', icon: '🏠', end: true },
  { to: '/expense', label: '지출 관리', icon: '💰' },
  { to: '/report', label: '통계', icon: '📊' },
  { to: '/budget', label: '예산', icon: '🎯' },
  { to: '/recur', label: '반복 지출', icon: '🔄' },
  { to: '/settings', label: '설정', icon: '⚙️' },
]

export default function Sidebar({ open, onClose }) {
  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose()
  }

  return (
    <aside
      className={clsx(
        'fixed lg:static inset-y-0 left-0 z-40 flex flex-col',
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
        'transition-all duration-300 ease-in-out',
        open ? 'w-56' : 'w-56 lg:w-16',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* 로고 */}
      <div className={clsx(
        'flex items-center h-14 flex-shrink-0 border-b border-gray-100 dark:border-gray-700',
        open ? 'px-6' : 'lg:justify-center px-6 lg:px-0',
      )}>
        <span className="text-xl flex-shrink-0">💼</span>
        {open && (
          <span className="ml-2 text-lg font-bold text-blue-600 whitespace-nowrap">가계부</span>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={handleNavClick}
            title={!open ? label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center rounded-lg mb-1 text-sm transition-colors',
                open ? 'gap-3 px-3 py-2.5' : 'py-2.5 lg:justify-center lg:px-0 px-3 gap-3',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )
            }
          >
            <span className="text-base flex-shrink-0">{icon}</span>
            {open && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
