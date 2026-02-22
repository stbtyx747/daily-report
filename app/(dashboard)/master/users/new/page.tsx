import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { UserForm } from '@/components/master/user-form'

export default async function NewUserPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'manager') {
    redirect('/reports')
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">ユーザー登録</h1>
      <div className="rounded-lg border bg-background p-6">
        <UserForm mode="create" />
      </div>
    </div>
  )
}
