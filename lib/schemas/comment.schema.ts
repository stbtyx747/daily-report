import { z } from 'zod'

export const createCommentSchema = z.object({
  content: z.string().min(1, 'コメント内容は必須です'),
})

export const updateCommentSchema = createCommentSchema

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
