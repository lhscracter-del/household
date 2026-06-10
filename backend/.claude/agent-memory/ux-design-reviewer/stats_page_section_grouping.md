---
name: stats-page-section-grouping
description: StatsPage의 일반 지출 vs 반복지출 섹션 시각 구분 개선 제안 이력
metadata:
  type: project
---

2026-06-10, StatsPage.jsx에서 백엔드가 expense_total/recurring_total을 분리 응답하면서, "일반 지출"과 "반복지출" 섹션이 섹션 제목 텍스트 외에는 시각적으로 구분되지 않는 문제가 있었음.

당시 상태:
- 두 섹션 모두 동일한 카드 스타일(`bg-white dark:bg-gray-800 rounded-xl border ... p-4 sm:p-5`) 사용
- CategoryChart/PaymentChart의 COLORS 팔레트를 양쪽이 공유 (같은 색이 다른 의미로 쓰일 수 있음)
- 막대형 상세 리스트만 `bg-blue-400`(일반) / `bg-purple-400`(반복)으로 색이 이미 구분되어 있었음 — 일관성 절반만 적용된 상태

제안한 우선순위:
1. 반복지출 섹션 전체를 `bg-purple-50/40 dark:bg-purple-900/10` + 점선/연한 보라 보더로 감싸고 그룹 헤더(아이콘+라벨, 예: 🔁 반복지출 통계) 추가. 일반 지출 섹션도 대칭으로 헤더(💳 일반 지출 통계) 추가
2. CategoryChart/PaymentChart에 `colorScheme` prop 추가해 expense=파랑 계열, recurring=보라 계열(`#8B5CF6` 등) 팔레트 분리 — 막대 리스트의 기존 blue/purple 구분과 통일
3. 카드 제목 옆 작은 배지(`badge` prop, 예: "구독/정기결제") + 막대 색상 톤을 `bg-purple-500`으로 미세 조정

**Why**: 사용자가 "섹션 구분이 안 돼서 헷갈린다"고 명시적으로 피드백. 막대 리스트에는 이미 색 구분 관례가 있었으므로 이를 전체로 확장하는 방향이 최소 변경으로 가장 효과적.

**How to apply**: 향후 통계 화면에 새 섹션(예: 예산 대비 비교 등)을 추가할 때도 "그룹 wrapper + 컬러 테마 + 아이콘 라벨" 패턴을 재사용할 수 있음. [[design_conventions_household]]의 기본 카드 패턴 위에 색조만 다르게 입히는 식.
