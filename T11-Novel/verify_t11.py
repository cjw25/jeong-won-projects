from pathlib import Path
import re
import sys
import unicodedata

TARGET = (
    Path(sys.argv[1])
    if len(sys.argv) > 1
    else Path("최정원_장편소설.md")
)

if not TARGET.exists():
    print(f"[FAIL] 파일이 없습니다: {TARGET}")
    raise SystemExit(1)

text = TARGET.read_text(encoding="utf-8-sig")

START = "[[ALEPH_BODY_START]]"
END = "[[ALEPH_BODY_END]]"

errors = []

# -------------------------------------------------
# 1. 본문 경계 검사
# -------------------------------------------------

start_count = text.count(START)
end_count = text.count(END)

if start_count != 1:
    errors.append(
        f"본문 시작 표시가 정확히 1회가 아님: {start_count}회"
    )

if end_count != 1:
    errors.append(
        f"본문 끝 표시가 정확히 1회가 아님: {end_count}회"
    )

body = ""

if start_count == 1 and end_count == 1:
    start_pos = text.index(START)
    end_pos = text.index(END)

    if start_pos >= end_pos:
        errors.append(
            "본문 시작 표시가 본문 끝 표시보다 뒤에 있습니다."
        )
    else:
        body = text[
            start_pos + len(START):
            end_pos
        ]


# -------------------------------------------------
# 2. 본문 30,000자 검사
# NFC 정규화 후 Unicode White_Space 제거
# -------------------------------------------------

body_count = 0

if body:
    normalized = unicodedata.normalize(
        "NFC",
        body
    )

    without_space = "".join(
        ch
        for ch in normalized
        if not ch.isspace()
    )

    body_count = len(without_space)

    if body_count < 30000:
        errors.append(
            f"본문 글자 수 부족: "
            f"{body_count:,} / 30,000 "
            f"(부족 {30000 - body_count:,}자)"
        )


# -------------------------------------------------
# 3. 본문 장 수와 순서
# -------------------------------------------------

chapter_pattern = re.compile(
    r"(?m)^# 제(\d+)장\s+(.+?)\s*$"
)

chapter_matches = chapter_pattern.findall(body)

chapter_numbers = [
    int(num)
    for num, title in chapter_matches
]

chapter_titles = [
    title.strip()
    for num, title in chapter_matches
]

if len(chapter_matches) < 10:
    errors.append(
        f"본문 장 수 부족: {len(chapter_matches)}장"
    )

if chapter_numbers:
    expected = list(
        range(
            1,
            len(chapter_numbers) + 1
        )
    )

    if chapter_numbers != expected:
        errors.append(
            f"장 번호 순서 오류: {chapter_numbers}"
        )


# -------------------------------------------------
# 4. 목차와 본문 비교
# -------------------------------------------------

toc_titles = []

lines = text.splitlines()

toc_start = None

for i, line in enumerate(lines):
    if line.strip() == "## 목차":
        toc_start = i + 1
        break

if toc_start is None:

    errors.append(
        "목차를 찾지 못했습니다."
    )

else:

    for line in lines[toc_start:]:

        stripped = line.strip()

        # 다음 ## 제목이 나오면 목차 종료
        if stripped.startswith("## "):
            break

        m = re.match(
            r"^\d+\.\s+(.+?)\s*$",
            stripped
        )

        if m:
            toc_titles.append(
                m.group(1).strip()
            )

    if not toc_titles:

        errors.append(
            "목차 항목을 찾지 못했습니다."
        )

    elif len(toc_titles) != len(chapter_titles):

        errors.append(
            f"목차 {len(toc_titles)}개 / "
            f"본문 {len(chapter_titles)}개 불일치"
        )

    elif toc_titles != chapter_titles:

        errors.append(
            "목차와 본문의 장 제목 또는 순서가 다릅니다."
        )

# -------------------------------------------------
# 5. 빈 장 검사
# -------------------------------------------------

chapter_headers = list(
    chapter_pattern.finditer(body)
)

for i, match in enumerate(chapter_headers):

    end = (
        chapter_headers[i + 1].start()
        if i + 1 < len(chapter_headers)
        else len(body)
    )

    chapter_body = body[
        match.end():
        end
    ]

    chapter_body = re.sub(
        r'<a\s+id="[^"]+"></a>',
        "",
        chapter_body,
        flags=re.I
    )

    chapter_body = "".join(
        ch
        for ch in chapter_body
        if not ch.isspace()
    )

    if len(chapter_body) < 100:

        errors.append(
            f"{i + 1}장 본문이 비어 있거나 너무 짧습니다."
        )


