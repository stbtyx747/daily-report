import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserForm } from '@/components/master/user-form'

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'manager') {
    redirect('/reports')
  }

  const { id } = await params
  const userId = Number(id)

  if (isNaN(userId)) {
    notFound()
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, department: true },
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">ユーザー編集</h1>
      <div className="rounded-lg border bg-background p-6">
        <UserForm
          mode="edit"
          userId={user.id}
          defaultValues={{
            name: user.name,
            email: user.email,
            role: user.role as 'sales' | 'manager',
            department: user.department ?? '',
          }}
        />
      </div>
    </div>
  )
}
