'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Users, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/auth'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    href: '/reports',
    label: '日報一覧',
    icon: FileText,
    roles: ['sales', 'manager'],
  },
  {
    href: '/master/users',
    label: 'ユーザー管理',
    icon: Users,
    roles: ['manager'],
  },
  {
    href: '/master/customers',
    label: '顧客管理',
    icon: Building2,
    roles: ['sales', 'manager'],
  },
]

type SidebarProps = {
  role: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-white">
      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
