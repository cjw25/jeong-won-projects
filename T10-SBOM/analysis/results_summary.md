# T10 SBOM 실험 결과

## 프로젝트별 결과

| 프로젝트 | 직접 의존성 | SBOM 구성요소 | 직접 취약 구성요소 | SBOM 취약 구성요소 | 추가 발견 |
|---|---:|---:|---:|---:|---:|
| P01_web | 2 | 12 | 2 | 7 | 5 |
| P02_logging | 2 | 5 | 2 | 4 | 2 |
| P03_http | 2 | 9 | 0 | 2 | 2 |
| P04_database | 2 | 3 | 2 | 2 | 0 |
| P05_dataformat | 2 | 2 | 1 | 1 | 0 |
| P06_security | 2 | 11 | 2 | 9 | 7 |
| P07_network | 2 | 7 | 2 | 4 | 2 |
| P08_messaging | 2 | 6 | 2 | 4 | 2 |
| P09_template | 2 | 7 | 1 | 1 | 0 |
| P10_utils | 3 | 10 | 3 | 4 | 1 |

## 전체 결과

- project_count: 10
- total_direct_vulnerable_components: 17
- total_sbom_vulnerable_components: 38
- total_additional_vulnerable_components: 21
- projects_with_additional_findings: 7
- mean_additional_vulnerable_components: 2.1
- median_additional_vulnerable_components: 2.0

## 해석 주의

이 문서는 데이터를 자동 집계한 결과이다.
가설을 지지하는지 여부와 원인에 대한 최종 판단은 원자료를 확인한 뒤 작성한다.