"use client";

import React, { useEffect, useRef, useState } from "react";

// Danh sách các bài tập tối ưu cho góc nhìn webcam cố định (đứng/ngồi tại chỗ, dễ tracking AI)
const EXERCISE_LIST = [
  { id: "squat", name: "Squat Thể Lực", targetReps: 10, tip: "Đứng lùi ra xa 1.5m để thấy toàn thân từ hông đến chân" },
  { id: "bicep", name: "Tập Tay Trước (Bicep Curls)", targetReps: 12, tip: "Giữ tay trong khung hình nửa thân trên trước ống kính" },
  { id: "high-knees", name: "Nâng Cao Đùi Tại Chỗ", targetReps: 20, tip: "Đứng thẳng và nâng gối cao vuông góc ngang thắt lưng" },
  { id: "arm-circles", name: "Xoay Tay (Arm Circles)", targetReps: 15, tip: "Dang ngang tay rộng và xoay tròn đều hai bên" },
];

export default function ExerciseTrainer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Trạng thái bài tập hiện tại được chọn
  const [selectedExercise, setSelectedExercise] = useState(EXERCISE_LIST[0]);
  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("Đang kết nối camera...");
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      setStatus("Đang yêu cầu quyền truy cập Camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setStatus("Sẵn sàng! Hãy vào khung hình...");
      }
    } catch (err: any) {
      console.error("Lỗi truy cập Camera:", err);
      setStatus(`Chưa bật được Camera: ${err?.message || "Bị từ chối"}`);
    }
  };

  useEffect(() => {
    startCamera();
  }, []);

  // Hàm chuyển đổi bài tập và reset lại số rep
  const handleSelectExercise = (exercise: typeof EXERCISE_LIST[0]) => {
    setSelectedExercise(exercise);
    setReps(0);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto p-4 bg-slate-950 rounded-xl text-white">
      
      {/* THANH CHỌN BÀI TẬP TRỰC QUAN */}
      <div className="w-full flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-300">Chọn bài tập tối ưu cho Webcam:</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {EXERCISE_LIST.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectExercise(item)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition text-left border ${
                selectedExercise.id === item.id
                  ? "bg-emerald-600 border-emerald-400 text-white shadow-lg"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="font-bold">{item.name}</div>
              <div className="text-[10px] opacity-80">Mục tiêu: {item.targetReps} reps</div>
            </button>
          ))}
        </div>
      </div>

      {/* KHUNG HIỂN THỊ WEBCAM */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 p-4">
            <p className="text-amber-400 font-medium text-center">{status}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition"
            >
              Bật Camera Thủ Công
            </button>
          </div>
        )}

        {/* BẢNG ĐẾM SỐ REP & HƯỚNG DẪN GÓC QUAY */}
        <div className="absolute top-4 left-4 bg-slate-900/90 p-3 rounded-lg border border-slate-700 backdrop-blur-md">
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{selectedExercise.name}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-extrabold text-white">{reps}</span>
            <span className="text-xs text-slate-400">/ {selectedExercise.targetReps} reps</span>
          </div>
          <p className="text-[10px] text-amber-300 mt-1 max-w-[220px]">💡 {selectedExercise.tip}</p>
        </div>
      </div>

      {/* NÚT TEST / ĐẶT LẠI GIAO DIỆN */}
      <div className="flex gap-3">
        <button
          onClick={() => setReps((prev) => prev + 1)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold transition"
        >
          + Mô phỏng đếm Rep (Test)
        </button>
        <button
          onClick={() => setReps(0)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition"
        >
          Đặt lại (Reset)
        </button>
      </div>
    </div>
  );
}