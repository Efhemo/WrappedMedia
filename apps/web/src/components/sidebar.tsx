'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '../store/auth'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '▦' },
  { href: '/map',       label: 'Live Map', icon: '⊕' },
  { href: '/drivers',   label: 'Drivers',  icon: '⊙' },
  { href: '/campaigns', label: 'Campaigns', icon: '◈' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const signOut = useAuthStore((s) => s.signOut)

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="text-white text-sm font-black">W</span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">Wrapped</p>
              <p className="text-slate-500 text-xs mt-0.5">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>⇥</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white text-xs font-black">W</span>
          </div>
          <p className="text-white text-sm font-semibold">Wrapped Admin</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-slate-400 text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
              isActive(href) ? 'text-orange-400' : 'text-slate-500'
            }`}
          >
            <span className="text-lg leading-none">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
