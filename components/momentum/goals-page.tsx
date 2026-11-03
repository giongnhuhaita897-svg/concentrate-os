'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dumbbell, Plus } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useWorkspace } from '@/hooks/use-workspace'
import { useInterface } from '@/hooks/use-interface'
import { goalProgress } from '@/lib/momentum/format'
import { ExerciseHistory } from '@/components/exercise/exercise-history'
import { PageHeading, EmptyState } from './ui-parts'
import { GoalCard } from './goal-card'

export function GoalsPage() {
  const { workspace } = useWorkspace()
  const actions = useInterface()
  const [filter, setFilter] = useState('active')
  const goals = workspace.goals.filter((goal) =>
    filter === 'archived'
      ? goal.archived
      : !goal.archived &&
        (filter === 'completed'
          ? goalProgress(goal.id, workspace.tasks).percent === 100
          : goalProgress(goal.id, workspace.tasks).percent < 100),
  )

  return (
    <div className="secondary-page">
      <PageHeading
        eyebrow="MỖI MỤC TIÊU, MỘT HÀNH TRÌNH"
        title="Điều cậu đang hướng tới."
        description="Cho những điều quan trọng một nơi để bắt đầu."
      >
        <Button onClick={actions.newGoal}>
          <Plus data-icon="inline-start" />
          Tạo mục tiêu
        </Button>
      </PageHeading>

      <ToggleGroup
        value={[filter]}
        onValueChange={(values) => {
          if (values[0]) setFilter(String(values[0]))
        }}
        aria-label="Lọc mục tiêu"
      >
        <ToggleGroupItem value="active">Đang theo đuổi</ToggleGroupItem>
        <ToggleGroupItem value="completed">Đã hoàn thành</ToggleGroupItem>
        <ToggleGroupItem value="archived">Lưu trữ</ToggleGroupItem>
      </ToggleGroup>

      {goals.length ? (
        <div className="overview-goals-grid">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <EmptyState title="Một khoảng trống cho điều mới" description="Chưa có mục tiêu nào trong nhóm này.">
          <Button onClick={actions.newGoal}>Tạo mục tiêu</Button>
        </EmptyState>
      )}

      <section
        aria-labelledby="goals-exercise-heading"
        className="flex flex-col gap-8 border-t border-border pt-8 [&>div>section]:border-t-0 [&>div>section]:pt-0"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">VẬN ĐỘNG CÙNG MỤC TIÊU</p>
            <h2 id="goals-exercise-heading" className="text-2xl font-semibold tracking-tight">
              Giữ nhịp cho cơ thể
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Xem lại các buổi tập của bạn và cách đặt camera để máy đếm chính xác.
            </p>
          </div>
          <Link href="/exercise" className={buttonVariants()}>
            <Dumbbell data-icon="inline-start" />
            Bắt đầu tập
          </Link>
        </div>

        <div className="flex flex-col gap-8">
          <ExerciseHistory />
      
        </div>
      </section>
    </div>
  )
}