import { auth } from '@/auth'
import { unauthorized, forbidden } from '@/lib/api-response'
import type { SessionUser, UserRole } from '@/types/auth'

/**
 * Route Handler 内で認証チェックを行う。
 * 未認証の場合は 401 レスポンスを返す。
 */
export async function requireAuth(): Promise<SessionUser | Response> {
  const session = await auth()

  if (!session?.user) {
    return unauthorized()
  }

  return {
    id: Number(session.user.id),
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role,
  }
}

/**
 * Route Handler 内でロールベースの権限チェックを行う。
 * 未認証の場合は 401、権限不足の場合は 403 レスポンスを返す。
 */
export async function requireRole(role: UserRole): Promise<SessionUser | Response> {
  const result = await requireAuth()

  if (result instanceof Response) return result

  if (result.role !== role) {
    return forbidden()
  }

  return result
}
