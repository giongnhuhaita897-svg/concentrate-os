import type { Metadata } from "next";
import { ExerciseTrainer } from "@/components/exercise/exercise-trainer";
   import { CameraGuide } from "@/components/exercise/camera-guide";
export const metadata: Metadata = {
  title: "Vận động",
};

export default function ExercisePage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Nghỉ giữa phiên, động một chút
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Đứng dậy, vận động cùng camera.</h1>
        <p className="max-w-xl text-muted-foreground">
          Chọn một bài tập, bật camera và để máy đếm từng lần giúp cậu.
        </p>
      </header>

      <ExerciseTrainer />
         <CameraGuide />
    </div>
  );
}
