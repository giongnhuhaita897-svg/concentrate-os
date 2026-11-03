"use client";

import { Dumbbell, Flame, Target, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PageHeading, SectionHeading } from "@/components/momentum/ui-parts";
import { ExerciseTrainer } from "./exercise-trainer";
import { clearExerciseSets, useExerciseSets, type ExerciseSet } from "./exercise-history";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MAX_ROWS = 20;

function dayKey(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Số lần tập của 7 ngày gần nhất (ngày cuối là hôm nay). */
export function buildWeek(sets: ExerciseSet[], now: Date = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
    const key = dayKey(date);
    const reps = sets.filter((s) => dayKey(new Date(s.at)) === key).reduce((sum, s) => sum + s.count, 0);
    return { day: DAY_LABELS[date.getDay()], reps, fill: index === 6 ? "var(--chart-1)" : "var(--chart-2)" };
  });
}

/** Số ngày liên tiếp có tập. Nếu hôm nay chưa tập thì tính từ hôm qua. */
export function exerciseStreak(sets: ExerciseSet[], now: Date = new Date()): number {
  const days = new Set(sets.map((s) => dayKey(new Date(s.at))));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatWhen(timestamp: number): string {
  const d = new Date(timestamp);
  const date = d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long" });
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}

export function MonitorPage() {
  const sets = useExerciseSets() ?? [];
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
  const weekSets = sets.filter((s) => s.at >= weekStart);
  const weekReps = weekSets.reduce((sum, s) => sum + s.count, 0);
  const rows = [...sets].reverse().slice(0, MAX_ROWS);

  const clear = () => {
    if (window.confirm("Xóa toàn bộ lịch sử tập luyện trên trình duyệt này?")) clearExerciseSets();
  };

  return (
    <div className="secondary-page">
      <PageHeading
        eyebrow="THỰC HIỆN VÀ GIÁM SÁT"
        title="Tập đều, nhìn lại để tiến xa."
        description="Tập cùng camera ở trên, rồi xem mình đã đi được bao xa ở phía dưới."
      />

      <section aria-label="Thực hiện">
        <SectionHeading title="Thực hiện" />
        <ExerciseTrainer />
      </section>

      <div className="insight-metrics">
        <Card>
          <CardHeader>
            <CardDescription>
              <Dumbbell />
              Số lần trong 7 ngày
            </CardDescription>
            <CardTitle>{weekReps} lần</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>
              <Flame />
              Chuỗi ngày bền bỉ
            </CardDescription>
            <CardTitle>{exerciseStreak(sets, now)} ngày</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>
              <Target />
              Lượt tập trong 7 ngày
            </CardDescription>
            <CardTitle>{weekSets.length} lượt</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="insight-chart-panel">
        <CardHeader>
          <CardTitle>Nhịp độ tập luyện</CardTitle>
          <CardDescription>Số lần tập trong 7 ngày qua</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ reps: { label: "Số lần", color: "var(--chart-1)" } }}
            className="activity-chart"
            aria-label="Số lần tập luyện trong 7 ngày qua"
          >
            <BarChart accessibilityLayer data={buildWeek(sets, now)} barSize={25} margin={{ left: -27, right: 0, top: 6, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 5" />
              <YAxis tickLine={false} axisLine={false} fontSize={10} tickCount={4} allowDecimals={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} fontSize={10} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="reps" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <section aria-label="Lịch sử luyện tập">
        <SectionHeading title="Lịch sử luyện tập" count={sets.length}>
          {sets.length > 0 && (
            <Button variant="outline" size="sm" onClick={clear}>
              <Trash2 data-icon="inline-start" />
              Xóa lịch sử
            </Button>
          )}
        </SectionHeading>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có buổi tập nào. Tập ở phần Thực hiện phía trên, số lần sẽ được ghi lại ở đây khi bạn tắt camera, đổi bài hoặc đặt lại.
          </p>
        ) : (
          <div className="session-list">
            {rows.map((s) => (
              <div key={s.id}>
                <span className="session-icon">
                  <Dumbbell />
                </span>
                <div>
                  <strong>{s.exercise}</strong>
                  <small>
                    {s.category} · {formatWhen(s.at)}
                  </small>
                </div>
                <span>{s.count} lần</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Lịch sử lưu trên trình duyệt này, chỉ có bạn nhìn thấy.</p>
      </section>
    </div>
  );
}
