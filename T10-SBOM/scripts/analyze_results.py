from pathlib import Path

import csv
from statistics import mean
from statistics import median


ROOT = Path(__file__).resolve().parents[1]

INPUT_FILE = (
        ROOT / "raw" / "measurements.csv"
)

SUMMARY_CSV = (
        ROOT /
        "analysis" /
        "results_summary.csv"
)

SUMMARY_MD = (
        ROOT /
        "analysis" /
        "results_summary.md"
)


NUMERIC_COLUMNS = [
    "direct_dependency_count",
    "sbom_component_count",
    "direct_vulnerable_component_count",
    "sbom_vulnerable_component_count",
    "additional_vulnerable_components",
    "direct_vulnerability_id_count",
    "sbom_vulnerability_id_count",
]


def load_rows():

    with INPUT_FILE.open(
            "r",
            encoding="utf-8-sig",
            newline=""
    ) as f:

        rows = list(
            csv.DictReader(f)
        )

    for row in rows:

        for column in NUMERIC_COLUMNS:

            row[column] = int(
                row[column]
            )

    return rows


def main():

    rows = load_rows()

    if not rows:

        raise RuntimeError(
            "측정 결과가 없습니다."
        )

    total_direct_components = sum(
        row[
            "direct_vulnerable_component_count"
        ]
        for row in rows
    )

    total_sbom_components = sum(
        row[
            "sbom_vulnerable_component_count"
        ]
        for row in rows
    )

    total_additional = sum(
        row[
            "additional_vulnerable_components"
        ]
        for row in rows
    )

    projects_with_additional = sum(
        1
        for row in rows
        if row[
            "additional_vulnerable_components"
        ] > 0
    )

    additional_values = [
        row[
            "additional_vulnerable_components"
        ]
        for row in rows
    ]

    summary = [
        (
            "project_count",
            len(rows)
        ),
        (
            "total_direct_vulnerable_components",
            total_direct_components
        ),
        (
            "total_sbom_vulnerable_components",
            total_sbom_components
        ),
        (
            "total_additional_vulnerable_components",
            total_additional
        ),
        (
            "projects_with_additional_findings",
            projects_with_additional
        ),
        (
            "mean_additional_vulnerable_components",
            round(
                mean(
                    additional_values
                ),
                3
            )
        ),
        (
            "median_additional_vulnerable_components",
            median(
                additional_values
            )
        ),
    ]

    SUMMARY_CSV.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with SUMMARY_CSV.open(
            "w",
            encoding="utf-8-sig",
            newline=""
    ) as f:

        writer = csv.writer(f)

        writer.writerow(
            [
                "metric",
                "value"
            ]
        )

        writer.writerows(
            summary
        )

    lines = []

    lines.append(
        "# T10 SBOM 실험 결과"
    )

    lines.append("")

    lines.append(
        "## 프로젝트별 결과"
    )

    lines.append("")

    lines.append(
        "| 프로젝트 | 직접 의존성 | "
        "SBOM 구성요소 | 직접 취약 구성요소 | "
        "SBOM 취약 구성요소 | 추가 발견 |"
    )

    lines.append(
        "|---|---:|---:|---:|---:|---:|"
    )

    for row in rows:

        lines.append(
            f"| {row['project_id']} "
            f"| {row['direct_dependency_count']} "
            f"| {row['sbom_component_count']} "
            f"| {row['direct_vulnerable_component_count']} "
            f"| {row['sbom_vulnerable_component_count']} "
            f"| {row['additional_vulnerable_components']} |"
        )

    lines.append("")
    lines.append(
        "## 전체 결과"
    )
    lines.append("")

    for key, value in summary:

        lines.append(
            f"- {key}: {value}"
        )

    lines.append("")
    lines.append(
        "## 해석 주의"
    )
    lines.append("")

    lines.append(
        "이 문서는 데이터를 자동 집계한 결과이다."
    )

    lines.append(
        "가설을 지지하는지 여부와 원인에 대한 "
        "최종 판단은 원자료를 확인한 뒤 작성한다."
    )

    SUMMARY_MD.write_text(
        "\n".join(lines),
        encoding="utf-8"
    )

    print(
        "결과 분석 완료"
    )

    print(
        SUMMARY_CSV
    )

    print(
        SUMMARY_MD
    )


if __name__ == "__main__":
    main()