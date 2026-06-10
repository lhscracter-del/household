import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useTheme } from '../../contexts/ThemeContext'

export default function AppLayout() {
  const [open, setOpen] = useState(window.innerWidth >= 1024)
  const { theme, toggle } = useTheme()

  useEffect(() => {
    const handler = () => {
      setOpen(window.innerWidth >= 1024)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div className="flex h-dvh bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex flex-1 w-full max-w-[1280px] mx-auto overflow-hidden">
        <Sidebar open={open} onClose={() => setOpen(false)} />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header open={open} onToggle={() => setOpen((v) => !v)} theme={theme} onThemeToggle={toggle} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:py-6 lg:px-[120px]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
