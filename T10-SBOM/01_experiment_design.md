# T10 실험 설계

## 연구 제목

SBOM을 통한 전이 의존성 가시성 확대가 취약 구성요소 식별 범위에 미치는 영향

## 관심 분야

정보보안 및 인프라 운영, 특히 소프트웨어 공급망에서 사용되는
오픈소스 의존성과 취약점 관리에 관심이 있다.

## 최종 가설

동일한 소프트웨어 프로젝트에서 직접 의존성만 확인하는 방식보다
SBOM을 이용해 전이 의존성까지 확인하는 방식이
식별 가능한 취약 구성요소의 수를 증가시킬 것이다.

## 독립변수

의존성 분석 범위

1. 직접 의존성만 분석
2. SBOM을 이용해 직접 의존성과 전이 의존성을 모두 분석

## 종속변수

식별된 취약 구성요소 수

## 표본

Java/Gradle 기반 실험 프로젝트 10개를 사용한다.

P01 ~ P10의 직접 의존성은 fixtures_manifest.csv에
실험 전에 고정한다.

## 고정 조건

- 동일한 10개 프로젝트
- 동일한 직접 의존성 버전
- CycloneDX Gradle Plugin 3.4.1
- 동일 PC
- 동일 Java 환경
- 동일 Gradle 환경
- 동일 OSV 취약점 데이터베이스/API
- 동일한 날 또는 동일한 실행 세션에서 두 조건을 비교한다

## 측정값

- direct_dependency_count
- sbom_component_count
- direct_vulnerable_component_count
- sbom_vulnerable_component_count
- additional_vulnerable_components
- direct_vulnerability_id_count
- sbom_vulnerability_id_count

## 핵심 측정값

additional_vulnerable_components

계산식:

SBOM에서 확인된 취약 구성요소
-
직접 의존성에서 확인된 취약 구성요소

## 표본 수

10개 프로젝트를 사용한다.

각 프로젝트에서

- 직접 의존성 조건
- SBOM 전체 의존성 조건

두 가지를 비교한다.

총 10쌍의 비교 데이터를 생성한다.

## 가설이 틀린 경우

SBOM을 사용했음에도 추가로 식별되는 취약 구성요소 수가
대부분 0이거나 직접 의존성 분석보다 취약 구성요소 수가
증가하지 않는다면 가설을 지지하지 않는 것으로 판단한다.

## 연구 범위 제한

본 실험은 통제된 10개의 Java/Gradle 의존성 구성을 사용한다.

따라서 모든 Java 프로젝트의 취약점 발생률을 대표하는 연구가 아니다.

본 연구에서 확인하려는 것은 동일한 프로젝트에서
직접 의존성만 확인하는 경우와 SBOM을 이용해 전이 의존성까지
확인하는 경우 사이의 취약 구성요소 식별 범위 차이다.