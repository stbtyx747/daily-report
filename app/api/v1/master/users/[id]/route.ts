import { type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { apiSuccess, conflict, notFound, parseBody } from '@/lib/api-response'
import { updateUserSchema } from '@/lib/schemas/user.schema'

type Params = { params: Promise<{ id: string }> }

function formatUser(user: {
  id: number
  name: string
  email: string
  role: string
  department: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  }
}

export async function GET(_request: NextRequest, { params }: Params) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { id } = await params
  const userId = Number(id)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true, updatedAt: true },
  })

  if (!user) return notFound('ユーザー')

  return apiSuccess(formatUser(user))
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { id } = await params
  const userId = Number(id)

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return notFound('ユーザー')

  const body = await request.json()
  const parsed = parseBody(updateUserSchema, body)
  if (!parsed.success) return parsed.response

  const { name, email, role, department } = parsed.data

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return conflict('このメールアドレスは既に使用されています')
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name, email, role, department },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true, updatedAt: true },
  })

  return apiSuccess(formatUser(updated))
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { id } = await params
  const userId = Number(id)

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return notFound('ユーザー')

  await prisma.user.delete({ where: { id: userId } })

  return new Response(null, { status: 204 })
}
