import { ExerciseTrainer } from "@/components/exercise/exercise-trainer";

export default function ExercisePage() {
  return (
    <main className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Phòng tập thể dục
      </h1>
      <ExerciseTrainer />
    </main>
  );
}