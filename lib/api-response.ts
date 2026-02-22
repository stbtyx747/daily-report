import { NextResponse } from 'next/server'
import type { z } from 'zod'

// ===== 型定義 =====

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INVALID_STATUS_TRANSITION'

export type ApiMeta = {
  total: number
  page: number
  per_page: number
}

type SuccessResponse<T> = { data: T }
type SuccessListResponse<T> = { data: T[]; meta: ApiMeta }
type ErrorResponse = {
  error: {
    code: ApiErrorCode
    message: string
    details?: { field: string; message: string }[]
  }
}

// ===== レスポンスヘルパー =====

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<SuccessResponse<T>>({ data }, { status })
}

export function apiSuccessList<T>(data: T[], meta: ApiMeta, status = 200) {
  return NextResponse.json<SuccessListResponse<T>>({ data, meta }, { status })
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: { field: string; message: string }[]
) {
  const body: ErrorResponse = { error: { code, message, ...(details ? { details } : {}) } }
  return NextResponse.json<ErrorResponse>(body, { status })
}

// ===== 定型エラー =====

export const unauthorized = () => apiError('UNAUTHORIZED', '認証が必要です', 401)

export const forbidden = () => apiError('FORBIDDEN', 'この操作を行う権限がありません', 403)

export const notFound = (resource = 'リソース') =>
  apiError('NOT_FOUND', `${resource}が見つかりません`, 404)

export const conflict = (message = 'データが重複しています') => apiError('CONFLICT', message, 409)

export const invalidStatusTransition = (from: string, to: string) =>
  apiError(
    'INVALID_STATUS_TRANSITION',
    `ステータスを ${from} から ${to} に変更することはできません`,
    422
  )

export const validationError = (details: { field: string; message: string }[]) =>
  apiError('VALIDATION_ERROR', 'バリデーションエラー', 400, details)

// ===== Zod パーサー =====

/**
 * リクエストボディを Zod スキーマで検証する。
 * 失敗時は VALIDATION_ERROR レスポンスを返す。
 */
export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
    return { success: false, response: validationError(details) }
  }
  return { success: true, data: result.data }
}

// ===== 短縮エイリアス（Route Handler 推奨） =====

export const successResponse = apiSuccess
export const listResponse = apiSuccessList
export const errorResponse = apiError
