# T05 AI A → AI B HANDOFF

인수인계 기준 소스 버전:

14c2c82c24e9a8f5c4f8d5f23abd94ebb0fdc2b5

소스 주소:

https://github.com/cjw25/jeong-won-projects/tree/14c2c82c24e9a8f5c4f8d5f23abd94ebb0fdc2b5/meme-card-studio

---

## 1. 목표

과제 3 「짤·카드 스튜디오」에
현재 편집 초안 자동저장 및 복구 기능을 완성한다.

사용자가 다음 값을 변경하면 현재 편집 상태를 자동 저장한다.

- 문구
- 글자 크기
- 문구 폭
- 텍스트 X/Y 위치
- 글자색
- 정렬
- 굵기
- 화면비
- 배경색

페이지 새로고침 또는 다시 열기 후 마지막 상태를 복구한다.

'새 작업'을 실행하면 자동저장 초안을 제거하고
기존 앱의 기본 상태로 돌아간다.

continuity/TEST-PLAN.md의
T05-01 ~ T05-10 검사는 변경하지 않는다.

---

## 2. 현재 상태

AI A가 localStorage 기반 자동저장 및 복구 기능을 구현했다.

자동저장 키:

memeCardStudioDraftV1

AI A 시작 버전:

22748780f909683deb97618e4afe369f79f5f0b4

AI A 종료 버전:

14c2c82c24e9a8f5c4f8d5f23abd94ebb0fdc2b5

AI A 실제 요청 수:

3회

AI A 실제 작업시간:

27분 12초

검사 실행 회차:

2회

오류 회차:

1회

최종 검사 결과:

10/10 PASS

기존 템플릿 CRUD, JSON 가져오기/내보내기,
이미지 편집, PNG 다운로드 기능은 유지되어 있다.

---

## 3. 실행 명령

저장소의 meme-card-studio 폴더에서 실행한다.

명령:

cd meme-card-studio

python -m http.server 5500

Windows에서 python 명령이 동작하지 않으면:

py -m http.server 5500

브라우저 주소:

http://localhost:5500/

---

## 4. 통과 검사

AI A 최종 검사에서 다음 고정 검사 10개가 모두 PASS였다.

T05-01 — 문구 복구: PASS

T05-02 — 글자 크기 복구: PASS

T05-03 — 문구 폭 복구: PASS

T05-04 — 텍스트 위치 복구: PASS

T05-05 — 글자색 복구: PASS

T05-06 — 정렬과 굵기 복구: PASS

T05-07 — 화면비 복구: PASS

T05-08 — 배경색 복구: PASS

T05-09 — 빈 문구 복구: PASS

T05-10 — 새 작업 후 초안 제거: PASS

고정 검사 원문:

continuity/TEST-PLAN.md

AI A 검사 결과:

continuity/A-TEST-RESULT.md

---

## 5. 남은 문제

현재 AI A 최종 검사에서 확인된 기능 실패는 없다.

다만 AI B의 새 환경 재현 검사는 아직 수행하지 않았다.

AI B는 AI A의 대화 내용을 사용하지 않고
저장소와 이 HANDOFF만으로 같은 고정 검사 10개를 다시 실행해야 한다.

AI B 환경에서 FAIL이 발생하면
검사 기준을 수정하지 말고 실제 구현 문제를 수정한다.

---

## 6. 다음 행동

1. AI B는 저장소의 현재 인수인계 버전을 받는다.

2. AI B는 이 HANDOFF와 저장소만 확인한다.

3. continuity/TEST-PLAN.md의
   T05-01 ~ T05-10을 변경 없이 실행한다.

4. 각 검사를 실제 결과대로 PASS 또는 FAIL로 기록한다.

5. FAIL이 있으면 구현 원인을 확인하고 수정한다.

6. 수정 후에도 동일한 고정 검사 10개를 사용한다.

7. 모두 PASS라면 기능을 완료 상태로 기록한다.

---

## 7. 건드리지 말 것

다음 항목은 변경하지 않는다.

- continuity/TEST-PLAN.md의 검사 10개
- 검사 삭제
- 검사 입력값 변경
- 검사 기대값 변경
- 검사 기대값 완화
- 공통 시간 상한 45분
- 공통 사용자 작업 요청 상한 8회
- 기존 템플릿 CRUD 기능
- JSON 가져오기/내보내기 기능
- 이미지 편집 기능
- PNG 다운로드 기능

AI A의 대화 전문은 AI B에게 제공하지 않는다.

AI B는 저장소와 이 HANDOFF 문서만으로
현재 상태를 파악하고 작업을 이어간다.