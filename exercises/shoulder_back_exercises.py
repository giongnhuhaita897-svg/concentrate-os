def count_shoulder_back(ex_id, stage, counter, calculate_angle, joints):
    wrist, shoulder, r_shoulder = joints['wrist'], joints['shoulder'], joints['r_shoulder']
    hip, knee = joints['hip'], joints['knee']
    angle, feedback = 0, "Chuẩn phom"

    if ex_id == "keo_co_thoi":
        angle = calculate_angle(wrist, shoulder, r_shoulder)
        if angle < 100: stage = "keo"
        if angle > 140 and stage == 'keo':
            stage, counter = "nha", counter + 1

    elif ex_id == "tay_cat_keo":
        wrist_x_diff = wrist[0] - joints['r_wrist'][0]
        if wrist_x_diff > 0: stage = "cat"
        if wrist_x_diff < -0.1 and stage == 'cat':
            stage, counter = "mo", counter + 1

    elif ex_id == "tu_the_dua_tre":
        angle = calculate_angle(shoulder, hip, knee)
        feedback = "Giu nguyen tu the" if angle < 50 else "Ha thap nguoi hon"

    return angle, feedback, stage, counter