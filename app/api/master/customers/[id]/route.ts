import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-utils'
import { parseBody, successResponse, notFound } from '@/lib/api-response'
import { updateCustomerSchema } from '@/lib/schemas/customer.schema'

type RouteParams = { params: Promise<{ id: string }> }

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

export async function GET(_req: Request, { params }: RouteParams) {
  const authResult = await requireAuth()
  if (authResult instanceof Response) return authResult

  const { id } = await params
  const customerId = Number(id)
  if (!Number.isInteger(customerId) || customerId <= 0) return notFound('顧客')

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: customerSelect,
  })
  if (!customer) return notFound('顧客')

  return successResponse(formatCustomer(customer))
}

export async function PUT(req: Request, { params }: RouteParams) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { id } = await params
  const customerId = Number(id)
  if (!Number.isInteger(customerId) || customerId <= 0) return notFound('顧客')

  const existing = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!existing) return notFound('顧客')

  const body = await req.json().catch(() => null)
  const parsed = parseBody(updateCustomerSchema, body)
  if (!parsed.success) return parsed.response

  const { name, company_name, department, industry, contact_name, deal_size, phone, address } =
    parsed.data

  const updated = await prisma.customer.update({
    where: { id: customerId },
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

  return successResponse(formatCustomer(updated))
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const authResult = await requireRole('manager')
  if (authResult instanceof Response) return authResult

  const { id } = await params
  const customerId = Number(id)
  if (!Number.isInteger(customerId) || customerId <= 0) return notFound('顧客')

  const existing = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!existing) return notFound('顧客')

  await prisma.customer.delete({ where: { id: customerId } })

  return new Response(null, { status: 204 })
}
