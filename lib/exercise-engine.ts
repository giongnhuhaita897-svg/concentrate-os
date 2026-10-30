/** Luật đếm bài tập dựa trên điểm khớp MediaPipe Pose. */
export type Point = [number, number];
export type Stage = string | null;
export interface Joints {
  shoulder: Point; elbow: Point; wrist: Point; hip: Point;
  knee: Point; ankle: Point; rShoulder: Point; rWrist: Point;
}
export interface CountResult { angle: number; feedback: string; stage: Stage; counter: number; }
interface LandmarkLike { x: number; y: number; }
const LM = { LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12, LEFT_ELBOW: 13,
  LEFT_WRIST: 15, RIGHT_WRIST: 16, LEFT_HIP: 23, LEFT_KNEE: 25, LEFT_ANKLE: 27 } as const;
export function jointsFromLandmarks(landmarks: LandmarkLike[]): Joints {
  const at = (i: number): Point => {
    const lm = landmarks[i];
    if (!lm) throw new Error(`Thiếu điểm khớp số ${i}`);
    return [lm.x, lm.y];
  };
  return { shoulder: at(LM.LEFT_SHOULDER), elbow: at(LM.LEFT_ELBOW),
    wrist: at(LM.LEFT_WRIST), hip: at(LM.LEFT_HIP), knee: at(LM.LEFT_KNEE),
    ankle: at(LM.LEFT_ANKLE), rShoulder: at(LM.RIGHT_SHOULDER), rWrist: at(LM.RIGHT_WRIST) };
}
export function calculateAngle(a: Point, b: Point, c: Point): number {
  const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
  const angle = Math.abs((radians * 180) / Math.PI);
  return angle > 180 ? 360 - angle : angle;
}
export type CategoryId = "abs" | "arms" | "legs" | "shoulder-back";
export interface ExerciseDef { id: string; name: string; hint: string; hold?: boolean; }
export interface CategoryDef { id: CategoryId; name: string; exercises: ExerciseDef[]; }
const SIDE = "Quay bên trái người về phía camera, để thấy rõ vai, hông và chân.";
const FRONT = "Đứng đối diện camera, để thấy rõ cả hai tay.";
export const CATEGORIES: CategoryDef[] = [
  { id: "abs", name: "Bụng", exercises: [
    { id: "co_bung", name: "Cơ bụng", hint: `${SIDE} Gập thân lên để đếm một lần.` },
    { id: "nang_chan", name: "Nâng chân", hint: `${SIDE} Nâng chân lên cao để đếm một lần.` },
    { id: "leo_nui", name: "Leo núi", hint: `${SIDE} Co gối về phía ngực để đếm một lần.` },
  ] },
  { id: "arms", name: "Cánh tay", exercises: [
    { id: "nang_tay", name: "Nâng tay", hint: `${SIDE} Gập khuỷu tay trái lên để đếm một lần.` },
    { id: "giang_tay", name: "Giang tay", hint: `${FRONT} Giang tay trái ra ngang vai để đếm một lần.` },
    { id: "hit_dat", name: "Hít đất", hint: `${SIDE} Hạ người xuống cho khuỷu tay gập để đếm một lần.` },
  ] },
  { id: "legs", name: "Chân", exercises: [
    { id: "nhay_sang_ben", name: "Nhảy sang bên", hint: `${FRONT} Chụm hai tay rồi dang rộng ra để đếm một lần.` },
    { id: "ganh_dui", name: "Gánh đùi", hint: `${SIDE} Hạ người cho gối gập để đếm một lần.` },
    { id: "tan_sau", name: "Tấn sau", hint: `${SIDE} Hạ người cho gối gập để đếm một lần.` },
  ] },
  { id: "shoulder-back", name: "Vai & lưng", exercises: [
    { id: "keo_co_thoi", name: "Kéo cơ thoi", hint: `${FRONT} Kéo tay trái vào rồi mở ra để đếm một lần.` },
    { id: "tay_cat_keo", name: "Tay cắt kéo", hint: `${FRONT} Dang hai tay rồi bắt chéo trước người để đếm một lần.` },
    { id: "tu_the_dua_tre", name: "Tư thế đứa trẻ", hint: `${SIDE} Giữ tư thế, màn hình sẽ nhắc bạn chỉnh dáng.`, hold: true },
  ] },
];
const STAGE_LABELS: Record<string, string> = {
  xuong: "Xuống", len: "Lên", co_gieu: "Co gối", duoi_than: "Duỗi thẳng",
  ha: "Hạ tay", giang: "Giang tay", chum: "Chụm tay", nhay: "Dang tay",
  dung: "Đứng", nhun: "Nhún", tan: "Tấn", keo: "Kéo vào", nha: "Mở ra",
  cat: "Tay thẳng", mo: "Bắt chéo",
};
export function stageLabel(stage: Stage): string {
  if (!stage) return "Chưa bắt đầu";
  return STAGE_LABELS[stage] ?? stage;
}
const OK = "Chuẩn phom";
function countAbs(exId: string, stage: Stage, counter: number, j: Joints): CountResult {
  let angle = 0; const feedback = OK;
  if (exId === "co_bung") {
    angle = calculateAngle(j.shoulder, j.hip, j.knee);
    if (angle > 130) stage = "xuong";
    if (angle < 70 && stage === "xuong") { stage = "len"; counter += 1; }
  } else if (exId === "nang_chan") {
    angle = calculateAngle(j.shoulder, j.hip, j.ankle);
    if (angle > 150) stage = "xuong";
    if (angle < 100 && stage === "xuong") { stage = "len"; counter += 1; }
  } else if (exId === "leo_nui") {
    angle = calculateAngle(j.hip, j.knee, j.ankle);
    if (angle < 90 && stage !== "co_gieu") { stage = "co_gieu"; counter += 1; }
    else if (angle > 140) stage = "duoi_than";
  }
  return { angle, feedback, stage, counter };
}
function countArms(exId: string, stage: Stage, counter: number, j: Joints): CountResult {
  let angle = 0; const feedback = OK;
  if (exId === "nang_tay") {
    angle = calculateAngle(j.shoulder, j.elbow, j.wrist);
    if (angle > 160) stage = "xuong";
    if (angle < 40 && stage === "xuong") { stage = "len"; counter += 1; }
  } else if (exId === "giang_tay") {
    angle = calculateAngle(j.hip, j.shoulder, j.elbow);
    if (angle < 30) stage = "ha";
    if (angle > 80 && stage === "ha") { stage = "giang"; counter += 1; }
  } else if (exId === "hit_dat") {
    angle = calculateAngle(j.shoulder, j.elbow, j.wrist);
    if (angle > 160) stage = "len";
    if (angle < 90 && stage === "len") { stage = "xuong"; counter += 1; }
  }
  return { angle, feedback, stage, counter };
}
function countLegs(exId: string, stage: Stage, counter: number, j: Joints): CountResult {
  let angle = 0; const feedback = OK;
  if (exId === "nhay_sang_ben") {
    const handDist = Math.abs(j.wrist[0] - j.rWrist[0]);
    if (handDist < 0.2) stage = "chum";
    if (handDist > 0.6 && stage === "chum") { stage = "nhay"; counter += 1; }
  } else if (exId === "ganh_dui") {
    angle = calculateAngle(j.hip, j.knee, j.ankle);
    if (angle > 160) stage = "dung";
    if (angle < 90 && stage === "dung") { stage = "nhun"; counter += 1; }
  } else if (exId === "tan_sau") {
    angle = calculateAngle(j.hip, j.knee, j.ankle);
    if (angle > 160) stage = "dung";
    if (angle < 90 && stage === "dung") { stage = "tan"; counter += 1; }
  }
  return { angle, feedback, stage, counter };
}
function countShoulderBack(exId: string, stage: Stage, counter: number, j: Joints): CountResult {
  let angle = 0; let feedback = OK;
  if (exId === "keo_co_thoi") {
    angle = calculateAngle(j.wrist, j.shoulder, j.rShoulder);
    if (angle < 100) stage = "keo";
    if (angle > 140 && stage === "keo") { stage = "nha"; counter += 1; }
  } else if (exId === "tay_cat_keo") {
    const wristXDiff = j.wrist[0] - j.rWrist[0];
    if (wristXDiff > 0) stage = "cat";
    if (wristXDiff < -0.1 && stage === "cat") { stage = "mo"; counter += 1; }
  } else if (exId === "tu_the_dua_tre") {
    angle = calculateAngle(j.shoulder, j.hip, j.knee);
    feedback = angle < 50 ? "Giữ nguyên tư thế" : "Hạ thấp người hơn";
  }
  return { angle, feedback, stage, counter };
}
export function countRep(categoryId: CategoryId, exerciseId: string, stage: Stage,
  counter: number, joints: Joints): CountResult {
  switch (categoryId) {
    case "abs": return countAbs(exerciseId, stage, counter, joints);
    case "arms": return countArms(exerciseId, stage, counter, joints);
    case "legs": return countLegs(exerciseId, stage, counter, joints);
    case "shoulder-back": return countShoulderBack(exerciseId, stage, counter, joints);
    default: return { angle: 0, feedback: "Lỗi danh mục", stage, counter };
  }
}
