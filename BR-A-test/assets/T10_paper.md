# T10 - SBOM 공급망 보안 연구 재현 패키지

## 연구 제목

SBOM을 통한 전이 의존성 가시성 확대가 취약 구성요소 식별 범위에 미치는 영향

작성자: 최정원  
실험일: 2026-09-22

## 연구 가설

동일한 소프트웨어 프로젝트에서 직접 의존성만 확인하는 방식보다
SBOM을 이용해 전이 의존성까지 확인하는 방식이
식별 가능한 취약 구성요소의 수를 증가시킬 것이다.

## 실험 결과

Java/Gradle 기반 의존성 구성 10개를 대상으로 실험하였다.

- 직접 의존성 수 합계: 21
- SBOM 구성요소 수 합계: 72
- 직접 분석 취약 구성요소 식별 건수 합계: 17
- SBOM 분석 취약 구성요소 식별 건수 합계: 38
- 추가 식별 건수 합계: 21
- 추가 발견이 있었던 프로젝트: 7/10

본 실험 범위에서는 SBOM을 통해 전이 의존성까지 분석했을 때
직접 의존성만 분석한 경우보다 더 많은 취약 구성요소가 식별되었다.

단, 본 결과는 SBOM이 취약점을 제거하거나 소프트웨어 자체의
보안성을 보장한다는 의미가 아니다.

## 파일 구조

paper/
- T10_최정원_논문.md

raw/
- measurements.csv
- run_metadata.json
- sbom/
- osv/

analysis/
- results_summary.csv
- results_summary.md

scripts/
- create_projects.py
- collect_osv.py
- analyze_results.py
- verify_package.py

루트 파일:
- fixtures_manifest.csv
- 01_experiment_design.md
- design_changes.md
- run_all.ps1
- README.md

## 실행 환경

- Windows PowerShell
- Java 17 이상
- Python 3
- 인터넷 연결

실제 실험 환경:

- Eclipse Temurin OpenJDK 17.0.20.1
- Python 3.14.7
- Gradle 8.14.3
- CycloneDX Gradle Plugin 3.4.1

## 전체 실험 재현

PowerShell에서 프로젝트 루트로 이동한다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\run_all.ps1