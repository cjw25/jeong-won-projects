from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def load_json(name: str):
    path = DATA / name
    return json.loads(
        path.read_text(
            encoding="utf-8-sig"
        )
    )


def dump_stable(obj, path: Path):
    text = json.dumps(
        obj,
        ensure_ascii=False,
        indent=2,
        sort_keys=True
    ) + "\n"

    path.write_text(
        text,
        encoding="utf-8",
        newline="\n"
    )

    return hashlib.sha256(
        path.read_bytes()
    ).hexdigest()

def make_metrics(
        attendance,
        ritual,
        submissions
):

    return [
        {
            "value": f"{attendance['attendance_rate']:.1f}%",
            "label": "교육과정 출석률",
            "detail": (
                f"훈련일 {attendance['training_days']}일 · "
                f"출석 {attendance['present_days']}일 · "
                f"결석 {attendance['absent_days']}일"
            ),
            "source": "내 출석 기록"
        },
        {
            "value": f"{ritual['record_days']}일",
            "label": "리추얼 기록",
            "detail": (
                f"아침 {ritual['morning_records']}회 · "
                f"마무리 {ritual['closing_records']}회"
            ),
            "source": "내 리추얼 기록"
        },
        {
            "value": f"{submissions['master_approved']}개",
            "label": "마스터 승인 완료",
            "detail": (
                f"핵심 과제 "
                f"{submissions['core_total']}개 승인 완료"
            ),
            "source": "내 제출 현황"
        }
    ]


def make_candidates(ritual):

    ability_order = [
        "자기조절력",
        "대인관계력",
        "자기동기력"
    ]

    candidates = []

    evidence = ritual.get(
        "evidence",
        []
    )

    for ability in ability_order:

        items = [
            item
            for item in evidence
            if item.get("ability") == ability
        ]

        items = sorted(
            items,
            key=lambda item: (
                item.get("date", ""),
                item.get("text", "")
            )
        )

        for item in items:

            candidates.append(
                {
                    "ability": ability,
                    "date": item["date"],
                    "evidence": item["text"],
                    "approved": False
                }
            )

    return candidates


def main():

    attendance = load_json(
        "attendance.json"
    )

    ritual = load_json(
        "ritual.json"
    )

    submissions = load_json(
        "submissions.json"
    )

    output = {
        "metrics": make_metrics(
            attendance,
            ritual,
            submissions
        ),
        "candidates": make_candidates(
            ritual
        ),
        "generated_from": [
            "attendance.json",
            "ritual.json",
            "submissions.json"
        ]
    }

    sha256 = dump_stable(
        output,
        DATA / "generated.json"
    )

    print(
        f"generated.json sha256={sha256}"
    )


if __name__ == "__main__":
    main()