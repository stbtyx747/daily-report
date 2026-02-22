import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UserRole } from '@/types/auth'

const PER_PAGE = 20

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'manager') {
    redirect('/reports')
  }

  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const skip = (page - 1) * PER_PAGE

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      skip,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    }),
    prisma.user.count(),
  ])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ユーザー一覧</h1>
        <Button asChild>
          <Link href="/master/users/new">新規登録</Link>
        </Button>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>氏名</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>役割</TableHead>
              <TableHead>部署</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  ユーザーが登録されていません
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role as UserRole} />
                  </TableCell>
                  <TableCell>{user.department ?? '-'}</TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/master/users/${user.id}/edit`}>編集</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <p className="text-sm text-muted-foreground">
            {total} 件中 {skip + 1}–{Math.min(skip + PER_PAGE, total)} 件
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`?page=${page - 1}`}>前へ</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={`?page=${page + 1}`}>次へ</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'manager') {
    return <Badge>manager</Badge>
  }
  return <Badge variant="secondary">sales</Badge>
}
