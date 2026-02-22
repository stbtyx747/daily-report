import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const mockManager = { id: '1', name: '鈴木 部長', email: 'suzuki@example.com', role: 'manager' }
const mockSales = { id: '2', name: '山田 太郎', email: 'yamada@example.com', role: 'sales' }

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/master/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  name: '田中 花子',
  email: 'tanaka@example.com',
  password: 'password123',
  role: 'sales',
  department: '大阪営業部',
}

const createdUser = {
  id: 5,
  name: '田中 花子',
  email: 'tanaka@example.com',
  role: 'sales',
  department: '大阪営業部',
  createdAt: new Date('2026-02-20T09:00:00Z'),
  updatedAt: new Date('2026-02-20T09:00:00Z'),
}

describe('POST /api/v1/master/users', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('USR-003: 正常作成（sales）', () => {
    it('201 とユーザー情報を返す', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue(createdUser as never)

      const res = await POST(makeRequest(validBody))
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.data).toMatchObject({
        name: '田中 花子',
        email: 'tanaka@example.com',
        role: 'sales',
        department: '大阪営業部',
      })
    })
  })

  describe('USR-004: 正常作成（manager）', () => {
    it('201 を返す', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({ ...createdUser, role: 'manager' } as never)

      const res = await POST(makeRequest({ ...validBody, role: 'manager' }))
      expect(res.status).toBe(201)
    })
  })

  describe('USR-005: sales は作成不可', () => {
    it('403 FORBIDDEN を返す', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockSales } as never)

      const res = await POST(makeRequest(validBody))
      const body = await res.json()

      expect(res.status).toBe(403)
      expect(body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('USR-006: メールアドレス重複', () => {
    it('409 CONFLICT を返す', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as never)

      const res = await POST(makeRequest(validBody))
      const body = await res.json()

      expect(res.status).toBe(409)
      expect(body.error.code).toBe('CONFLICT')
    })
  })

  describe('USR-007: name 未入力', () => {
    it('400 VALIDATION_ERROR を返す', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)

      const res = await POST(makeRequest({ ...validBody, name: '' }))
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('USR-008: email 未入力', () => {
    it('400 VALIDATION_ERROR を返す', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)

      const res = await POST(makeRequest({ ...validBody, email: '' }))
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('USR-009: 不正な role', () => {
    it('400 VALIDATION_ERROR を返す', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)

      const res = await POST(makeRequest({ ...validBody, role: 'admin' }))
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  })
})
