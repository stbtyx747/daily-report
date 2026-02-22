import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import type { SessionUser } from '@/types/auth'
import type { UserRole } from '@/types/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user: SessionUser = {
    id: Number(session.user.id),
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role as UserRole,
  }

  return (
    <div className="flex h-screen flex-col">
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-6">{children}</main>
      </div>
    </div>
  )
}
