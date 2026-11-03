"use client";

import { useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";

const STORAGE_KEY = "focus-os:exercise-history:v1";
const EVENT_NAME = "focus-os:exercise-history";
const MAX_ENTRIES = 200;
const VISIBLE_ENTRIES = 8;

export interface ExerciseSet {
  id: string;
  at: number;
  category: string;
  exercise: string;
  count: number;
}

function isSet(value: unknown): value is ExerciseSet {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.at === "number" &&
    typeof v.category === "string" &&
    typeof v.exercise === "string" &&
    typeof v.count === "number"
  );
}

function readSets(): ExerciseSet[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isSet) : [];
  } catch {
    return [];
  }
}

function writeSets(sets: ExerciseSet[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sets.slice(-MAX_ENTRIES)));
  } catch {
    /* Trình duyệt chặn lưu trữ: bỏ qua, bộ đếm vẫn chạy bình thường. */
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

/** Ghi lại một lượt tập. Được bộ đếm gọi khi dừng camera, đổi bài, đặt lại hoặc rời trang. */
export function saveExerciseSet(entry: { category: string; exercise: string; count: number }) {
  if (typeof window === "undefined" || entry.count <= 0) return;
  const now = Date.now();
  writeSets([...readSets(), { ...entry, id: `${now}-${Math.random().toString(36).slice(2, 7)}`, at: now }]);
}

/** Xóa toàn bộ lịch sử tập luyện trên trình duyệt này. */
export function clearExerciseSets() {
  if (typeof window !== "undefined") writeSets([]);
}

/** Đọc lịch sử tập luyện và tự cập nhật khi có lượt tập mới. Trả về null cho tới khi tải xong. */
export function useExerciseSets(): ExerciseSet[] | null {
  const [sets, setSets] = useState<ExerciseSet[] | null>(null);

  useEffect(() => {
    const reload = () => setSets(readSets());
    reload();
    window.addEventListener(EVENT_NAME, reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener(EVENT_NAME, reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  return sets;
}

function isToday(timestamp: number): boolean {
  return new Date(timestamp).toDateString() === new Date().toDateString();
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return isToday(timestamp) ? `Hôm nay, ${time}` : `${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

export function ExerciseHistory() {
  const sets = useExerciseSets();

  const clear = () => {
    if (window.confirm("Xóa toàn bộ lịch sử tập luyện trên trình duyệt này?")) clearExerciseSets();
  };

  if (sets === null) return null;

  const todaySets = sets.filter((s) => isToday(s.at));
  const todayReps = todaySets.reduce((sum, s) => sum + s.count, 0);
  const recent = [...sets].reverse().slice(0, VISIBLE_ENTRIES);

  return (
    <section aria-labelledby="exercise-history-heading" className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 id="exercise-history-heading" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <History className="size-5 text-muted-foreground" aria-hidden="true" />
            Lịch sử tập luyện
          </h2>
          <p className="text-sm text-muted-foreground">Lưu trên trình duyệt này, chỉ có bạn nhìn thấy.</p>
        </div>
        {sets.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Xóa lịch sử
          </button>
        )}
      </div>

      {sets.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Chưa có buổi tập nào. Bật camera và tập vài lần, số lần sẽ được ghi lại ở đây khi bạn tắt camera, đổi bài hoặc đặt lại.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Tổng số lần hôm nay</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{todayReps}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Số lượt tập hôm nay</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{todaySets.length}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Tổng số lượt đã lưu</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{sets.length}</p>
            </div>
          </div>

          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.exercise}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.category} · {formatTime(s.at)}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold tabular-nums">
                  {s.count} <span className="text-sm font-normal text-muted-foreground">lần</span>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
