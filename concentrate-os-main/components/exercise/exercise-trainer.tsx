"use client";

import React, { useEffect, useRef, useState } from "react";

interface ExerciseTrainerProps {
  exerciseName?: string;
  targetReps?: number;
}

export default function ExerciseTrainer({
  exerciseName = "Squat Thể Lực",
  targetReps = 10,
}: ExerciseTrainerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
        setStatus("Sẵn sàng! Bắt đầu tạo tư thế...");
      }
    } catch (err: any) {
      console.error("Lỗi truy cập Camera:", err);
      setStatus(`Chưa bật được Camera: ${err?.message || "Bị từ chối"}`);
    }
  };

  useEffect(() => {
    startCamera();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto p-4 bg-slate-900 rounded-xl text-white">
      {/* Khung hiển thị Video / Webcam */}
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

        {/* Bảng đếm Số Rep */}
        <div className="absolute top-4 left-4 bg-slate-950/80 p-3 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Số Rep</p>
          <p className="text-4xl font-bold text-emerald-400">{reps}</p>
          <p className="text-xs text-slate-400">/ {targetReps} reps</p>
        </div>
      </div>

      {/* Nút test giao diện */}
      <div className="flex gap-3">
        <button
          onClick={() => setReps((prev) => prev + 1)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium"
        >
          + Test Đếm Rep
        </button>
        <button
          onClick={() => setReps(0)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
}