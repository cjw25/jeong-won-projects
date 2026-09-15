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

```bash
cd meme-card-studio
python -m http.server 5500