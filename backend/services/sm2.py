from dataclasses import dataclass


@dataclass
class SM2Result:
    ease_factor: float
    interval: int
    consecutive_correct: int
    status: str


def sm2(quality: int, ease_factor: float, interval: int, consecutive_correct: int) -> SM2Result:
    """
    SM-2 algorithm implementation.

    Quality ratings: Again=0, Hard=3, Good=4, Easy=5

    Returns updated review parameters.
    """
    # Clamp ease factor floor
    MIN_EF = 1.3

    if quality < 3:
        # Again: reset
        return SM2Result(
            ease_factor=max(MIN_EF, ease_factor - 0.2),
            interval=1,
            consecutive_correct=0,
            status="learning",
        )

    # quality >= 3: Hard, Good, Easy
    new_ef = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(MIN_EF, new_ef)

    if interval == 0:
        new_interval = 1
    elif interval == 1:
        new_interval = 6
    else:
        new_interval = round(interval * new_ef)

    if quality == 3:
        # Hard: progresses interval but resets consecutive_correct
        new_consecutive = 0
        status = "learning"
    else:
        # Good or Easy
        new_consecutive = consecutive_correct + 1
        status = "known" if new_consecutive >= 3 else "learning"

    return SM2Result(
        ease_factor=new_ef,
        interval=new_interval,
        consecutive_correct=new_consecutive,
        status=status,
    )
