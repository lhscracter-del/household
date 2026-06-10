---
name: design-conventions-household
description: household 프론트엔드(StatsPage 등)의 Tailwind 카드/헤더/컬러 클래스 컨벤션
metadata:
  type: project
---

household 프론트엔드(/Users/hansol/project/CLAUDECODE/household/frontend/src)는 Tailwind CSS + dark mode를 사용하며 다음 패턴이 반복됨:

- 카드 컨테이너: `bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5`
- 섹션/카드 제목: `text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 sm:mb-4` (또는 `mb-4`)
- select 등 입력 요소: `px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100`
- 탭 스타일: `flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5` + 활성 탭 `bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm`
- 차트 컴포넌트(`src/components/stats/CategoryChart.jsx`, `PaymentChart.jsx`)는 각자 자체 `COLORS` 배열을 정의해 recharts `Cell`에 인덱스 순서로 적용 — 일반 지출/반복지출 양쪽에 동일 팔레트를 공유 중 (개선 여지, [[stats_page_section_grouping]] 참고)
- 빈 상태는 `src/components/common/EmptyState.jsx` (📭 + 메시지), 로딩은 `Spinner` 공통 컴포넌트 사용

**Why**: 새 섹션/컴포넌트 제안 시 이 클래스 패턴을 그대로 따라야 기존 화면과 톤이 어긋나지 않음.

**How to apply**: StatsPage 외 다른 페이지(가계부 입력, 카테고리 관리 등) 검토 시에도 동일한 카드/제목/탭 클래스 패턴이 쓰이는지 먼저 확인하고, 새 클래스 제안은 이 패턴을 확장하는 형태로 제시할 것.
