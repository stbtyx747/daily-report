import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const mockManager = { id: '1', name: '鈴木 部長', email: 'suzuki@example.com', role: 'manager' }
const mockSales = { id: '2', name: '山田 太郎', email: 'yamada@example.com', role: 'sales' }

const existingUser = {
  id: 2,
  name: '山田 太郎',
  email: 'yamada@example.com',
  role: 'sales',
  department: '東京営業部',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/v1/master/users/2')
}

function makePutRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/master/users/2', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/v1/master/users/2', { method: 'DELETE' })
}

const validUpdateBody = {
  name: '山田 次郎',
  email: 'yamada2@example.com',
  role: 'sales',
  department: '大阪営業部',
}

describe('GET /api/v1/master/users/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('USR-001相当: manager がユーザー詳細を取得できる', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as never)

    const res = await GET(makeGetRequest(), makeParams('2'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ id: 2, name: '山田 太郎', email: 'yamada@example.com' })
  })

  it('sales はアクセス不可 → 403', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockSales } as never)

    const res = await GET(makeGetRequest(), makeParams('2'))
    expect(res.status).toBe(403)
  })

  it('存在しない ID → 404', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await GET(makeGetRequest(), makeParams('999'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })
})

describe('PUT /api/v1/master/users/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('USR-010: 正常更新 → 200', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(existingUser as never) // 対象ユーザー検索
      .mockResolvedValueOnce(null)                  // メール重複チェック
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...existingUser,
      name: '山田 次郎',
      email: 'yamada2@example.com',
      department: '大阪営業部',
    } as never)

    const res = await PUT(makePutRequest(validUpdateBody), makeParams('2'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.name).toBe('山田 次郎')
  })

  it('USR-011: sales は更新不可 → 403', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockSales } as never)

    const res = await PUT(makePutRequest(validUpdateBody), makeParams('2'))
    expect(res.status).toBe(403)
  })

  it('USR-012: 存在しない ID → 404', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await PUT(makePutRequest(validUpdateBody), makeParams('999'))
    expect(res.status).toBe(404)
  })

  it('メールアドレス重複 → 409', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(existingUser as never)
      .mockResolvedValueOnce({ id: 99 } as never) // 別ユーザーがそのメールを使用中

    const res = await PUT(makePutRequest({ ...validUpdateBody, email: 'other@example.com' }), makeParams('2'))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error.code).toBe('CONFLICT')
  })

  it('name 未入力 → 400 VALIDATION_ERROR', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
    // バリデーション前にユーザー存在確認が走るためモックが必要
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as never)

    const res = await PUT(makePutRequest({ ...validUpdateBody, name: '' }), makeParams('2'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('DELETE /api/v1/master/users/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('USR-013: 正常削除 → 204', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as never)
    vi.mocked(prisma.user.delete).mockResolvedValue(existingUser as never)

    const res = await DELETE(makeDeleteRequest(), makeParams('2'))
    expect(res.status).toBe(204)
  })

  it('USR-014: sales は削除不可 → 403', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockSales } as never)

    const res = await DELETE(makeDeleteRequest(), makeParams('2'))
    expect(res.status).toBe(403)
  })

  it('USR-015: 存在しない ID → 404', async () => {
    vi.mocked(auth).mockResolvedValue({ user: mockManager } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await DELETE(makeDeleteRequest(), makeParams('999'))
    expect(res.status).toBe(404)
  })
})
