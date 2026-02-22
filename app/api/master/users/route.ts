import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-utils'
import {
  parseBody,
  successResponse,
  listResponse,
  conflict,
  validationError,
} from '@/lib/api-response'
import { createUserSchema, userListQuerySchema } from '@/lib/schemas/user.schema'

export async function GET(req: Request) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { searchParams } = new URL(req.url)
  const queryResult = userListQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    per_page: searchParams.get('per_page') ?? undefined,
  })
  if (!queryResult.success) {
    const details = queryResult.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
    return validationError(details)
  }

  const { page, per_page } = queryResult.data
  const skip = (page - 1) * per_page

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: per_page,
      orderBy: { createdAt: 'asc' },
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

  const data = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
  }))

  return listResponse(data, { total, page, per_page })
}

export async function POST(req: Request) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const body = await req.json().catch(() => null)
  const parsed = parseBody(createUserSchema, body)
  if (!parsed.success) return parsed.response

  const { name, email, password, role, department } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return conflict('このメールアドレスは既に使用されています')
  }

  const passwordHash = await hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, department },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return successResponse(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    },
    201
  )
}
