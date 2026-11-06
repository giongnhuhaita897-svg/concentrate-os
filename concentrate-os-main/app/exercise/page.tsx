import ExerciseTrainer from "@/components/exercise/exercise-trainer";

export default function ExercisePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Phòng Tập Luyện AI</h1>
      {/* Gọi component bạn vừa thiết kế vào đây */}
      <ExerciseTrainer exerciseName="Squat Thể Lực" targetReps={10} />
    </main>
  );
}