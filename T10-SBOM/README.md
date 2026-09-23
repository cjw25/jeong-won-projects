# T10 SBOM 공급망 보안 연구 재현 패키지



## 연구 제목



SBOM을 통한 전이 의존성 가시성 확대가 취약 구성요소 식별 범위에 미치는 영향



작성자: 최정원

실험일: 2026-09-22



## 연구 가설



동일한 소프트웨어 프로젝트에서 직접 의존성만 확인하는 방식보다

SBOM을 이용해 전이 의존성까지 확인하는 방식이

식별 가능한 취약 구성요소의 수를 증가시킬 것이다.



## 실험 개요



Java/Gradle 기반 의존성 구성 10개를 대상으로 다음 두 조건을 비교했다.



1. 직접 의존성만 분석

2. CycloneDX SBOM에 포함된 직접·전이 의존성 전체 분석



취약점 정보는 OSV 데이터베이스를 사용하였다.



## 실험 결과



- 프로젝트 수: 10개

- 직접 의존성 수 합계: 21개

- SBOM 구성요소 수 합계: 72개

- 직접 분석 취약 구성요소 식별 건수 합계: 17건

- SBOM 분석 취약 구성요소 식별 건수 합계: 38건

- 추가 식별 건수 합계: 21건

- 추가 발견이 발생한 프로젝트: 7개

- 프로젝트당 평균 추가 발견: 2.1건



본 실험 범위에서는 SBOM을 이용해 전이 의존성까지 분석했을 때

직접 의존성만 분석한 경우보다 더 많은 취약 구성요소가 식별되었다.



단, 이는 SBOM 자체가 취약점을 제거하거나

소프트웨어의 전체 보안성을 보장한다는 의미는 아니다.



## 파일 구조



paper/

- T10\_paper.md



raw/

- measurements.csv

- run\_metadata.json

- sbom/

- osv/



analysis/

- results\_summary.csv

- results\_summary.md



scripts/

- create\_projects.py

- collect\_osv.py

- analyze\_results.py

- verify\_package.py



루트 파일:

- fixtures\_manifest.csv

- 01\_experiment\_design.md

- design\_changes.md

- run\_all.ps1

- README.md



## 실행 환경



- Windows PowerShell

- Eclipse Temurin OpenJDK 17.0.20.1

- Python 3.14.7

- Gradle 8.14.3

- CycloneDX Gradle Plugin 3.4.1

- OSV 취약점 데이터베이스



## 전체 실험 재현



PowerShell에서 프로젝트 루트로 이동한 뒤 실행한다.



```powershell

Set-ExecutionPolicy -Scope Process Bypass

.\\run\_all.ps1

