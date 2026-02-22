import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().min(1, 'メールアドレスは必須です').email('メール形式で入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
  role: z.enum(['sales', 'manager'] as const, {
    message: 'ロールは sales または manager を指定してください',
  }),
  department: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().min(1, 'メールアドレスは必須です').email('メール形式で入力してください'),
  role: z.enum(['sales', 'manager'] as const, {
    message: 'ロールは sales または manager を指定してください',
  }),
  department: z.string().optional(),
})

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserListQuery = z.infer<typeof userListQuerySchema>
