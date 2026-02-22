import { z } from 'zod'

export const createCustomerSchema = z.object({
  name: z.string().min(1, '顧客名は必須です'),
  company_name: z.string().min(1, '会社名は必須です'),
  department: z.string().optional(),
  industry: z.string().optional(),
  contact_name: z.string().optional(),
  deal_size: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const updateCustomerSchema = createCustomerSchema

export const customerListQuerySchema = z.object({
  q: z.string().optional(),
  industry: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>
