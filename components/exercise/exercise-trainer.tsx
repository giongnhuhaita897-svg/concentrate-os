"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RotateCcw } from "lucide-react";
import type { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";
import {
  CATEGORIES,
  countRep,
  jointsFromLandmarks,
  stageLabel,
  type CategoryId,
  type Stage,
} from "@/lib/exercise-engine";

/* Bản wasm phải trùng phiên bản với gói đã cài: pnpm add @mediapipe/tasks-vision@1.1.1 */
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

const SKELETON_COLOR = "#9fe3bd";
const JOINT_COLOR = "#ffffff";
const IDLE_FEEDBACK = "Hướng camera vào toàn thân";

type Phase = "idle" | "starting" | "running" | "error";

interface Display {
  count: number;
  stage: Stage;
  angle: number;
  feedback: string;
}

const EMPTY_DISPLAY: Display = { count: 0, stage: null, angle: 0, feedback: IDLE_FEEDBACK };

function describeError(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === "NotAllowedError") {
      return "Trình duyệt chưa cho phép dùng camera. Bấm vào biểu tượng ổ khóa cạnh thanh địa chỉ, cho phép camera rồi thử lại.";
    }
    if (e.name === "NotFoundError") return "Không tìm thấy camera trên thiết bị này.";
    if (e.name === "NotReadableError") {
      return "Camera đang được ứng dụng khác sử dụng. Đóng ứng dụng đó rồi thử lại.";
    }
  }
  return "Không khởi động được nhận diện. Kiểm tra kết nối mạng rồi thử lại.";
}

