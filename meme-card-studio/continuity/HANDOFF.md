# T05 HANDOFF

인수인계 대상 코드 버전:
04852db356f32d13d998e1d06572c10deace5042

## 목표

과제 3 「짤·카드 스튜디오」의
현재 편집 초안 자동저장 및 복구 기능을 완성한다.

continuity/TEST-PLAN.md에 작업 전에 고정한
T05-T01 ~ T05-T10 총 10개 검사를 그대로 사용한다.

검사 삭제, 완화, 기대값 변경은 하지 않는다.

## 현재 상태

AI A가 localStorage 기반의
현재 편집 초안 자동저장 및 복구 기능을 1차 구현했다.

AI A 종료 코드 버전:

04852db356f32d13d998e1d06572c10deace5042

고정 검사 결과는
continuity/A-TEST-RESULT.md를 기준으로 한다.

## 실행 명령

저장소를 받은 새 작업 폴더에서 다음 명령을 실행한다.

```bash
cd meme-card-studio
python -m http.server 5500