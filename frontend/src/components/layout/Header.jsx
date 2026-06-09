import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useAuth'
import Button from '../common/Button'

export default function Header({ open, onToggle, theme, onThemeToggle }) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 flex-shrink-0">
      {/* 햄버거 버튼 */}
      <button
        onClick={onToggle}
        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
        aria-label="메뉴 토글"
      >
        {open ? (
          <svg className="w-5 h-5 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : null}
        <svg
          className={`w-5 h-5 ${open ? 'hidden lg:block' : 'block'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 타이틀 (모바일) */}
      <span className="text-base font-bold text-blue-600 lg:hidden">💼 가계부</span>

      <div className="flex-1" />

      {user && (
        <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate max-w-[120px]">
          {user.name || user.email}
        </span>
      )}

      {/* 다크모드 토글 */}
      <button
        onClick={onThemeToggle}
        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 overflow-hidden relative"
        aria-label="테마 전환"
        title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        <span
          key={theme}
          className="block animate-theme-icon"
          style={{ animation: 'themeIconSpin 300ms ease forwards' }}
        >
          {theme === 'dark' ? (
            /* 태양 아이콘 (다크 -> 라이트) */
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            /* 달 아이콘 (라이트 -> 다크) */
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </span>
      </button>

      <Button variant="ghost" size="sm" onClick={logout} className="flex-shrink-0 dark:text-gray-300 dark:hover:bg-gray-700">
        로그아웃
      </Button>
    </header>
  )
}
