import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import type { SessionUser } from '@/types/auth'

// TODO: Issue #7 で NextAuth の auth() に置き換える
async function getSessionUser(): Promise<SessionUser> {
  return {
    id: 1,
    name: '田中 太郎',
    email: 'tanaka@example.com',
    role: 'sales',
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

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
