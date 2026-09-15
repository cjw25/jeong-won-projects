# T05 HANDOFF

인수인계 기준 버전:
04852db356f32d13d998e1d06572c10deace5042

## 1. 목표

과제 3 「짤·카드 스튜디오」에 현재 편집 초안 자동저장 및 복구 기능을 완성한다.

작업 시작 전에 고정한 T05-T01 ~ T05-T10 검사 10개를 삭제·완화·변경하지 않고 모두 통과시키는 것이 목표다.

## 2. 현재 상태

AI A가 localStorage 기반 초안 자동저장 및 복구 기능을 구현했다.

현재 검사 결과:

- T05-T01 PASS
- T05-T02 PASS
- T05-T03 PASS
- T05-T04 PASS
- T05-T05 PASS
- T05-T06 PASS
- T05-T07 PASS
- T05-T08 PASS
- T05-T09 FAIL
- T05-T10 FAIL

현재 PASS: 8/10

남아 있는 실패는 빈 문구 복구와 새 작업 후 초안 제거다.

## 3. 실행 명령

저장소를 받은 뒤 프로젝트 폴더에서 실행한다.

```bash
cd meme-card-studio
python -m http.server 5500