# -------------------------------------------------
# 6. 미완성 표시 검사
# 문자열은 분리해서 검사 코드 자체에서 오탐 방지
# -------------------------------------------------

forbidden = [
    "TO" + "DO",
    "T" + "BD",
    "FIX" + "ME",
    "자리" + " 표시",
    "내용" + " 추가 예정",
    ]

for term in forbidden:

    if term.isascii():

        found = (
                term.lower()
                in text.lower()
        )

    else:

        found = term in text

    if found:

        errors.append(
            f"미완성 표시 발견: {term}"
        )


# -------------------------------------------------
# 7. 동일 문단 검사
#
# NFKC
# → 소문자
# → Unicode White_Space 제거
# → Unicode Punctuation 제거
# → 40코드포인트 이상 비교
# -------------------------------------------------

duplicate_pairs = []

if body:

    paragraphs = [
        p.strip()
        for p in re.split(
            r"\n\s*\n",
            body
        )
        if p.strip()
    ]

    seen = {}

    for index, paragraph in enumerate(
            paragraphs,
            start=1
    ):

        normalized = unicodedata.normalize(
            "NFKC",
            paragraph
        ).lower()

        normalized = "".join(
            ch
            for ch in normalized
            if (
                    not ch.isspace()
                    and not unicodedata
                    .category(ch)
                    .startswith("P")
            )
        )

        if len(normalized) < 40:
            continue

        if normalized in seen:

            duplicate_pairs.append(
                (
                    seen[normalized],
                    index
                )
            )

        else:

            seen[normalized] = index

if duplicate_pairs:

    errors.append(
        f"동일한 정규화 문단 "
        f"{len(duplicate_pairs)}쌍 발견: "
        f"{duplicate_pairs[:10]}"
    )


# -------------------------------------------------
# 8. 문단 앵커 검사
# -------------------------------------------------

anchors = re.findall(
    r'id="(CH\d{2}-P\d{3})"',
    body
)

if len(anchors) != len(set(anchors)):

    errors.append(
        "중복 문단 앵커가 있습니다."
    )


# -------------------------------------------------
# 9. 대조표 다섯 범주 확인
# -------------------------------------------------

categories = [
    "인물",
    "관계",
    "지명",
    "시간선",
    "세계 규칙",
]

for category in categories:

    if category not in text:

        errors.append(
            f"대조표 범주 누락: {category}"
        )


# -------------------------------------------------
# 10. 첫 장 주인공 이름 확인
# -------------------------------------------------

first_chapter = re.search(
    r"(?ms)^# 제1장 .+?"
    r"(?=^# 제2장 |\Z)",
    body
)

if (
        first_chapter is None
        or "최정원"
        not in first_chapter.group(0)
):

    errors.append(
        "제1장에서 주인공 이름 "
        "'최정원'을 확인하지 못했습니다."
    )


# -------------------------------------------------
# 결과
# -------------------------------------------------

print()
print("=" * 62)
print(" T11 장편소설 자동 검사")
print("=" * 62)

print(f"파일: {TARGET}")
print(
    f"본문 글자 수 "
    f"(NFC + 공백 제거): "
    f"{body_count:,}"
)
print(
    f"본문 장 수: "
    f"{len(chapter_matches)}"
)
print(
    f"본문 시작 표시: "
    f"{start_count}회"
)
print(
    f"본문 끝 표시: "
    f"{end_count}회"
)
print(
    f"문단 앵커: "
    f"{len(anchors)}개"
)
print(
    f"동일 정규화 문단: "
    f"{len(duplicate_pairs)}쌍"
)

print("-" * 62)

if errors:

    print("[FAIL]")

    for error in errors:
        print(f"- {error}")

    raise SystemExit(1)

else:

    print("[PASS]")
    print("- 본문 30,000자 이상")
    print("- 본문 10장 이상")
    print("- 목차와 본문 일치")
    print("- 본문 경계 표시 정상")
    print("- 미완성 표시 없음")
    print("- 동일 문단 없음")
    print("- 문단 앵커 기본 검사 정상")
    print("- 대조표 5개 범주 확인")
    print("- 제1장 주인공 이름 확인")