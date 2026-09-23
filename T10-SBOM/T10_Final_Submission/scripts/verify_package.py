from pathlib import Path

import csv
import json
import sys


ROOT = Path(__file__).resolve().parents[1]

MANIFEST = (
        ROOT / "fixtures_manifest.csv"
)

MEASUREMENTS = (
        ROOT /
        "raw" /
        "measurements.csv"
)

SBOM_DIR = (
        ROOT /
        "raw" /
        "sbom"
)

OSV_DIR = (
        ROOT /
        "raw" /
        "osv"
)


def main():

    errors = []

    with MANIFEST.open(
            "r",
            encoding="utf-8-sig",
            newline=""
    ) as f:

        reader = csv.DictReader(f)

        project_ids = sorted(
            {
                row["project_id"]
                for row in reader
            }
        )

    if len(project_ids) != 10:

        errors.append(
            "프로젝트 수가 10개가 아닙니다: "
            f"{len(project_ids)}"
        )

    for project_id in project_ids:

        sbom_file = (
                SBOM_DIR /
                f"{project_id}.json"
        )

        if not sbom_file.exists():

            errors.append(
                f"SBOM 누락: "
                f"{sbom_file.name}"
            )

        for condition in [
            "direct",
            "sbom_all"
        ]:

            osv_file = (
                    OSV_DIR /
                    f"{project_id}_"
                    f"{condition}.json"
            )

            if not osv_file.exists():

                errors.append(
                    "OSV 원자료 누락: "
                    f"{osv_file.name}"
                )

                continue

            try:

                with osv_file.open(
                        "r",
                        encoding="utf-8"
                ) as f:

                    json.load(f)

            except Exception as error:

                errors.append(
                    "JSON 오류: "
                    f"{osv_file.name} / "
                    f"{error}"
                )

    measurement_rows = []

    if not MEASUREMENTS.exists():

        errors.append(
            "measurements.csv가 없습니다."
        )

    else:

        with MEASUREMENTS.open(
                "r",
                encoding="utf-8-sig",
                newline=""
        ) as f:

            measurement_rows = list(
                csv.DictReader(f)
            )

        if len(
                measurement_rows
        ) != 10:

            errors.append(
                "measurements.csv 데이터가 "
                "10행이 아닙니다: "
                f"{len(measurement_rows)}"
            )

    if errors:

        print()
        print(
            "===== 검증 실패 ====="
        )

        for error in errors:

            print(
                "-",
                error
            )

        sys.exit(1)

    print()
    print(
        "===== 검증 통과 ====="
    )

    print(
        "- 프로젝트: 10개"
    )

    print(
        "- SBOM 원자료: 10개"
    )

    print(
        "- OSV 직접 의존성 원자료: 10개"
    )

    print(
        "- OSV SBOM 전체 원자료: 10개"
    )

    print(
        "- measurements.csv: 10행"
    )

    print(
        "- 총 OSV 원자료: 20개"
    )


if __name__ == "__main__":
    main()