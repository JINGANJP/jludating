import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-10 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-primary/70">404</p>
        <h2 className="mt-4 text-3xl font-semibold text-text-primary">页面还没被安排进本周计划</h2>
        <p className="mt-3 text-text-secondary">当前路由已经搭好，但这个页面内容还没开始实现。</p>
        <Button asChild className="mt-6">
          <Link to="/">回到首页</Link>
        </Button>
      </Card>
    </div>
  )
}
