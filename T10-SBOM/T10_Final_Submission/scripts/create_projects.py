from pathlib import Path
import csv
import shutil

ROOT = Path(__file__).resolve().parents[1]

MANIFEST = ROOT / "fixtures_manifest.csv"
PROJECTS_DIR = ROOT / "projects"

CYCLONEDX_VERSION = "3.4.1"


def read_manifest():
    projects = {}

    with MANIFEST.open(
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as f:

        reader = csv.DictReader(f)

        for row in reader:

            project_id = row["project_id"]

            projects.setdefault(
                project_id,
                []
            ).append(
                {
                    "group": row["group"],
                    "artifact": row["artifact"],
                    "version": row["version"],
                }
            )

    return projects


def create_project(project_id, dependencies):

    project_dir = PROJECTS_DIR / project_id

    if project_dir.exists():
        shutil.rmtree(project_dir)

    project_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    settings_content = f"""
rootProject.name = '{project_id}'
""".strip()

    (
        project_dir / "settings.gradle"
    ).write_text(
        settings_content + "\n",
        encoding="utf-8"
    )

    dependency_lines = []

    for dep in dependencies:

        dependency_lines.append(
            "    implementation "
            f"'{dep['group']}:{dep['artifact']}:{dep['version']}'"
        )

    dependency_text = "\n".join(
        dependency_lines
    )

    build_content = f"""
plugins {{
    id 'java'
    id 'org.cyclonedx.bom' version '{CYCLONEDX_VERSION}'
}}

repositories {{
    mavenCentral()
}}

dependencies {{
{dependency_text}
}}
""".strip()

    (
        project_dir / "build.gradle"
    ).write_text(
        build_content + "\n",
        encoding="utf-8"
    )


def main():

    projects = read_manifest()

    PROJECTS_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print(
        f"프로젝트 {len(projects)}개 생성 시작"
    )

    for project_id, dependencies in projects.items():

        create_project(
            project_id,
            dependencies
        )

        print(
            f"[생성 완료] {project_id}"
        )

    print()
    print(
        f"전체 {len(projects)}개 프로젝트 생성 완료"
    )
    print(
        f"경로: {PROJECTS_DIR}"
    )


if __name__ == "__main__":
    main()