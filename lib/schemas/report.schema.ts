import { z } from 'zod'

export const visitRecordSchema = z.object({
  customer_id: z.number().int().positive('顧客IDは正の整数を指定してください'),
  visit_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, '時刻は HH:MM 形式で入力してください')
    .optional(),
  content: z.string().min(1, '訪問内容は必須です'),
  sort_order: z.number().int().nonnegative('並び順は0以上の整数を指定してください'),
})

export const createReportSchema = z.object({
  report_date: z
    .string()
    .min(1, '報告日は必須です')
    .regex(/^\d{4}-\d{2}-\d{2}$/, '報告日は YYYY-MM-DD 形式で入力してください'),
  problem: z.string().optional(),
  plan: z.string().optional(),
  visit_records: z.array(visitRecordSchema).default([]),
})

export const updateReportSchema = createReportSchema

export const reportListQuerySchema = z.object({
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付は YYYY-MM-DD 形式で入力してください')
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付は YYYY-MM-DD 形式で入力してください')
    .optional(),
  status: z.enum(['draft', 'submitted', 'reviewed'] as const).optional(),
  user_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
export type UpdateReportInput = z.infer<typeof updateReportSchema>
export type ReportListQuery = z.infer<typeof reportListQuerySchema>