export function ExerciseTrainer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const drawingRef = useRef<DrawingUtils | null>(null);
  const connectionsRef = useRef<typeof PoseLandmarker.POSE_CONNECTIONS | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastPushRef = useRef(0);
  const mountedRef = useRef(true);
  const startLockRef = useRef(false);

  const [categoryId, setCategoryId] = useState<CategoryId>(CATEGORIES[0].id);
  const [exerciseId, setExerciseId] = useState<string>(CATEGORIES[0].exercises[0].id);
  const selectionRef = useRef({ categoryId: CATEGORIES[0].id, exerciseId: CATEGORIES[0].exercises[0].id });
  const counterRef = useRef<{ count: number; stage: Stage }>({ count: 0, stage: null });

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState({ w: 16, h: 9 });
  const [display, setDisplay] = useState<Display>(EMPTY_DISPLAY);

  const category = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];
  const exercise = category.exercises.find((e) => e.id === exerciseId) ?? category.exercises[0];
  const running = phase === "running";

  /* ---------------- chọn danh mục, bài tập ---------------- */

  const choose = useCallback((cat: CategoryId, ex: string) => {
    selectionRef.current = { categoryId: cat, exerciseId: ex };
    counterRef.current = { count: 0, stage: null };
    setCategoryId(cat);
    setExerciseId(ex);
    setDisplay((d) => ({ ...d, count: 0, stage: null, angle: 0 }));
  }, []);

  const chooseCategory = useCallback(
    (cat: CategoryId) => {
      const first = CATEGORIES.find((c) => c.id === cat)?.exercises[0];
      if (first) choose(cat, first.id);
    },
    [choose],
  );

  const nextExercise = useCallback(() => {
    const { categoryId: c, exerciseId: e } = selectionRef.current;
    const cat = CATEGORIES.find((x) => x.id === c) ?? CATEGORIES[0];
    const i = cat.exercises.findIndex((x) => x.id === e);
    choose(cat.id, cat.exercises[(i + 1) % cat.exercises.length].id);
  }, [choose]);

  const nextCategory = useCallback(() => {
    const i = CATEGORIES.findIndex((x) => x.id === selectionRef.current.categoryId);
    chooseCategory(CATEGORIES[(i + 1) % CATEGORIES.length].id);
  }, [chooseCategory]);

  const resetCounter = useCallback(() => {
    counterRef.current = { count: 0, stage: null };
    setDisplay((d) => ({ ...d, count: 0, stage: null, angle: 0 }));
  }, []);

  /* ---------------- vòng lặp nhận diện ---------------- */

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) return;
    if (video.currentTime === lastVideoTimeRef.current) return;
    lastVideoTimeRef.current = video.currentTime;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const result = landmarker.detectForVideo(video, performance.now());
    const landmarks = result.landmarks[0];

    let angle = 0;
    let feedback = IDLE_FEEDBACK;

    if (landmarks) {
      try {
        const { categoryId: cat, exerciseId: ex } = selectionRef.current;
        const r = countRep(
          cat,
          ex,
          counterRef.current.stage,
          counterRef.current.count,
          jointsFromLandmarks(landmarks),
        );
        counterRef.current = { count: r.counter, stage: r.stage };
        angle = r.angle;
        feedback = r.feedback;
      } catch {
        feedback = "Không thấy đủ các khớp cần thiết";
      }

      const drawing = drawingRef.current;
      const connections = connectionsRef.current;
      if (drawing && connections) {
        drawing.drawConnectors(landmarks, connections, { color: SKELETON_COLOR, lineWidth: 3 });
        drawing.drawLandmarks(landmarks, { color: JOINT_COLOR, fillColor: JOINT_COLOR, radius: 3 });
      }
    }

    /* Cập nhật giao diện tối đa ~12 lần/giây để không giật. */
    const now = performance.now();
    if (now - lastPushRef.current > 80) {
      lastPushRef.current = now;
      setDisplay({
        count: counterRef.current.count,
        stage: counterRef.current.stage,
        angle,
        feedback,
      });
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    lastVideoTimeRef.current = -1;
  }, []);

  const start = useCallback(async () => {
    // Ref khóa đồng bộ ngay lập tức, tránh nhiều lần click trước khi React render.
    if (startLockRef.current || phase === "starting" || phase === "running") return;
    startLockRef.current = true;
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera chỉ hoạt động trên https hoặc localhost. Hãy mở trang bằng http://localhost:3000.");
      setPhase("error");
      startLockRef.current = false;
      return;
    }

    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 540 } },
        audio: false,
      });
      streamRef.current = stream;

      // Người dùng có thể rời trang trong lúc trình duyệt đang hỏi quyền camera.
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        return;
      }

      const video = videoRef.current;
      if (!video) throw new Error("Không tìm thấy khung video");
      video.srcObject = stream;
      await video.play();

      if (!mountedRef.current) {
        stop();
        return;
      }
      setVideoSize({ w: video.videoWidth || 16, h: video.videoHeight || 9 });

      if (!landmarkerRef.current) {
        const { FilesetResolver, PoseLandmarker, DrawingUtils } = await import("@mediapipe/tasks-vision");
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        if (!mountedRef.current) {
          stop();
          return;
        }

        const options = {
          runningMode: "VIDEO" as const,
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        };
        try {
          landmarkerRef.current = await PoseLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          });
        } catch {
          landmarkerRef.current = await PoseLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          });
        }

        // Nếu component bị tháo trong lúc mô hình đang tải, đóng mô hình vừa tạo.
        if (!mountedRef.current) {
          landmarkerRef.current.close();
          landmarkerRef.current = null;
          stop();
          return;
        }

        connectionsRef.current = PoseLandmarker.POSE_CONNECTIONS;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) drawingRef.current = new DrawingUtils(ctx);
      }

      if (!mountedRef.current) {
        stop();
        return;
      }
      counterRef.current = { count: 0, stage: null };
      setDisplay(EMPTY_DISPLAY);
      setPhase("running");

      const loop = () => {
        processFrame();
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      stop();
      if (mountedRef.current) {
        setError(describeError(e));
        setPhase("error");
      }
    } finally {
      startLockRef.current = false;
    }
  }, [phase, processFrame, stop]);

  const toggleCamera = useCallback(() => {
    if (phase === "running") {
      stop();
      setPhase("idle");
    } else {
      void start();
    }
  }, [phase, start, stop]);

  /* ---------------- dọn dẹp khi rời trang ---------------- */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stop();
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      drawingRef.current = null;
    };
  }, [stop]);

  /* ---------------- phím tắt giống bản Python ---------------- */

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      const k = ev.key.toLowerCase();
      if (k >= "1" && k <= "4") chooseCategory(CATEGORIES[Number(k) - 1].id);
      else if (k === "n") nextExercise();
      else if (k === "m") nextCategory();
      else if (k === "r") resetCounter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chooseCategory, nextExercise, nextCategory, resetCounter]);

  /* ---------------- giao diện ---------------- */

  const feedbackText = running ? display.feedback : "Camera đang tắt";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* Khung camera */}
      <section aria-label="Camera" className="flex flex-col gap-3">
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-border bg-card"
          style={{ aspectRatio: `${videoSize.w} / ${videoSize.h}` }}
        >
          {/* Lật gương để người tập thấy mình như soi gương. Mô hình vẫn nhận ảnh gốc, giống bản Python. */}
          <div className="absolute inset-0 scale-x-[-1]">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          </div>

          {phase !== "running" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card/90 p-6 text-center">
              {phase === "starting" ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
                  />
                  <p className="text-sm text-muted-foreground">Đang mở camera và tải mô hình…</p>
                </>
              ) : (
                <>
                  <Camera className="size-8 text-muted-foreground" aria-hidden="true" />
                  <div className="max-w-sm space-y-1">
                    <p className="font-medium">
                      {phase === "error" ? "Chưa bật được camera" : "Sẵn sàng tập chưa?"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {error ??
                        "Hình ảnh được xử lý ngay trên máy của bạn, không được tải lên đâu cả."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void start()}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Camera className="size-4" aria-hidden="true" />
                    {phase === "error" ? "Thử lại" : "Bật camera"}
                  </button>
                </>
              )}
            </div>
          )}

          {running && (
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-start">
              <p className="rounded-lg bg-background/80 px-3 py-1.5 text-sm backdrop-blur">
                {feedbackText}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{exercise.hint}</p>
          {running && (
            <button
              type="button"
              onClick={toggleCamera}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <CameraOff className="size-4" aria-hidden="true" />
              Tắt camera
            </button>
          )}
        </div>
      </section>

      {/* Bảng điều khiển */}
      <aside aria-label="Bài tập" className="flex flex-col gap-5">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Nhóm cơ</h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === categoryId}
                onClick={() => chooseCategory(c.id)}
                className={`h-10 rounded-lg border px-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  c.id === categoryId
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <span className="mr-2 tabular-nums text-muted-foreground">{i + 1}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Bài tập</h2>
          <div className="flex flex-col gap-1.5">
            {category.exercises.map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={e.id === exerciseId}
                onClick={() => choose(category.id, e.id)}
                className={`h-10 rounded-lg border px-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  e.id === exerciseId
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          {exercise.hold ? (
            <>
              <p className="text-sm text-muted-foreground">Tư thế</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {running ? display.feedback : "Giữ tư thế"}
              </p>
              <p className="mt-3 text-sm text-muted-foreground tabular-nums">
                Góc hiện tại: {Math.round(display.angle)}°
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Số lần</p>
              <p className="mt-1 text-6xl font-semibold tabular-nums tracking-tight">{display.count}</p>
              <p className="mt-3 text-sm text-muted-foreground tabular-nums">
                {stageLabel(display.stage)} · Góc {Math.round(display.angle)}°
              </p>
            </>
          )}
          <button
            type="button"
            onClick={resetCounter}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Đặt lại
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Phím tắt: 1–4 chọn nhóm cơ, N đổi bài, M đổi nhóm, R đặt lại số lần.
        </p>
      </aside>
    </div>
  );
}