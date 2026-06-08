import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', label: '대시보드', icon: '🏠', end: true },
  { to: '/expenses', label: '지출 관리', icon: '💰' },
  { to: '/stats', label: '통계', icon: '📊' },
  { to: '/budget', label: '예산', icon: '🎯' },
  { to: '/recurring', label: '반복 지출', icon: '🔄' },
  { to: '/settings', label: '설정', icon: '⚙️' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-6">
      <div className="px-6 mb-8">
        <h1 className="text-xl font-bold text-blue-600">💼 가계부</h1>
      </div>
      <nav className="flex-1 px-3">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
