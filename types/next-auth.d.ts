import type { UserRole } from '@/types/auth'

declare module 'next-auth' {
  interface User {
    role: UserRole
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}
