import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import {
  parseBody,
  successResponse,
  listResponse,
  conflict,
  validationError,
  forbidden,
} from '@/lib/api-response'
import { createReportSchema, reportListQuerySchema } from '@/lib/schemas/report.schema'
import type { Prisma } from '@prisma/client'

const reportSelect = {
  id: true,
  userId: true,
  reportDate: true,
  problem: true,
  plan: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  visitRecords: {
    select: {
      id: true,
      customerId: true,
      visitTime: true,
      content: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const

type ReportWithRecords = {
  id: number
  userId: number
  reportDate: Date
  problem: string | null
  plan: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  visitRecords: {
    id: number
    customerId: number
    visitTime: Date | null
    content: string
    sortOrder: number
  }[]
}

function formatReport(r: ReportWithRecords) {
  return {
    id: r.id,
    user_id: r.userId,
    report_date: r.reportDate,
    problem: r.problem,
    plan: r.plan,
    status: r.status,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    visit_records: r.visitRecords.map((vr) => ({
      id: vr.id,
      customer_id: vr.customerId,
      visit_time: vr.visitTime,
      content: vr.content,
      sort_order: vr.sortOrder,
    })),
  }
}

export async function GET(req: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof Response) return authResult

  const { searchParams } = new URL(req.url)
  const queryResult = reportListQuerySchema.safeParse({
    date_from: searchParams.get('date_from') ?? undefined,
    date_to: searchParams.get('date_to') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    user_id: searchParams.get('user_id') ?? undefined,
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

  const { date_from, date_to, status, user_id, page, per_page } = queryResult.data
  const skip = (page - 1) * per_page

  const where: Prisma.DailyReportWhereInput = {}

  // sales は自分の日報のみ、manager は全件（user_id フィルタ有効）
  if (authResult.role === 'sales') {
    where.userId = authResult.id
  } else if (authResult.role === 'manager' && user_id !== undefined) {
    where.userId = user_id
  }

  if (date_from) {
    where.reportDate = { ...((where.reportDate as object) ?? {}), gte: new Date(date_from) }
  }
  if (date_to) {
    where.reportDate = { ...((where.reportDate as object) ?? {}), lte: new Date(date_to) }
  }
  if (status) {
    where.status = status
  }

  const [reports, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      skip,
      take: per_page,
      orderBy: { reportDate: 'desc' },
      select: reportSelect,
    }),
    prisma.dailyReport.count({ where }),
  ])

  return listResponse(reports.map(formatReport), { total, page, per_page })
}

export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof Response) return authResult

  // sales のみ作成可能
  if (authResult.role !== 'sales') {
    return forbidden()
  }

  const body = await req.json().catch(() => null)
  const parsed = parseBody(createReportSchema, body)
  if (!parsed.success) return parsed.response

  const { report_date, problem, plan, visit_records } = parsed.data

  // 同一 userId + report_date の重複チェック
  const existing = await prisma.dailyReport.findUnique({
    where: {
      userId_reportDate: {
        userId: authResult.id,
        reportDate: new Date(report_date),
      },
    },
  })
  if (existing) {
    return conflict('同じ日付の日報が既に存在します')
  }

  const report = await prisma.dailyReport.create({
    data: {
      userId: authResult.id,
      reportDate: new Date(report_date),
      problem: problem ?? null,
      plan: plan ?? null,
      visitRecords: {
        create: visit_records.map((vr) => ({
          customerId: vr.customer_id,
          visitTime: vr.visit_time ? new Date(`1970-01-01T${vr.visit_time}:00`) : null,
          content: vr.content,
          sortOrder: vr.sort_order,
        })),
      },
    },
    select: reportSelect,
  })

  return successResponse(formatReport(report), 201)
}
