export type UserRole = 'sales' | 'manager'

export type SessionUser = {
  id: number
  name: string
  email: string
  role: UserRole
}
