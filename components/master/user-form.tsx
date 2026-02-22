'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

// ─── バリデーションスキーマ ───────────────────────────────────

const baseSchema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'メール形式で入力してください',
    }),
  role: z.enum(['sales', 'manager'] as const, {
    message: '役割を選択してください',
  }),
  department: z.string().optional(),
})

const createSchema = baseSchema.extend({
  password: z.string().min(1, 'パスワードは必須です'),
})

const editSchema = baseSchema.extend({
  password: z.string().optional(),
})

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>
type UserFormValues = CreateValues | EditValues

// ─── Props ────────────────────────────────────────────────────

type CreateMode = {
  mode: 'create'
  defaultValues?: Partial<CreateValues>
}

type EditMode = {
  mode: 'edit'
  userId: number
  defaultValues?: Partial<EditValues>
}

type UserFormProps = CreateMode | EditMode

// ─── コンポーネント ───────────────────────────────────────────

export function UserForm(props: UserFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEdit = props.mode === 'edit'
  const schema = isEdit ? editSchema : createSchema

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: undefined,
      department: '',
      ...props.defaultValues,
    },
  })

  const roleValue = watch('role')

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true)
    try {
      const url =
        isEdit
          ? `/api/v1/master/users/${(props as EditMode).userId}`
          : '/api/v1/master/users'
      const method = isEdit ? 'PUT' : 'POST'

      // 編集時にパスワードが空なら送らない
      const body: Record<string, unknown> = { ...data }
      if (isEdit && !body.password) {
        delete body.password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json()
        const message = json?.error?.message ?? '保存に失敗しました'
        toast({ variant: 'destructive', title: 'エラー', description: message })
        return
      }

      toast({
        title: isEdit ? 'ユーザーを更新しました' : 'ユーザーを登録しました',
      })
      router.push('/master/users')
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'エラー', description: '通信エラーが発生しました' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 氏名 */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          氏名 <span className="text-destructive">*</span>
        </Label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* メールアドレス */}
      <div className="space-y-1.5">
        <Label htmlFor="email">
          メールアドレス <span className="text-destructive">*</span>
        </Label>
        <Input id="email" type="text" inputMode="email" {...register('email')} />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* パスワード */}
      <div className="space-y-1.5">
        <Label htmlFor="password">
          パスワード{' '}
          {isEdit ? (
            <span className="text-muted-foreground text-xs">（変更しない場合は空欄）</span>
          ) : (
            <span className="text-destructive">*</span>
          )}
        </Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* 役割 */}
      <div className="space-y-1.5">
        <Label htmlFor="role">役割</Label>
        <Select
          value={roleValue}
          onValueChange={(v) => setValue('role', v as 'sales' | 'manager', { shouldValidate: true })}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">sales</SelectItem>
            <SelectItem value="manager">manager</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      {/* 部署 */}
      <div className="space-y-1.5">
        <Label htmlFor="department">部署</Label>
        <Input id="department" {...register('department')} />
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中…' : '保存'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/master/users')}
        >
          キャンセル
        </Button>
      </div>
    </form>
  )
}
