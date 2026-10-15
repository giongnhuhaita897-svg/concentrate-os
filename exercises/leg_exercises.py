import numpy as np

def count_legs(ex_id, stage, counter, calculate_angle, joints):
    hip, knee, ankle, wrist, r_wrist = joints['hip'], joints['knee'], joints['ankle'], joints['wrist'], joints['r_wrist']
    angle, feedback = 0, "Chuẩn phom"

    if ex_id == "nhay_sang_ben":
        hand_dist = np.abs(wrist[0] - r_wrist[0])
        if hand_dist < 0.2: stage = "chum"
        if hand_dist > 0.6 and stage == 'chum':
            stage, counter = "nhay", counter + 1

    elif ex_id == "ganh_dui":
        angle = calculate_angle(hip, knee, ankle)
        if angle > 160: stage = "dung"
        if angle < 90 and stage == 'dung':
            stage, counter = "nhun", counter + 1

    elif ex_id == "tan_sau":
        angle = calculate_angle(hip, knee, ankle)
        if angle > 160: stage = "dung"
        if angle < 90 and stage == 'dung':
            stage, counter = "tan", counter + 1

    return angle, feedback, stage, counter