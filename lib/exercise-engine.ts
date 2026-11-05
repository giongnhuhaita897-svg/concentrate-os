/** Focus OS exercise counting engine. MediaPipe normalized coordinates. */
export type Point = [number, number];
export type Stage = string | null;
export interface Joints {
  shoulder: Point; elbow: Point; wrist: Point; hip: Point;
  knee: Point; ankle: Point; rShoulder: Point; rWrist: Point;
  rElbow?: Point; rHip?: Point; rKnee?: Point; rAnkle?: Point;
  /** Internal signal: required landmarks were too uncertain to count. */
  reliable?: boolean;
}
export interface CountResult { angle: number; feedback: string; stage: Stage; counter: number; }
interface LandmarkLike { x: number; y: number; visibility?: number; presence?: number; }
const LM = { LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12, LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16, LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26, LEFT_ANKLE: 27, RIGHT_ANKLE: 28 } as const;
const MIN_CONFIDENCE = 0.55;
export function jointsFromLandmarks(landmarks: LandmarkLike[]): Joints {
  let reliable = true;
  const at = (i: number): Point => {
    const lm = landmarks[i];
    if (!lm || !Number.isFinite(lm.x) || !Number.isFinite(lm.y)) {
      reliable = false;
      return [NaN, NaN];
    }
    if ((lm.visibility !== undefined && lm.visibility < MIN_CONFIDENCE) ||
        (lm.presence !== undefined && lm.presence < MIN_CONFIDENCE)) return [NaN, NaN];
    return [lm.x, lm.y];
  };
  const j: Joints = {
    shoulder: at(LM.LEFT_SHOULDER), elbow: at(LM.LEFT_ELBOW), wrist: at(LM.LEFT_WRIST),
    hip: at(LM.LEFT_HIP), knee: at(LM.LEFT_KNEE), ankle: at(LM.LEFT_ANKLE),
    rShoulder: at(LM.RIGHT_SHOULDER), rWrist: at(LM.RIGHT_WRIST),
    rElbow: at(LM.RIGHT_ELBOW), rHip: at(LM.RIGHT_HIP),
    rKnee: at(LM.RIGHT_KNEE), rAnkle: at(LM.RIGHT_ANKLE),
  };
  j.reliable = reliable;
  return j;
}
export function calculateAngle(a: Point, b: Point, c: Point): number {
  if (![...a, ...b, ...c].every(Number.isFinite)) return NaN;
  const ab = Math.hypot(a[0] - b[0], a[1] - b[1]);
  const cb = Math.hypot(c[0] - b[0], c[1] - b[1]);
  if (ab < 1e-5 || cb < 1e-5) return NaN;
  const dot = ((a[0] - b[0]) * (c[0] - b[0]) + (a[1] - b[1]) * (c[1] - b[1])) / (ab * cb);
  return Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
}
export type CategoryId = "abs" | "arms" | "legs" | "shoulder-back";
export interface ExerciseDef { id: string; name: string; hint: string; hold?: boolean; }
export interface CategoryDef { id: CategoryId; name: string; exercises: ExerciseDef[]; }
const SIDE = "Quay bên trái người về phía camera, để thấy rõ vai, hông và chân.";
const FRONT = "Đứng đối diện camera, để thấy rõ cả hai tay và chân.";
export const CATEGORIES: CategoryDef[] = [
  { id: "abs", name: "Bụng", exercises: [
    { id: "co_bung", name: "Cơ bụng", hint: `${SIDE} Gập thân lên rồi trở về tư thế ban đầu.` },
    { id: "nang_chan", name: "Nâng chân", hint: `${SIDE} Nâng chân rồi hạ xuống có kiểm soát.` },
    { id: "leo_nui", name: "Leo núi", hint: `${SIDE} Co gối về ngực rồi duỗi ra.` },
  ] },
  { id: "arms", name: "Cánh tay", exercises: [
    { id: "nang_tay", name: "Nâng tay", hint: `${SIDE} Gập rồi duỗi khuỷu tay trái.` },
    { id: "giang_tay", name: "Giang tay", hint: `${FRONT} Nâng tay trái ngang vai rồi hạ xuống.` },
    { id: "hit_dat", name: "Hít đất", hint: `${SIDE} Hạ người rồi đẩy lên trở lại.` },
  ] },
  { id: "legs", name: "Chân", exercises: [
    { id: "nhay_sang_ben", name: "Nhảy sang bên", hint: `${FRONT} Mở hai chân sang hai bên rồi khép lại.` },
    { id: "ganh_dui", name: "Gánh đùi", hint: `${SIDE} Hạ người rồi đứng thẳng trở lại.` },
    { id: "tan_sau", name: "Tấn sau", hint: `${SIDE} Bước lùi, hạ người rồi đứng lên.` },
  ] },
  { id: "shoulder-back", name: "Vai & lưng", exercises: [
    { id: "keo_co_thoi", name: "Kéo cơ thoi", hint: `${FRONT} Kéo khuỷu tay về sau rồi thả ra.` },
    { id: "tay_cat_keo", name: "Tay cắt kéo", hint: `${FRONT} Dang tay rồi bắt chéo trước ngực.` },
    { id: "tu_the_dua_tre", name: "Tư thế đứa trẻ", hint: `${SIDE} Giữ tư thế thoải mái.`, hold: true },
  ] },
];
const STAGE_LABELS: Record<string, string> = {
  xuong: "Xuống", len: "Lên", co_gieu: "Co gối", duoi_than: "Duỗi thẳng",
  ha: "Hạ tay", giang: "Giang tay", chum: "Chụm chân", nhay: "Dang chân",
  dung: "Đứng", nhun: "Nhún", tan: "Tấn", keo: "Kéo vào", nha: "Mở ra",
  cat: "Tay dang", mo: "Tay bắt chéo",
};
export function stageLabel(stage: Stage): string {
  return stage ? STAGE_LABELS[stage] ?? stage : "Chưa bắt đầu";
}

