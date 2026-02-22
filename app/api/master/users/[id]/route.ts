import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-utils'
import { parseBody, successResponse, conflict, notFound } from '@/lib/api-response'
import { updateUserSchema } from '@/lib/schemas/user.schema'

type RouteParams = { params: Promise<{ id: string }> }

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  createdAt: true,
  updatedAt: true,
} as const

function formatUser(u: {
  id: number
  name: string
  email: string
  role: string
  department: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
  }
}

export async function GET(_req: Request, { params }: RouteParams) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { id } = await params
  const userId = Number(id)
  if (!Number.isInteger(userId) || userId <= 0) return notFound('ユーザー')

  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect })
  if (!user) return notFound('ユーザー')

  return successResponse(formatUser(user))
}

export async function PUT(req: Request, { params }: RouteParams) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { id } = await params
  const userId = Number(id)
  if (!Number.isInteger(userId) || userId <= 0) return notFound('ユーザー')

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) return notFound('ユーザー')

  const body = await req.json().catch(() => null)
  const parsed = parseBody(updateUserSchema, body)
  if (!parsed.success) return parsed.response

  const { name, email, role, department } = parsed.data

  if (email !== existing.email) {
    const duplicate = await prisma.user.findUnique({ where: { email } })
    if (duplicate) return conflict('このメールアドレスは既に使用されています')
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name, email, role, department },
    select: userSelect,
  })

  return successResponse(formatUser(updated))
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { id } = await params
  const userId = Number(id)
  if (!Number.isInteger(userId) || userId <= 0) return notFound('ユーザー')

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) return notFound('ユーザー')

  await prisma.user.delete({ where: { id: userId } })

  return new Response(null, { status: 204 })
}
