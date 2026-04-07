import { AuthProvider } from '../../components/auth-provider'
import { Sidebar } from '../../components/sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        <Sidebar />
        {/* pt-14 on mobile to clear the fixed top bar; pb-16 to clear the bottom nav */}
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0 pb-24 md:pb-0">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
