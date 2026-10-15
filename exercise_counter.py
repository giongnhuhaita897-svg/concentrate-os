import cv2
import numpy as np
import mediapipe as mp

from exercises.abs_exercises import count_abs
from exercises.arm_exercises import count_arms
from exercises.leg_exercises import count_legs
from exercises.shoulder_back_exercises import count_shoulder_back

EXERCISES_BY_CATEGORY = {
    "1. BỤNG": [("co_bung", "Cơ bụng"), ("nang_chan", "Nâng chân"), ("leo_nui", "Leo núi")],
    "2. CÁNH TAY": [("nang_tay", "Nâng tay"), ("giang_tay", "Giang tay"), ("hit_dat", "Hít đất")],
    "3. CHÂN": [("nhay_sang_ben", "Nhảy sang bên"), ("ganh_dui", "Gánh đùi"), ("tan_sau", "Tấn sau")],
    "4. VAI & LƯNG": [("keo_co_thoi", "Kéo cơ thoi"), ("tay_cat_keo", "Tay cắt kéo"), ("tu_the_dua_tre", "Tư thế đứa trẻ")]
}

def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    return 360.0 - angle if angle > 180.0 else angle

class ExerciseCounter:
    def __init__(self):
        self.counter = 0
        self.stage = None

    def process_exercise(self, landmarks, mp_pose, category_name, exercise_id):
        def get_coords(joint):
            lm = landmarks[joint.value]
            return [lm.x, lm.y]

        joints = {
            'shoulder': get_coords(mp_pose.PoseLandmark.LEFT_SHOULDER),
            'elbow': get_coords(mp_pose.PoseLandmark.LEFT_ELBOW),
            'wrist': get_coords(mp_pose.PoseLandmark.LEFT_WRIST),
            'hip': get_coords(mp_pose.PoseLandmark.LEFT_HIP),
            'knee': get_coords(mp_pose.PoseLandmark.LEFT_KNEE),
            'ankle': get_coords(mp_pose.PoseLandmark.LEFT_ANKLE),
            'r_shoulder': get_coords(mp_pose.PoseLandmark.RIGHT_SHOULDER),
            'r_wrist': get_coords(mp_pose.PoseLandmark.RIGHT_WRIST)
        }

        if "BỤNG" in category_name:
            return count_abs(exercise_id, self.stage, self.counter, calculate_angle, joints)
        elif "CÁNH TAY" in category_name:
            return count_arms(exercise_id, self.stage, self.counter, calculate_angle, joints)
        elif "CHÂN" in category_name:
            return count_legs(exercise_id, self.stage, self.counter, calculate_angle, joints)
        elif "VAI" in category_name:
            return count_shoulder_back(exercise_id, self.stage, self.counter, calculate_angle, joints)

        return 0, "Lỗi danh mục", self.stage, self.counter

def main():
    cap = cv2.VideoCapture(0)
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    counter = ExerciseCounter()

    categories = list(EXERCISES_BY_CATEGORY.keys())
    cat_idx, ex_idx = 0, 0

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break

            current_cat = categories[cat_idx]
            current_ex_list = EXERCISES_BY_CATEGORY[current_cat]
            ex_idx = ex_idx % len(current_ex_list)
            ex_id, ex_name = current_ex_list[ex_idx]

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            angle_val, feedback = 0, "Hướng camera vào toàn thân"
            if results.pose_landmarks:
                try:
                    landmarks = results.pose_landmarks.landmark
                    angle_val, feedback, counter.stage, counter.counter = counter.process_exercise(
                        landmarks, mp_pose, current_cat, ex_id
                    )
                except Exception:
                    feedback = "Không thấy đủ các khớp cần thiết"

                mp_drawing.draw_landmarks(
                    image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2)
                )

            # UI Overlay
            cv2.rectangle(image, (0, 0), (500, 160), (30, 30, 30), -1)
            cv2.putText(image, f"DANH MUC: {current_cat}", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(image, f"BAI TAP: {ex_name}", (15, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(image, f"SO LAN: {counter.counter}", (15, 115), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (0, 255, 0), 3)
            cv2.putText(image, f"Trang thai: {counter.stage} | Goc: {int(angle_val)} deg", (15, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

            cv2.putText(image, "[1,2,3,4]: Chon danh muc | [N]: Doi bai | [M]: Doi danh muc | [R]: Reset | [Q]: Thoat", 
                        (10, image.shape[0] - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

            cv2.imshow("AI Exercise Trainer Modular", image)

            key = cv2.waitKey(10) & 0xFF
            if key == ord('q'): break
            elif key == ord('r'): counter.counter = 0; counter.stage = None
            elif key == ord('m'): cat_idx = (cat_idx + 1) % len(categories); ex_idx = 0; counter.counter = 0
            elif key == ord('n'): ex_idx = (ex_idx + 1) % len(current_ex_list); counter.counter = 0
            elif key in [ord('1'), ord('2'), ord('3'), ord('4')]:
                cat_idx = int(chr(key)) - 1
                ex_idx = 0
                counter.counter = 0

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()