type Rule = { metric: number; low: number; high: number; lowStage: string; highStage: string; countOn: "low" | "high"; feedback?: string };
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const avg = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b) ? (a + b) / 2 : NaN;
const torso = (j: Joints) => dist(j.shoulder, j.hip);
const kneeAngle = (j: Joints) => calculateAngle(j.hip, j.knee, j.ankle);
const elbowAngle = (j: Joints) => calculateAngle(j.shoulder, j.elbow, j.wrist);
function ruleFor(ex: string, j: Joints): Rule | null {
  const shoulderAngle = calculateAngle(j.hip, j.shoulder, j.elbow);
  const knee = kneeAngle(j);
  const elbow = elbowAngle(j);
  const trunk = torso(j);
  switch (ex) {
    case "co_bung": return { metric: calculateAngle(j.shoulder, j.hip, j.knee), low: 85, high: 125, lowStage: "len", highStage: "xuong", countOn: "low" };
    case "nang_chan": return { metric: calculateAngle(j.shoulder, j.hip, j.ankle), low: 105, high: 145, lowStage: "len", highStage: "xuong", countOn: "low" };
    case "leo_nui": return { metric: knee, low: 100, high: 145, lowStage: "co_gieu", highStage: "duoi_than", countOn: "low" };
    case "nang_tay": return { metric: elbow, low: 55, high: 145, lowStage: "len", highStage: "xuong", countOn: "low" };
    case "giang_tay": return { metric: shoulderAngle, low: 40, high: 75, lowStage: "ha", highStage: "giang", countOn: "high" };
    case "hit_dat": return { metric: elbow, low: 100, high: 150, lowStage: "xuong", highStage: "len", countOn: "high" };
    case "ganh_dui": return { metric: knee, low: 105, high: 155, lowStage: "nhun", highStage: "dung", countOn: "high" };
    case "tan_sau": return { metric: knee, low: 110, high: 155, lowStage: "tan", highStage: "dung", countOn: "high" };
    case "nhay_sang_ben": {
      const rightAnkle = j.rAnkle;
      const rightHip = j.rHip;
      const width = rightAnkle && rightHip ? dist(j.ankle, rightAnkle) / Math.max(dist(j.hip, rightHip), 0.04) : NaN;
      return { metric: width, low: 1.7, high: 2.7, lowStage: "chum", highStage: "nhay", countOn: "high" };
    }
    case "keo_co_thoi": {
      // Approximate elbow extension; not a validated measure of scapular retraction.
      const metric = elbow;
      return { metric, low: 95, high: 145, lowStage: "keo", highStage: "nha", countOn: "low" };
    }
    case "tay_cat_keo": {
      // Horizontal wrist separation relative to shoulder width; avoid left/right ordering.
      const width = dist(j.shoulder, j.rShoulder);
      const separation = width > 0.04 ? Math.abs(j.wrist[0] - j.rWrist[0]) / width : NaN;
      return { metric: separation, low: 0.55, high: 1.5, lowStage: "mo", highStage: "cat", countOn: "low" };
    }
    default: return null;
  }
}

