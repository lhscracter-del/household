import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useAuth'
import Button from '../common/Button'

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-4">
      {user && <span className="text-sm text-gray-600">{user.nickname || user.email}</span>}
      <Button variant="ghost" size="sm" onClick={logout}>
        로그아웃
      </Button>
    </header>
  )
}
