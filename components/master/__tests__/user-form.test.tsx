import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserForm } from '../user-form'

// ─── モック ──────────────────────────────────────────────────

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

// ─── デフォルト値（role を事前設定して Select 操作を回避）─────

const createDefaults = { name: '', email: '', role: 'sales' as const, department: '' }
const editDefaults = {
  name: '山田 太郎',
  email: 'yamada@example.com',
  role: 'sales' as const,
  department: '東京営業部',
}

// ─── 新規登録モード ───────────────────────────────────────────

describe('UserForm – 新規登録モード (mode="create")', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 5 } }) })
  })

  it('フォームが初期状態で表示される', () => {
    render(<UserForm mode="create" defaultValues={createDefaults} />)

    expect(screen.getByLabelText(/氏名/)).toBeInTheDocument()
    expect(screen.getByLabelText(/メールアドレス/)).toBeInTheDocument()
    expect(screen.getByLabelText(/パスワード/)).toBeInTheDocument()
    expect(screen.getByLabelText(/部署/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
  })

  it('正常入力で保存すると POST /api/v1/master/users が呼ばれる', async () => {
    const user = userEvent.setup()
    render(<UserForm mode="create" defaultValues={createDefaults} />)

    await user.type(screen.getByLabelText(/氏名/), '田中 花子')
    await user.type(screen.getByLabelText(/メールアドレス/), 'tanaka@example.com')
    await user.type(screen.getByLabelText(/パスワード/), 'password123')
    await user.type(screen.getByLabelText(/部署/), '大阪営業部')
    await user.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/master/users',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"email":"tanaka@example.com"'),
        })
      )
    })
  })

  it('保存成功後にトースト通知が表示され /master/users に遷移する', async () => {
    const user = userEvent.setup()
    render(<UserForm mode="create" defaultValues={createDefaults} />)

    await user.type(screen.getByLabelText(/氏名/), '田中 花子')
    await user.type(screen.getByLabelText(/メールアドレス/), 'tanaka@example.com')
    await user.type(screen.getByLabelText(/パスワード/), 'password123')
    await user.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'ユーザーを登録しました' })
      )
      expect(mockPush).toHaveBeenCalledWith('/master/users')
    })
  })

  it('キャンセルボタンで /master/users に遷移する', async () => {
    render(<UserForm mode="create" defaultValues={createDefaults} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(mockPush).toHaveBeenCalledWith('/master/users')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  describe('バリデーション', () => {
    it('氏名が空の場合にエラーメッセージを表示する', async () => {
      const user = userEvent.setup()
      render(<UserForm mode="create" defaultValues={createDefaults} />)

      // 他の必須項目は入力済み、氏名だけ空
      await user.type(screen.getByLabelText(/メールアドレス/), 'tanaka@example.com')
      await user.type(screen.getByLabelText(/パスワード/), 'password123')
      await user.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText('氏名は必須です')).toBeInTheDocument()
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('メールアドレスが空の場合にエラーメッセージを表示する', async () => {
      const user = userEvent.setup()
      render(<UserForm mode="create" defaultValues={createDefaults} />)

      await user.type(screen.getByLabelText(/氏名/), '田中 花子')
      await user.type(screen.getByLabelText(/パスワード/), 'password123')
      await user.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument()
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('メール形式が不正な場合にエラーメッセージを表示する', async () => {
      const user = userEvent.setup()
      render(<UserForm mode="create" defaultValues={createDefaults} />)

      await user.type(screen.getByLabelText(/氏名/), '田中 花子')
      await user.type(screen.getByLabelText(/メールアドレス/), 'not-an-email')
      await user.type(screen.getByLabelText(/パスワード/), 'password123')
      await user.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText('メール形式で入力してください')).toBeInTheDocument()
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('パスワードが空の場合にエラーメッセージを表示する（新規登録）', async () => {
      const user = userEvent.setup()
      render(<UserForm mode="create" defaultValues={createDefaults} />)

      await user.type(screen.getByLabelText(/氏名/), '田中 花子')
      await user.type(screen.getByLabelText(/メールアドレス/), 'tanaka@example.com')
      await user.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText('パスワードは必須です')).toBeInTheDocument()
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('API エラー時にエラートーストを表示し遷移しない', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'このメールアドレスは既に使用されています' } }),
      })
      const user = userEvent.setup()
      render(<UserForm mode="create" defaultValues={createDefaults} />)

      await user.type(screen.getByLabelText(/氏名/), '田中 花子')
      await user.type(screen.getByLabelText(/メールアドレス/), 'tanaka@example.com')
      await user.type(screen.getByLabelText(/パスワード/), 'password123')
      await user.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
            description: 'このメールアドレスは既に使用されています',
          })
        )
      })
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})

// ─── 編集モード ───────────────────────────────────────────────

describe('UserForm – 編集モード (mode="edit")', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) })
  })

  it('既存値が初期表示される', () => {
    render(<UserForm mode="edit" userId={2} defaultValues={editDefaults} />)

    expect(screen.getByLabelText(/氏名/)).toHaveValue('山田 太郎')
    expect(screen.getByLabelText(/メールアドレス/)).toHaveValue('yamada@example.com')
    expect(screen.getByLabelText(/部署/)).toHaveValue('東京営業部')
  })

  it('パスワード欄が任意であることが明示される', () => {
    render(<UserForm mode="edit" userId={2} defaultValues={editDefaults} />)

    expect(screen.getByText(/変更しない場合は空欄/)).toBeInTheDocument()
  })

  it('パスワード空欄のまま保存すると PUT リクエストから password を除外する', async () => {
    render(<UserForm mode="edit" userId={2} defaultValues={editDefaults} />)

    await userEvent.setup().click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/master/users/2',
        expect.objectContaining({ method: 'PUT' })
      )
    })
    const sentBody = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string
    )
    expect(sentBody).not.toHaveProperty('password')
  })

  it('保存成功後にトースト通知が表示され /master/users に遷移する', async () => {
    render(<UserForm mode="edit" userId={2} defaultValues={editDefaults} />)

    await userEvent.setup().click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'ユーザーを更新しました' })
      )
      expect(mockPush).toHaveBeenCalledWith('/master/users')
    })
  })

  it('氏名をクリアして保存するとエラーメッセージを表示する', async () => {
    const user = userEvent.setup()
    render(<UserForm mode="edit" userId={2} defaultValues={editDefaults} />)

    await user.clear(screen.getByLabelText(/氏名/))
    await user.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(screen.getByText('氏名は必須です')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('メールアドレスをクリアして保存するとエラーメッセージを表示する', async () => {
    const user = userEvent.setup()
    render(<UserForm mode="edit" userId={2} defaultValues={editDefaults} />)

    await user.clear(screen.getByLabelText(/メールアドレス/))
    await user.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('キャンセルボタンで /master/users に遷移する', async () => {
    render(<UserForm mode="edit" userId={2} defaultValues={editDefaults} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(mockPush).toHaveBeenCalledWith('/master/users')
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
