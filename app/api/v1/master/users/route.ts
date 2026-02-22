import { type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiSuccessList, conflict, parseBody } from '@/lib/api-response'
import { createUserSchema } from '@/lib/schemas/user.schema'

export async function GET(request: NextRequest) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { searchParams } = request.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get('per_page') ?? 20)))
  const skip = (page - 1) * perPage

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count(),
  ])

  const data = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  }))

  return apiSuccessList(data, { total, page, per_page: perPage })
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const body = await request.json()
  const parsed = parseBody(createUserSchema, body)
  if (!parsed.success) return parsed.response

  const { name, email, password, role, department } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return conflict('このメールアドレスは既に使用されています')

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, department },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true, updatedAt: true },
  })

  return apiSuccess(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    },
    201
  )
}
