def count_arms(ex_id, stage, counter, calculate_angle, joints):
    shoulder, elbow, wrist, hip = joints['shoulder'], joints['elbow'], joints['wrist'], joints['hip']
    angle, feedback = 0, "Chuẩn phom"

    if ex_id == "nang_tay":
        angle = calculate_angle(shoulder, elbow, wrist)
        if angle > 160: stage = "xuong"
        if angle < 40 and stage == 'xuong':
            stage, counter = "len", counter + 1

    elif ex_id == "giang_tay":
        angle = calculate_angle(hip, shoulder, elbow)
        if angle < 30: stage = "ha"
        if angle > 80 and stage == 'ha':
            stage, counter = "giang", counter + 1

    elif ex_id == "hit_dat":
        angle = calculate_angle(shoulder, elbow, wrist)
        if angle > 160: stage = "len"
        if angle < 90 and stage == 'len':
            stage, counter = "xuong", counter + 1

    return angle, feedback, stage, counter