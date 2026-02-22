import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

// モック
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const mockManager = { id: '1', name: '鈴木 部長', email: 'suzuki@example.com', role: 'manager' }
const mockSales = { id: '2', name: '山田 太郎', email: 'yamada@example.com', role: 'sales' }

const mockUsers = [
  {
    id: 1,
    name: '鈴木 部長',
    email: 'suzuki@example.com',
    role: 'manager',
    department: '管理部',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 2,
    name: '山田 太郎',
    email: 'yamada@example.com',
    role: 'sales',
    department: '東京営業部',
    createdAt: new Date('2026-01-02T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
  },
]

function makeRequest(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/v1/master/users')
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return new NextRequest(url)
}

describe('GET /api/v1/master/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('USR-001: manager が一覧取得', () => {
    it('200 とユーザー一覧を返す', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)
      vi.mocked(prisma.user.count).mockResolvedValue(2)

      const res = await GET(makeRequest())
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.data).toHaveLength(2)
      expect(body.data[0]).toMatchObject({
        id: 1,
        name: '鈴木 部長',
        email: 'suzuki@example.com',
        role: 'manager',
        department: '管理部',
      })
      expect(body.meta).toEqual({ total: 2, page: 1, per_page: 20 })
    })
  })

  describe('USR-002: sales はアクセス不可', () => {
    it('403 FORBIDDEN を返す', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockSales } as never)

      const res = await GET(makeRequest())
      const body = await res.json()

      expect(res.status).toBe(403)
      expect(body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('未認証', () => {
    it('401 UNAUTHORIZED を返す', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const res = await GET(makeRequest())
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('ページネーション', () => {
    it('page と per_page が正しく適用される', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUsers[1]] as never)
      vi.mocked(prisma.user.count).mockResolvedValue(2)

      const res = await GET(makeRequest({ page: '2', per_page: '1' }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.meta).toEqual({ total: 2, page: 2, per_page: 1 })
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 1, take: 1 })
      )
    })
  })
})
