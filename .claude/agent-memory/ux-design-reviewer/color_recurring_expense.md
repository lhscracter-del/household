---
name: color-recurring-expense
description: household 프로젝트의 "반복지출" 의미 색상 토큰 결정 (purple -> emerald/teal), expense 팔레트와의 충돌 회피 전략
metadata:
  type: project
---

household 가계부 앱에서 "반복지출(고정지출)" UI 요소의 의미 색상을 purple 계열에서 emerald/teal 계열로 통일하기로 함 (2026-06-10 검토).

**확정 톤 (Tailwind 클래스 기준)**
- 섹션 배경/보더/텍스트: `emerald-50/40`, `emerald-100`, `emerald-700/300`, `emerald-400`, `emerald-900/10`, `emerald-800/40` — 기존 purple 단계와 1:1 매핑
- CategoryChart recurring 팔레트: `['#14B8A6', '#047857', '#0F766E', '#6EE7B7', '#0E7490', '#5EEAD4', '#16A34A', '#166534', '#6B7280']`
- PaymentChart recurring 팔레트: `['#0F766E', '#16A34A', '#047857', '#0E7490', '#166534', '#6EE7B7']`

**Why**: expense 팔레트(특히 PaymentChart의 `#10B981` emerald-500, `#22C55E` green-500)와 hue가 겹치면 "일반 지출" vs "반복지출" 차트를 사용자가 혼동할 수 있음. 반복지출 팔레트는 진하고 차분한 teal/emerald 600~800 계열을 1순위로 배치해 expense의 밝은 색군과 의도적으로 분리.

**How to apply**: 앞으로 "반복지출/고정지출/구독" 관련 UI(배경, 텍스트, 배지, 차트, 막대그래프)에 색을 입힐 때는 이 emerald/teal 톤을 기본값으로 사용. 새로운 의미 색상(예: "예산 초과=red", "월 지출=blue")과 동시에 한 화면에 배치될 때 hue 거리 확인 필요.

영향 파일:
- /Users/hansol/project/CLAUDECODE/household/frontend/src/pages/StatsPage.jsx (반복지출 섹션, 140~188행대)
- /Users/hansol/project/CLAUDECODE/household/frontend/src/pages/DashboardPage.jsx (고정 지출 카드 80~85행, 리스트 169~180행)
- /Users/hansol/project/CLAUDECODE/household/frontend/src/components/stats/CategoryChart.jsx (COLOR_SCHEMES.recurring)
- /Users/hansol/project/CLAUDECODE/household/frontend/src/components/stats/PaymentChart.jsx (COLOR_SCHEMES.recurring)