/** A counter instance is owned by one camera session; do not share between users. */
export class ExerciseRepTracker {
  private exercise = "";
  private stage: Stage = null;
  private count = 0;
  private candidate: Stage = null;
  private candidateSince = 0;
  private lastCountAt = -Infinity;
  private lastValidAt = 0;
  private smoothed = NaN;
  constructor(private readonly holdMs = 120, private readonly cooldownMs = 400) {}
  reset() {
    this.exercise = ""; this.stage = null; this.count = 0; this.candidate = null;
    this.candidateSince = 0; this.lastCountAt = -Infinity; this.lastValidAt = 0;
    this.smoothed = NaN;
  }
  missing(now = performance.now()): CountResult {
    // Do not complete a rep across an extended tracking interruption.
    if (this.lastValidAt && now - this.lastValidAt > 450) {
      this.stage = null; this.candidate = null; this.smoothed = NaN;
    }
    return { angle: 0, feedback: "Đưa các khớp vào khung hình", stage: this.stage, counter: this.count };
  }
  update(categoryId: CategoryId, exerciseId: string, joints: Joints, now = performance.now()): CountResult {
    if (this.exercise !== `${categoryId}/${exerciseId}`) {
      this.reset(); this.exercise = `${categoryId}/${exerciseId}`;
    }
    if (exerciseId === "tu_the_dua_tre") {
      const angle = calculateAngle(joints.shoulder, joints.hip, joints.knee);
      if (!Number.isFinite(angle)) return this.missing(now);
      this.lastValidAt = now;
      return { angle, feedback: angle < 65 ? "Giữ nguyên tư thế" : "Điều chỉnh tư thế thoải mái hơn", stage: null, counter: this.count };
    }
    const rule = ruleFor(exerciseId, joints);
    if (!rule || !Number.isFinite(rule.metric)) return this.missing(now);
    if (this.lastValidAt && now - this.lastValidAt > 450) {
      this.stage = null; this.candidate = null; this.smoothed = NaN;
    }
    this.lastValidAt = now;
    this.smoothed = Number.isFinite(this.smoothed) ? 0.45 * rule.metric + 0.55 * this.smoothed : rule.metric;
    const value = this.smoothed;
    const next = value <= rule.low ? rule.lowStage : value >= rule.high ? rule.highStage : null;
    if (next === null) this.candidate = null;
    else if (next !== this.candidate) { this.candidate = next; this.candidateSince = now; }
    else if (now - this.candidateSince >= this.holdMs && next !== this.stage) {
      const previous = this.stage;
      this.stage = next;
      const completed = rule.countOn === "low" ? next === rule.lowStage && previous === rule.highStage : next === rule.highStage && previous === rule.lowStage;
      if (completed && now - this.lastCountAt >= this.cooldownMs) {
        this.count++; this.lastCountAt = now;
      }
    }
    return { angle: value, feedback: this.stage ? "Tiếp tục động tác có kiểm soát" : "Vào tư thế bắt đầu", stage: this.stage, counter: this.count };
  }
}

/** Compatibility with the old stateless API. Prefer ExerciseRepTracker in the camera component. */
export function countRep(categoryId: CategoryId, exerciseId: string, stage: Stage, counter: number, joints: Joints): CountResult {
  if (exerciseId === "tu_the_dua_tre") {
    const angle = calculateAngle(joints.shoulder, joints.hip, joints.knee);
    return { angle: Number.isFinite(angle) ? angle : 0, feedback: angle < 65 ? "Giữ nguyên tư thế" : "Điều chỉnh tư thế", stage, counter };
  }
  const r = ruleFor(exerciseId, joints);
  if (!r || !Number.isFinite(r.metric)) return { angle: 0, feedback: "Không thấy đủ các khớp", stage, counter };
  const next = r.metric <= r.low ? r.lowStage : r.metric >= r.high ? r.highStage : stage;
  const completed = r.countOn === "low" ? next === r.lowStage && stage === r.highStage : next === r.highStage && stage === r.lowStage;
  return { angle: r.metric, feedback: "Tiếp tục động tác", stage: next, counter: counter + (completed ? 1 : 0) };
}
