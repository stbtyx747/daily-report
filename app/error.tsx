'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <AlertTriangle className="size-12 text-destructive" />
      <h1 className="text-2xl font-semibold">予期せぬエラーが発生しました</h1>
      <p className="text-sm text-muted-foreground">
        {error.message || 'しばらく時間をおいてから再度お試しください。'}
      </p>
      <Button onClick={reset}>再試行</Button>
    </div>
  )
}
