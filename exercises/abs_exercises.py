def count_abs(ex_id, stage, counter, calculate_angle, joints):
    shoulder, hip, knee, ankle = joints['shoulder'], joints['hip'], joints['knee'], joints['ankle']
    angle, feedback = 0, "Chuẩn phom"

    if ex_id == "co_bung":
        angle = calculate_angle(shoulder, hip, knee)
        if angle > 130: stage = "xuong"
        if angle < 70 and stage == 'xuong':
            stage, counter = "len", counter + 1

    elif ex_id == "nang_chan":
        angle = calculate_angle(shoulder, hip, ankle)
        if angle > 150: stage = "xuong"
        if angle < 100 and stage == 'xuong':
            stage, counter = "len", counter + 1

    elif ex_id == "leo_nui":
        angle = calculate_angle(hip, knee, ankle)
        if angle < 90 and stage != "co_gieu":
            stage, counter = "co_gieu", counter + 1
        elif angle > 140: stage = "duoi_than"

    return angle, feedback, stage, counter