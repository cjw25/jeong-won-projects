from pathlib import Path
from datetime import datetime, timezone

import csv
import json
import time
import urllib.request


ROOT = Path(__file__).resolve().parents[1]

MANIFEST = ROOT / "fixtures_manifest.csv"

SBOM_DIR = ROOT / "raw" / "sbom"
OSV_DIR = ROOT / "raw" / "osv"

MEASUREMENTS_FILE = (
        ROOT / "raw" / "measurements.csv"
)

RUN_METADATA_FILE = (
        ROOT / "raw" / "run_metadata.json"
)

OSV_URL = (
    "https://api.osv.dev/v1/querybatch"
)


def load_project_ids():

    project_ids = set()

    with MANIFEST.open(
            "r",
            encoding="utf-8-sig",
            newline=""
    ) as f:

        reader = csv.DictReader(f)

        for row in reader:
            project_ids.add(
                row["project_id"]
            )

    return sorted(project_ids)


def load_sbom(project_id):

    path = (
            SBOM_DIR /
            f"{project_id}.json"
    )

    if not path.exists():
        raise FileNotFoundError(
            f"SBOM 파일 없음: {path}"
        )

    with path.open(
            "r",
            encoding="utf-8"
    ) as f:

        return json.load(f)


def component_key(component):

    group = (
            component.get("group")
            or ""
    ).strip()

    name = (
            component.get("name")
            or ""
    ).strip()

    version = (
            component.get("version")
            or ""
    ).strip()

    return (
        f"{group}:{name}:{version}"
    )


def get_all_components(sbom):

    components = {}

    for component in sbom.get(
            "components",
            []
    ):

        group = (
                component.get("group")
                or ""
        ).strip()

        name = (
                component.get("name")
                or ""
        ).strip()

        version = (
                component.get("version")
                or ""
        ).strip()

        bom_ref = component.get(
            "bom-ref"
        )

        component_type = (
                component.get("type")
                or ""
        )

        if (
                component_type != "library"
        ):
            continue

        if not group:
            continue

        if not name:
            continue

        if not version:
            continue

        if not bom_ref:
            continue

        components[bom_ref] = {
            "group": group,
            "artifact": name,
            "version": version,
            "bom_ref": bom_ref,
        }

    return components


def get_direct_components(
        sbom,
        components
):

    metadata = sbom.get(
        "metadata",
        {}
    )

    root_component = metadata.get(
        "component",
        {}
    )

    root_ref = root_component.get(
        "bom-ref"
    )

    if not root_ref:
        raise ValueError(
            "SBOM metadata.component.bom-ref를 "
            "찾을 수 없습니다."
        )

    dependencies = sbom.get(
        "dependencies",
        []
    )

    root_dependencies = []

    for dependency in dependencies:

        if (
                dependency.get("ref")
                == root_ref
        ):

            root_dependencies = (
                dependency.get(
                    "dependsOn",
                    []
                )
            )

            break

    direct = []

    for ref in root_dependencies:

        component = components.get(
            ref
        )

        if component:
            direct.append(
                component
            )

    return direct


def normalize_packages(
        components
):

    packages = []

    seen = set()

    for component in components:

        key = (
            component["group"],
            component["artifact"],
            component["version"],
        )

        if key in seen:
            continue

        seen.add(key)

        packages.append(
            {
                "group":
                    component["group"],

                "artifact":
                    component["artifact"],

                "version":
                    component["version"],
            }
        )

    return packages


def query_osv(packages):

    queries = []

    for package in packages:

        package_name = (
            f"{package['group']}:"
            f"{package['artifact']}"
        )

        queries.append(
            {
                "version":
                    package["version"],

                "package": {
                    "ecosystem":
                        "Maven",

                    "name":
                        package_name,
                },
            }
        )

    request_body = {
        "queries": queries
    }

    encoded_body = json.dumps(
        request_body
    ).encode(
        "utf-8"
    )

    request = urllib.request.Request(
        OSV_URL,
        data=encoded_body,
        headers={
            "Content-Type":
                "application/json",

            "User-Agent":
                "T10-SBOM-Study/1.0",
        },
        method="POST",
    )

    with urllib.request.urlopen(
            request,
            timeout=120
    ) as response:

        raw = response.read()

    return json.loads(
        raw.decode("utf-8")
    )


def analyse_osv(
        packages,
        osv_response
):

    results = osv_response.get(
        "results",
        []
    )

    vulnerable_components = set()
    vulnerability_ids = set()

    component_results = []

    for package, result in zip(
            packages,
            results
    ):

        component = (
            f"{package['group']}:"
            f"{package['artifact']}:"
            f"{package['version']}"
        )

        ids = set()

        for vulnerability in result.get(
                "vulns",
                []
        ):

            vuln_id = vulnerability.get(
                "id"
            )

            if vuln_id:
                ids.add(
                    vuln_id
                )

        ids = sorted(ids)

        if ids:

            vulnerable_components.add(
                component
            )

            vulnerability_ids.update(
                ids
            )

        component_results.append(
            {
                "component":
                    component,

                "vulnerability_ids":
                    ids,
            }
        )

    return {
        "vulnerable_components":
            sorted(
                vulnerable_components
            ),

        "vulnerability_ids":
            sorted(
                vulnerability_ids
            ),

        "component_results":
            component_results,
    }


