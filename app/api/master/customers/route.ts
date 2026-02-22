import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-utils'
import { parseBody, successResponse, listResponse } from '@/lib/api-response'
import { createCustomerSchema, customerListQuerySchema } from '@/lib/schemas/customer.schema'

const customerSelect = {
  id: true,
  name: true,
  companyName: true,
  department: true,
  industry: true,
  contactName: true,
  dealSize: true,
  phone: true,
  address: true,
  createdAt: true,
  updatedAt: true,
} as const

function formatCustomer(c: {
  id: number
  name: string
  companyName: string
  department: string | null
  industry: string | null
  contactName: string | null
  dealSize: string | null
  phone: string | null
  address: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: c.id,
    name: c.name,
    company_name: c.companyName,
    department: c.department,
    industry: c.industry,
    contact_name: c.contactName,
    deal_size: c.dealSize,
    phone: c.phone,
    address: c.address,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}

export async function GET(req: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof Response) return authResult

  const { searchParams } = new URL(req.url)
  const queryResult = customerListQuerySchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    per_page: searchParams.get('per_page') ?? undefined,
  })
  if (!queryResult.success) {
    const details = queryResult.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'バリデーションエラー', details } },
      { status: 400 }
    )
  }

  const { q, industry, page, per_page } = queryResult.data
  const skip = (page - 1) * per_page

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { companyName: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(industry ? { industry } : {}),
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: per_page,
      orderBy: { createdAt: 'asc' },
      select: customerSelect,
    }),
    prisma.customer.count({ where }),
  ])

  return listResponse(customers.map(formatCustomer), { total, page, per_page })
}

export async function POST(req: Request) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const body = await req.json().catch(() => null)
  const parsed = parseBody(createCustomerSchema, body)
  if (!parsed.success) return parsed.response

  const { name, company_name, department, industry, contact_name, deal_size, phone, address } =
    parsed.data

  const customer = await prisma.customer.create({
    data: {
      name,
      companyName: company_name,
      department,
      industry,
      contactName: contact_name,
      dealSize: deal_size,
      phone,
      address,
    },
    select: customerSelect,
  })

  return successResponse(formatCustomer(customer), 201)
}
