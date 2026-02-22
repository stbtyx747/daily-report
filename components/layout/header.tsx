'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SessionUser } from '@/types/auth'

const roleLabel: Record<SessionUser['role'], string> = {
  sales: '営業',
  manager: 'マネージャー',
}

type HeaderProps = {
  user: SessionUser
}

export function Header({ user }: HeaderProps) {
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <span className="text-lg font-semibold text-foreground">営業日報システム</span>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{user.name}</span>
          <Badge variant="secondary">{roleLabel[user.role]}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="size-4" />
          ログアウト
        </Button>
      </div>
    </header>
  )
}