def save_raw_result(
        project_id,
        condition,
        packages,
        osv_response,
        analysis
):

    output = {
        "project_id":
            project_id,

        "condition":
            condition,

        "queried_at_utc":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "source":
            OSV_URL,

        "packages":
            packages,

        "api_response":
            osv_response,

        "analysis":
            analysis,
    }

    output_path = (
            OSV_DIR /
            f"{project_id}_{condition}.json"
    )

    with output_path.open(
            "w",
            encoding="utf-8"
    ) as f:

        json.dump(
            output,
            f,
            ensure_ascii=False,
            indent=2,
        )


def main():

    SBOM_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    OSV_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    project_ids = load_project_ids()

    measurements = []

    metadata = {
        "started_at_utc":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "osv_endpoint":
            OSV_URL,

        "project_count":
            len(project_ids),

        "conditions": [
            "direct",
            "sbom_all",
        ],
    }

    for index, project_id in enumerate(
            project_ids,
            start=1
    ):

        print()
        print(
            "=" * 60
        )

        print(
            f"[{index}/{len(project_ids)}] "
            f"{project_id}"
        )

        sbom = load_sbom(
            project_id
        )

        component_map = (
            get_all_components(
                sbom
            )
        )

        all_packages = (
            normalize_packages(
                component_map.values()
            )
        )

        direct_components = (
            get_direct_components(
                sbom,
                component_map
            )
        )

        direct_packages = (
            normalize_packages(
                direct_components
            )
        )

        print(
            "직접 의존성:",
            len(direct_packages)
        )

        print(
            "SBOM 전체 구성요소:",
            len(all_packages)
        )

        print(
            "직접 의존성 OSV 조회..."
        )

        direct_response = query_osv(
            direct_packages
        )

        direct_analysis = (
            analyse_osv(
                direct_packages,
                direct_response
            )
        )

        save_raw_result(
            project_id,
            "direct",
            direct_packages,
            direct_response,
            direct_analysis,
        )

        time.sleep(0.5)

        print(
            "SBOM 전체 의존성 OSV 조회..."
        )

        sbom_response = query_osv(
            all_packages
        )

        sbom_analysis = (
            analyse_osv(
                all_packages,
                sbom_response
            )
        )

        save_raw_result(
            project_id,
            "sbom_all",
            all_packages,
            sbom_response,
            sbom_analysis,
        )

        direct_vulnerable = set(
            direct_analysis[
                "vulnerable_components"
            ]
        )

        sbom_vulnerable = set(
            sbom_analysis[
                "vulnerable_components"
            ]
        )

        additional_components = (
                sbom_vulnerable
                -
                direct_vulnerable
        )

        measurement = {
            "project_id":
                project_id,

            "direct_dependency_count":
                len(
                    direct_packages
                ),

            "sbom_component_count":
                len(
                    all_packages
                ),

            "direct_vulnerable_component_count":
                len(
                    direct_vulnerable
                ),

            "sbom_vulnerable_component_count":
                len(
                    sbom_vulnerable
                ),

            "additional_vulnerable_components":
                len(
                    additional_components
                ),

            "direct_vulnerability_id_count":
                len(
                    direct_analysis[
                        "vulnerability_ids"
                    ]
                ),

            "sbom_vulnerability_id_count":
                len(
                    sbom_analysis[
                        "vulnerability_ids"
                    ]
                ),
        }

        measurements.append(
            measurement
        )

        print(
            "직접 취약 구성요소:",
            measurement[
                "direct_vulnerable_component_count"
            ]
        )

        print(
            "SBOM 취약 구성요소:",
            measurement[
                "sbom_vulnerable_component_count"
            ]
        )

        print(
            "추가 발견:",
            measurement[
                "additional_vulnerable_components"
            ]
        )

        time.sleep(0.5)

    with MEASUREMENTS_FILE.open(
            "w",
            encoding="utf-8-sig",
            newline=""
    ) as f:

        fieldnames = [
            "project_id",
            "direct_dependency_count",
            "sbom_component_count",
            "direct_vulnerable_component_count",
            "sbom_vulnerable_component_count",
            "additional_vulnerable_components",
            "direct_vulnerability_id_count",
            "sbom_vulnerability_id_count",
        ]

        writer = csv.DictWriter(
            f,
            fieldnames=fieldnames
        )

        writer.writeheader()

        writer.writerows(
            measurements
        )

    metadata[
        "finished_at_utc"
    ] = datetime.now(
        timezone.utc
    ).isoformat()

    with RUN_METADATA_FILE.open(
            "w",
            encoding="utf-8"
    ) as f:

        json.dump(
            metadata,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print()
    print(
        "=" * 60
    )

    print(
        "실험 데이터 수집 완료"
    )

    print(
        f"측정 결과: "
        f"{MEASUREMENTS_FILE}"
    )

    print(
        f"원자료: "
        f"{OSV_DIR}"
    )


if __name__ == "__main__":
    main()